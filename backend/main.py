import json
import asyncio
from datetime import datetime
from typing import Dict, Set
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import init_db, get_db, Document, Revision, SessionLocal
from models import (
    InitResponse, UpdateResponse, UserJoinedResponse, UserLeftResponse,
    SavedResponse, ErrorResponse, DocumentResponse, RevisionResponse
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.current_content: str = ""
        self.last_edited_by: str | None = None
        self.last_edited_at: datetime | None = None
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        async with self.lock:
            self.active_connections[user_id] = websocket

    async def disconnect(self, user_id: str):
        async with self.lock:
            if user_id in self.active_connections:
                del self.active_connections[user_id]

    def get_users(self) -> list[str]:
        return list(self.active_connections.keys())

    async def send_personal(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception:
                pass

    async def broadcast(self, message: dict, exclude_user: str | None = None):
        disconnected = []
        for user_id, connection in self.active_connections.items():
            if user_id != exclude_user:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(user_id)

        for user_id in disconnected:
            self.disconnect(user_id)

    async def broadcast_all(self, message: dict):
        await self.broadcast(message, exclude_user=None)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == "main").first()
        if doc:
            manager.current_content = doc.content
            manager.last_edited_by = doc.last_edited_by
            manager.last_edited_at = doc.updated_at
    finally:
        db.close()

    yield


app = FastAPI(
    title="Collaborative Document Editor API",
    description="Real-time collaborative editing backend",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/document", response_model=DocumentResponse)
async def get_document(db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == "main").first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@app.get("/api/revisions", response_model=list[RevisionResponse])
async def get_revisions(limit: int = 10, db: Session = Depends(get_db)):
    revisions = (
        db.query(Revision)
        .filter(Revision.document_id == "main")
        .order_by(Revision.created_at.desc())
        .limit(limit)
        .all()
    )
    return revisions


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)

    try:
        init_message = InitResponse(
            content=manager.current_content,
            users=manager.get_users(),
            lastEditedBy=manager.last_edited_by,
            lastEditedAt=manager.last_edited_at.isoformat() if manager.last_edited_at else None
        )
        await manager.send_personal(init_message.model_dump(), user_id)

        join_message = UserJoinedResponse(
            userId=user_id,
            users=manager.get_users()
        )
        await manager.broadcast(join_message.model_dump(), exclude_user=user_id)

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "update":
                await handle_update(message, user_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        leave_message = UserLeftResponse(
            userId=user_id,
            users=manager.get_users()
        )
        await manager.broadcast_all(leave_message.model_dump())

    except Exception as e:
        manager.disconnect(user_id)
        print(f"WebSocket error for user {user_id}: {e}")


async def handle_update(message: dict, user_id: str):
    content = message.get("content", "")
    timestamp = message.get("timestamp", int(datetime.utcnow().timestamp() * 1000))

    async with manager.lock:
        manager.current_content = content
        manager.last_edited_by = user_id
        manager.last_edited_at = datetime.utcnow()

    update_response = UpdateResponse(
        content=content,
        userId=user_id,
        timestamp=timestamp
    )
    await manager.broadcast(update_response.model_dump(), exclude_user=user_id)

    await persist_document(content, user_id)

    saved_response = SavedResponse(
        timestamp=datetime.utcnow().isoformat()
    )
    await manager.send_personal(saved_response.model_dump(), user_id)


async def persist_document(content: str, user_id: str):
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == "main").first()
        if doc:
            if doc.content != content:
                revision = Revision(
                    document_id="main",
                    content=content,
                    edited_by=user_id
                )
                db.add(revision)

                doc.content = content
                doc.last_edited_by = user_id
                doc.updated_at = datetime.utcnow()

                db.commit()

                revision_count = db.query(Revision).filter(Revision.document_id == "main").count()
                if revision_count > 50:
                    oldest = (
                        db.query(Revision)
                        .filter(Revision.document_id == "main")
                        .order_by(Revision.created_at.asc())
                        .limit(revision_count - 50)
                        .all()
                    )
                    for rev in oldest:
                        db.delete(rev)
                    db.commit()
    except Exception as e:
        print(f"Database error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
