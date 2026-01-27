from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = "sqlite:///./editor.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default="main")
    content = Column(Text, nullable=False, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_edited_by = Column(String, nullable=True)

    revisions = relationship("Revision", back_populates="document")


class Revision(Base):
    __tablename__ = "revisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    edited_by = Column(String, nullable=True)

    document = relationship("Document", back_populates="revisions")


def init_db():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == "main").first()
        if not doc:
            doc = Document(
                id="main",
                content="# Welcome to the Collaborative Editor\n\nStart typing to collaborate in real-time!",
                last_edited_by=None
            )
            db.add(doc)
            db.commit()
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
