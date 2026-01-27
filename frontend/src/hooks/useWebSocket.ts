'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, ServerMessage, UpdateMessage } from '@/lib/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
const RECONNECT_INITIAL_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

interface UseWebSocketOptions {
  userId: string;
  onMessage: (message: ServerMessage) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

interface UseWebSocketReturn {
  sendUpdate: (content: string) => void;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
}

export function useWebSocket({
  userId,
  onMessage,
  onConnectionChange,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_INITIAL_DELAY);
  const isUnmountedRef = useRef(false);

  const updateConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    onConnectionChange?.(status);
  }, [onConnectionChange]);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    updateConnectionStatus('connecting');

    const ws = new WebSocket(`${WS_URL}/${userId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (isUnmountedRef.current) {
        ws.close();
        return;
      }
      updateConnectionStatus('connected');
      reconnectDelayRef.current = RECONNECT_INITIAL_DELAY;
    };

    ws.onmessage = (event) => {
      if (isUnmountedRef.current) return;
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        onMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      if (isUnmountedRef.current) return;

      if (!event.wasClean) {
        updateConnectionStatus('reconnecting');
        scheduleReconnect();
      } else {
        updateConnectionStatus('disconnected');
      }
    };

    ws.onerror = () => {
      if (isUnmountedRef.current) return;
    };
  }, [userId, onMessage, updateConnectionStatus]);

  const scheduleReconnect = useCallback(() => {
    if (isUnmountedRef.current) return;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        RECONNECT_MAX_DELAY
      );
    }, reconnectDelayRef.current);
  }, [connect]);

  const sendUpdate = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: UpdateMessage = {
        type: 'update',
        content,
        timestamp: Date.now(),
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const reconnect = useCallback(() => {
    reconnectDelayRef.current = RECONNECT_INITIAL_DELAY;
    connect();
  }, [connect]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [connect]);

  return {
    sendUpdate,
    connectionStatus,
    reconnect,
  };
}
