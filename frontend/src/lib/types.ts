export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface JoinMessage {
  type: 'join';
  userId: string;
}

export interface UpdateMessage {
  type: 'update';
  content: string;
  timestamp: number;
}

export type ClientMessage = JoinMessage | UpdateMessage;

export interface InitMessage {
  type: 'init';
  content: string;
  users: string[];
  lastEditedBy: string | null;
  lastEditedAt: string | null;
}

export interface UpdateResponseMessage {
  type: 'update';
  content: string;
  userId: string;
  timestamp: number;
}

export interface UserJoinedMessage {
  type: 'user_joined';
  userId: string;
  users: string[];
}

export interface UserLeftMessage {
  type: 'user_left';
  userId: string;
  users: string[];
}

export interface SavedMessage {
  type: 'saved';
  timestamp: string;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type ServerMessage =
  | InitMessage
  | UpdateResponseMessage
  | UserJoinedMessage
  | UserLeftMessage
  | SavedMessage
  | ErrorMessage;

export interface DocumentState {
  content: string;
  lastEditedBy: string | null;
  lastEditedAt: Date | null;
}

export interface AppState {
  document: DocumentState;
  users: string[];
  connectionStatus: ConnectionStatus;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  userId: string;
}
