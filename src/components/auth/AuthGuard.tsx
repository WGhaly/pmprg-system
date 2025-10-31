'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import LoginForm from './LoginForm';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  // Temporarily disabled for testing
  // const { isAuthenticated, login } = useAuth();

  // if (!isAuthenticated) {
  //   return <LoginForm onLogin={login} />;
  // }

  return <>{children}</>;
}