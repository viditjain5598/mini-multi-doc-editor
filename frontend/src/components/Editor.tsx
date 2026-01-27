'use client';

import { useCallback } from 'react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  disabled?: boolean;
}

export function Editor({ content, onChange, disabled = false }: EditorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <textarea
        value={content}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Start typing to collaborate..."
        className={`
          flex-1 w-full p-4
          font-mono text-base leading-relaxed
          bg-white dark:bg-gray-900
          text-gray-900 dark:text-gray-100
          border-0 outline-none resize-none
          placeholder:text-gray-400 dark:placeholder:text-gray-600
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        spellCheck={false}
        autoFocus
      />
    </div>
  );
}
