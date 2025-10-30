'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <User className="h-4 w-4" />
        <span>Welcome, {user.username}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={logout}
        className="flex items-center space-x-1"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </Button>
    </div>
  );
}