'use client';

interface PresenceBarProps {
  users: string[];
  currentUserId: string;
}

export function PresenceBar({ users, currentUserId }: PresenceBarProps) {
  const getUserColor = (userId: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getDisplayName = (userId: string): string => {
    if (userId === currentUserId) return 'You';
    return userId;
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
        {users.length} {users.length === 1 ? 'user' : 'users'} online:
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {users.map((userId) => (
          <div
            key={userId}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm"
          >
            <span
              className={`w-2 h-2 rounded-full ${getUserColor(userId)}`}
              aria-hidden="true"
            />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {getDisplayName(userId)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
