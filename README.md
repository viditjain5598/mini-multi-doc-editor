# Mini Multiplayer Document Editor

A prototype for a real-time collaborative document editor that allows multiple users to edit the same document simultaneously with live updates.

## Features

- **Real-time Collaboration**: Multiple users can edit simultaneously, seeing each other's changes instantly
- **Presence Awareness**: Shows connected users with unique color indicators
- **Connection Status**: Visual indicator showing connected/reconnecting/disconnected states
- **Save Status**: Shows "Saving..." / "Saved X ago" for user confidence
- **Auto-Reconnect**: Automatic reconnection with exponential backoff on connection loss
- **Persistence**: Document state persists in SQLite database across refreshes

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Python FastAPI, WebSockets |
| Database | SQLite with SQLAlchemy |

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and start virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Testing Collaboration

1. Open `http://localhost:3000` in multiple browser windows
2. Start typing in one window
3. Watch changes appear in real-time in other windows
4. Refresh any window to verify persistence

## API Reference

### WebSocket Endpoint

`ws://localhost:8000/ws/{user_id}`

#### Client to Server Messages

```typescript
{ type: "update", content: string, timestamp: number }
```

#### Server to Client Messages

```typescript
{ type: "init", content: string, users: string[], lastEditedBy: string, lastEditedAt: string }
{ type: "update", content: string, userId: string, timestamp: number }
{ type: "user_joined", userId: string, users: string[] }
{ type: "user_left", userId: string, users: string[] }
{ type: "saved", timestamp: string }
```

### HTTP Endpoints

- `GET /health` - Health check
- `GET /api/document` - Get current document state
- `GET /api/revisions?limit=10` - Get revision history
