'use client';

import { useEffect, useState } from 'react';
import type { ConnectionStatus, SaveStatus } from '@/lib/types';

interface StatusBarProps {
  connectionStatus: ConnectionStatus;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  lastEditedBy: string | null;
  lastEditedAt: Date | null;
  currentUserId: string;
  onReconnect?: () => void;
}

export function StatusBar({
  connectionStatus,
  saveStatus,
  lastSavedAt,
  lastEditedBy,
  lastEditedAt,
  currentUserId,
  onReconnect,
}: StatusBarProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (date: Date | null): string => {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getConnectionDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Connected</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span>Connecting...</span>
          </div>
        );
      case 'reconnecting':
        return (
          <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span>Reconnecting...</span>
            {onReconnect && (
              <button
                onClick={onReconnect}
                className="ml-1 text-xs underline hover:no-underline"
              >
                Retry now
              </button>
            )}
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Disconnected</span>
            {onReconnect && (
              <button
                onClick={onReconnect}
                className="ml-1 text-xs underline hover:no-underline"
              >
                Reconnect
              </button>
            )}
          </div>
        );
    }
  };

  const getSaveDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="text-gray-500 dark:text-gray-400">Saving...</span>
        );
      case 'saved':
        return (
          <span className="text-gray-500 dark:text-gray-400">
            Saved {getRelativeTime(lastSavedAt)}
          </span>
        );
      case 'error':
        return (
          <span className="text-red-500 dark:text-red-400">
            Save failed
          </span>
        );
      default:
        return null;
    }
  };

  const getLastEditedDisplay = () => {
    if (!lastEditedBy || !lastEditedAt) return null;

    const editor = lastEditedBy === currentUserId ? 'you' : lastEditedBy;

    return (
      <span className="text-gray-400 dark:text-gray-500">
        Edited by {editor} {getRelativeTime(lastEditedAt)}
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm">
      <div className="flex items-center gap-4">
        {getConnectionDisplay()}
        {getSaveDisplay()}
      </div>
      <div>
        {getLastEditedDisplay()}
      </div>
    </div>
  );
}
