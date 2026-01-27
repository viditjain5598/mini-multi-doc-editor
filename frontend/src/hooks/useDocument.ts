'use client';

import { useCallback, useRef, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import type { ConnectionStatus, SaveStatus, ServerMessage } from '@/lib/types';

const DEBOUNCE_MS = 300;

interface UseDocumentOptions {
  userId: string;
}

interface UseDocumentReturn {
  content: string;
  users: string[];
  connectionStatus: ConnectionStatus;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  lastEditedBy: string | null;
  lastEditedAt: Date | null;
  handleContentChange: (newContent: string) => void;
  reconnect: () => void;
}

export function useDocument({ userId }: UseDocumentOptions): UseDocumentReturn {
  const [content, setContent] = useState('');
  const [users, setUsers] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastEditedBy, setLastEditedBy] = useState<string | null>(null);
  const [lastEditedAt, setLastEditedAt] = useState<Date | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentContentRef = useRef<string>('');

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'init':
        setContent(message.content);
        setUsers(message.users);
        lastSentContentRef.current = message.content;
        if (message.lastEditedBy) {
          setLastEditedBy(message.lastEditedBy);
        }
        if (message.lastEditedAt) {
          setLastEditedAt(new Date(message.lastEditedAt));
        }
        break;

      case 'update':
        setContent(message.content);
        lastSentContentRef.current = message.content;
        setLastEditedBy(message.userId);
        setLastEditedAt(new Date(message.timestamp));
        break;

      case 'user_joined':
        setUsers(message.users);
        break;

      case 'user_left':
        setUsers(message.users);
        break;

      case 'saved':
        setSaveStatus('saved');
        setLastSavedAt(new Date(message.timestamp));
        break;

      case 'error':
        setSaveStatus('error');
        console.error('Server error:', message.message);
        break;
    }
  }, []);

  const { sendUpdate, connectionStatus, reconnect } = useWebSocket({
    userId,
    onMessage: handleMessage,
  });

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setSaveStatus('saving');
    setLastEditedBy(userId);
    setLastEditedAt(new Date());

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (newContent !== lastSentContentRef.current) {
        sendUpdate(newContent);
        lastSentContentRef.current = newContent;
      }
    }, DEBOUNCE_MS);
  }, [userId, sendUpdate]);

  return {
    content,
    users,
    connectionStatus,
    saveStatus,
    lastSavedAt,
    lastEditedBy,
    lastEditedAt,
    handleContentChange,
    reconnect,
  };
}
