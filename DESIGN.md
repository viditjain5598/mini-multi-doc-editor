# Design Document

## Architecture Overview

The application follows a client-server architecture with WebSocket-based real-time communication

## Tech Choices and Trade-offs

### Why FastAPI + WebSockets?

**Pros:**
- Native async support makes WebSocket handling very efficient
- Pydantic integration provides automatic validation for data schema
- Matches Medly's Python stack, good learning opportunty

**Cons:**
- Not as common/industry-standard for WebSockets as Node.js/Socket.io
- Python's GIL limits CPU-bound parallelism (not an issue here as same bottleneck exists on db)

### Why SQLite?

**Pros:**
- No configuration needed, runs anywhere
- Single file database, easy to inspect/debug
- Sufficient for demo scale (single document, few users)
- No external service dependencies

**Cons:**
- Single-writer limitation
- Not suitable for horizontal scaling
- Would be replaced with PostgreSQL (maybe Cassandra? give write heavy workflow) in production

### Why Last-Write-Wins over CRDTs?

**Pros:**
- Simple to implement and understand
- Predictable behavior
- Server is always authoritative (easy debugging)
- No complex merge logic

**Cons:**
- Concurrent edits can overwrite each other
- Brief flicker when reconciling states
- Not suitable for heavy concurrent editing

**Mitigation:**
- 300ms debounce reduces update frequency
- Immediate broadcast minimizes conflict window
- Status indicators keep users informed

## Conflict Handling Approach

### Strategy: Server-Authoritative Last-Write-Wins

1. **Client edits locally** (optimistic update)
2. **Client sends update** (debounced 300ms)
3. **Server updates state** and broadcasts to other clients
4. **Server persists to DB** and sends confirmation
5. **Other clients apply update** (may overwrite local changes)

### Limitations

- If User A and User B type simultaneously, one edit may be lost
- No character-level or line-level merging
- Ideally would work best for turn-taking or non-overlapping edits based workflows

### Why This Works for the Demo

- Conflict window is small (~300ms debounce + network latency)
- Visual indicators (presence, status) encourage turn-taking
- Adding CRDTs would triple complexity without proportional value

## Scalability Analysis

**Horizontal Scaling:**
1. Replace SQLite with PostgreSQL
2. Add Redis pub/sub for cross-server broadcasting
3. Run multiple backend instances behind load balancer
4. Use sticky sessions for WebSocket routing

**Performance Scaling:**
1. Add delta-based updates (only send changes)
2. Implement operational transform or CRDTs
3. Add caching layer for document reads
4. Use connection pooling for DB

### Reliability Considerations

**Current Reliability:**
- Single server = single point of failure
- SQLite file = data durability depends on disk
- In-memory state = lost on server restart (recovered from DB)

**Production Improvements:**
1. Database replication (PostgreSQL streaming replication)
2. Multiple server instances with Redis coordination
3. Health checks and automatic failover
4. Persistent connection state in Redis

## Product Polish Choices

### 1. Connection Status Indicator

**Why:** Essential for collaborative apps. Users need to know if their edits are being shared.

**Implementation:**
- Green pulsing dot = Connected
- Yellow pulsing dot = Connecting/Reconnecting
- Red dot = Disconnected (with retry button)

### 2. Save Status Indicator

**Why:** Build trust that data won't be lost and improve situational awareness of user for the same.

**Implementation:**
- "Saving..." during pending operations
- "Saved Xs ago" with relative timestamps
- Updates every second for live feel

## Known Limitations

1. **Single document only** - No multi-document or folder support
2. **No authentication** - Users identified by random session IDs
3. **No cursor sync** - Users can't see where others are typing
4. **Basic conflict resolution** - Concurrent edits may overwrite
5. **No undo/redo** - Standard text area undo only
6. **SQLite scaling** - Single-writer, single-file limitations

## What I Would Do Next (with more time)

### High Priority

1. **Implement Yjs CRDT** - Proper conflict-free collaborative editing
2. **Add cursor presence** - Show where other users are typing
3. **User authentication** - Real user accounts with OAuth, edit audit trails

### Medium Priority

4. **Multi-document support** - Document list with create/delete
5. **Undo/redo sync** - Collaborative undo that respects all users
6. **Rich text editing** - Markdown or WYSIWYG with TipTap/ProseMirror

### Production Readiness

7. **PostgreSQL migration** - For durability and scaling
8. **Redis pub/sub** - For multi-server broadcasting
9. **Comprehensive tests** - Unit, integration, E2E (Selenium)
10. **Error tracking** - Sentry integration
11. **Metrics/monitoring** - Prometheus, Grafana

