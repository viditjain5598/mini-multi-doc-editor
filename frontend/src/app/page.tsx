'use client';

import { useState, useEffect } from 'react';
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

function EditorContent({ userId }: { userId: string }) {
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

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('collab-editor-user-name');
    if (stored) {
      setUserId(stored);
    } else {
      const newName = generateRandomName();
      sessionStorage.setItem('collab-editor-user-name', newName);
      setUserId(newName);
    }
  }, []);

  if (!userId) {
    return (
      <main className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </main>
    );
  }

  return <EditorContent userId={userId} />;
}
