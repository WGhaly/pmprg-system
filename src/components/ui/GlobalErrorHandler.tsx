'use client';

import { useGlobalErrorHandler, useApiEventHandler } from '@/hooks/useGlobalErrorHandler';

/**
 * Global Error Handler Component
 * Initializes global error handling and API event handling for the entire application
 * Should be placed near the top of the component tree, inside ToastProvider
 */
export default function GlobalErrorHandler() {
  // Initialize global error handling
  useGlobalErrorHandler();
  
  // Initialize API event handling
  useApiEventHandler();

  // This component doesn't render anything, it just sets up error handling
  return null;
}