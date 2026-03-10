'use client';

import { Menu, User } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useUser();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
          <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    </header>
  );
}
