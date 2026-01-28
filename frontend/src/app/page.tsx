'use client';

import { useMemo } from 'react';
import { Header } from '@/components/Header';
import { Editor } from '@/components/Editor';
import { PresenceBar } from '@/components/PresenceBar';
import { StatusBar } from '@/components/StatusBar';
import { useDocument } from '@/hooks/useDocument';

const ADJECTIVES = [
  'Swift', 'Clever', 'Brave', 'Calm', 'Bright', 'Bold', 'Quick', 'Wise',
  'Happy', 'Lucky', 'Gentle', 'Keen', 'Noble', 'Witty', 'Jolly', 'Merry'
];

const ANIMALS = [
  'Panda', 'Fox', 'Owl', 'Tiger', 'Eagle', 'Dolphin', 'Wolf', 'Bear',
  'Hawk', 'Lion', 'Falcon', 'Otter', 'Raven', 'Lynx', 'Badger', 'Koala'
];

function generateRandomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective} ${animal}`;
}

export default function Home() {
  const userId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('collab-editor-user-name');
      if (stored) return stored;

      const newName = generateRandomName();
      sessionStorage.setItem('collab-editor-user-name', newName);
      return newName;
    }
    return generateRandomName();
  }, []);

  const {
    content,
    users,
    connectionStatus,
    saveStatus,
    lastSavedAt,
    lastEditedBy,
    lastEditedAt,
    handleContentChange,
    reconnect,
  } = useDocument({ userId });

  const isDisabled = connectionStatus === 'disconnected';

  return (
    <main className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <PresenceBar users={users} currentUserId={userId} />
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900">
        <Editor
          content={content}
          onChange={handleContentChange}
          disabled={isDisabled}
        />
      </div>
      <StatusBar
        connectionStatus={connectionStatus}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        lastEditedBy={lastEditedBy}
        lastEditedAt={lastEditedAt}
        currentUserId={userId}
        onReconnect={reconnect}
      />
    </main>
  );
}
