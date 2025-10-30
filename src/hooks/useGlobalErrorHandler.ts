'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

/**
 * Global error handler hook that integrates with the toast notification system
 * Listens for global errors and displays them via toast notifications
 */
export function useGlobalErrorHandler() {
  const { toast } = useToast();

  useEffect(() => {
    // Handle global JavaScript errors
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global JavaScript error:', event.error);
      
      toast.error(
        'Unexpected Error',
        event.error?.message || event.message || 'An unexpected error occurred',
        {
          persistent: true,
          action: {
            label: 'Reload Page',
            onClick: () => window.location.reload(),
          },
        }
      );
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      const errorMessage = event.reason instanceof Error 
        ? event.reason.message 
        : typeof event.reason === 'string' 
        ? event.reason 
        : 'An unexpected error occurred';

      toast.error(
        'Promise Rejection',
        errorMessage,
        {
          persistent: true,
          action: {
            label: 'Dismiss',
            onClick: () => {}, // Just dismiss the toast
          },
        }
      );

      // Prevent the default browser behavior (logging to console)
      event.preventDefault();
    };

    // Handle custom error boundary events
    const handleErrorBoundaryError = (event: CustomEvent) => {
      const { title, message, error, errorInfo } = event.detail;
      
      console.error('Error Boundary error:', error, errorInfo);
      
      toast.error(
        title || 'Component Error',
        message || 'A component encountered an error',
        {
          persistent: true,
          action: {
            label: 'Reload Page',
            onClick: () => window.location.reload(),
          },
        }
      );
    };

    // Add event listeners
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('global-error', handleErrorBoundaryError as EventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('global-error', handleErrorBoundaryError as EventListener);
    };
  }, [toast]);
}

/**
 * API Error handler utility for consistent error handling across API calls
 */
export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public data?: any;

  constructor(message: string, status: number, statusText: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

/**
 * Utility function to handle API responses consistently
 */
export async function handleApiResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorData: any;

    try {
      errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || `HTTP ${response.status}`;
    }

    throw new ApiError(
      errorMessage,
      response.status,
      response.statusText,
      errorData
    );
  }

  return response.json();
}

/**
 * Enhanced fetch wrapper with automatic error handling and toast notifications
 */
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit,
  toastOptions?: {
    showSuccess?: boolean;
    successMessage?: string;
    showError?: boolean;
    errorTitle?: string;
  }
) {
  try {
    const response = await fetch(url, options);
    const data = await handleApiResponse(response);

    // Show success toast if requested
    if (toastOptions?.showSuccess) {
      // We need to access toast context here, but this is a utility function
      // So we'll emit a custom event instead
      const event = new CustomEvent('api-success', {
        detail: {
          message: toastOptions.successMessage || 'Operation completed successfully',
          data,
        },
      });
      window.dispatchEvent(event);
    }

    return data;
  } catch (error) {
    // Show error toast if requested (default: true)
    if (toastOptions?.showError !== false) {
      const errorTitle = toastOptions?.errorTitle || 'API Error';
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';

      const event = new CustomEvent('api-error', {
        detail: {
          title: errorTitle,
          message: errorMessage,
          error,
        },
      });
      window.dispatchEvent(event);
    }

    throw error;
  }
}

/**
 * Hook to listen for API success/error events and show toasts
 */
export function useApiEventHandler() {
  const { toast } = useToast();

  useEffect(() => {
    const handleApiSuccess = (event: CustomEvent) => {
      const { message, data } = event.detail;
      toast.success('Success', message);
    };

    const handleApiError = (event: CustomEvent) => {
      const { title, message, error } = event.detail;
      
      toast.error(title, message, {
        persistent: error instanceof ApiError && error.status >= 500,
        action: error instanceof ApiError && error.status >= 500 ? {
          label: 'Retry',
          onClick: () => window.location.reload(),
        } : undefined,
      });
    };

    window.addEventListener('api-success', handleApiSuccess as EventListener);
    window.addEventListener('api-error', handleApiError as EventListener);

    return () => {
      window.removeEventListener('api-success', handleApiSuccess as EventListener);
      window.removeEventListener('api-error', handleApiError as EventListener);
    };
  }, [toast]);
}

/**
 * Validation error handler for form submissions
 */
export function handleValidationErrors(error: any, setErrors?: (errors: Record<string, string>) => void) {
  if (error instanceof ApiError && error.status === 400 && error.data?.validation) {
    // Handle validation errors from server
    const validationErrors: Record<string, string> = {};
    
    if (Array.isArray(error.data.validation)) {
      error.data.validation.forEach((err: any) => {
        if (err.field && err.message) {
          validationErrors[err.field] = err.message;
        }
      });
    } else if (typeof error.data.validation === 'object') {
      Object.assign(validationErrors, error.data.validation);
    }

    if (setErrors) {
      setErrors(validationErrors);
    }

    return validationErrors;
  }

  return null;
}