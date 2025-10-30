'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { fetchWithErrorHandling, handleValidationErrors, ApiError } from '@/hooks/useGlobalErrorHandler';
import { AlertTriangle, CheckCircle, Info, Loader2, RefreshCw } from 'lucide-react';

/**
 * Toast System Demo Page
 * Demonstrates all toast notification features and error handling capabilities
 */
export default function ToastDemoPage() {
  const { toast, promiseToast, dismissToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Demo: Basic toast notifications
  const showSuccessToast = () => {
    toast.success('Operation Successful', 'Your data has been saved successfully!');
  };

  const showErrorToast = () => {
    toast.error('Operation Failed', 'There was an error processing your request. Please try again.');
  };

  const showWarningToast = () => {
    toast.warning('Warning Notice', 'This action may have unintended consequences. Please review before proceeding.');
  };

  const showInfoToast = () => {
    toast.info('Information', 'Here is some helpful information about this feature.');
  };

  const showLoadingToast = () => {
    const loadingId = toast.loading('Processing...', 'Please wait while we handle your request.');
    
    // Simulate dismissing after 3 seconds
    setTimeout(() => {
      dismissToast(loadingId);
      toast.success('Completed', 'The operation has finished successfully!');
    }, 3000);
  };

  const showPersistentToast = () => {
    toast.error('Critical Error', 'This is a persistent error that requires user action.', {
      persistent: true,
      action: {
        label: 'Retry',
        onClick: () => {
          console.log('Retry action clicked');
          toast.success('Retrying...', 'Attempting to resolve the issue.');
        },
      },
    });
  };

  // Demo: Promise-based toast notifications
  const simulateAsyncOperation = async () => {
    const mockApiCall = new Promise<{ id: string; name: string }>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.3) {
          resolve({ id: '123', name: 'Test Resource' });
        } else {
          reject(new Error('Simulated API failure'));
        }
      }, 2000);
    });

    try {
      const result = await promiseToast(
        mockApiCall,
        {
          loading: 'Creating resource...',
          success: (data) => `Resource "${data.name}" created successfully!`,
          error: (error) => `Failed to create resource: ${error.message}`,
        }
      );
      console.log('Promise result:', result);
    } catch (error) {
      console.error('Promise failed:', error);
    }
  };

  // Demo: API error handling with toast integration
  const simulateApiCall = async () => {
    setIsLoading(true);
    setFormErrors({});

    try {
      // This will use our global error handling
      const data = await fetchWithErrorHandling('/api/demo/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }, {
        showSuccess: true,
        successMessage: 'Form submitted successfully!',
        errorTitle: 'Form Submission Error',
      });

      console.log('API Success:', data);
    } catch (error) {
      // Handle validation errors specifically
      const validationErrors = handleValidationErrors(error, setFormErrors);
      if (!validationErrors) {
        console.error('API Error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Demo: Trigger application error (for error boundary testing)
  const triggerError = () => {
    throw new Error('This is a simulated application error to test the error boundary');
  };

  // Demo: Trigger global JavaScript error
  const triggerGlobalError = () => {
    // @ts-ignore - Intentionally trigger a runtime error
    window.nonExistentMethod();
  };

  // Demo: Trigger unhandled promise rejection
  const triggerPromiseRejection = () => {
    Promise.reject(new Error('This is a simulated unhandled promise rejection'));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Toast Notification System Demo
            </h1>

            {/* Basic Toast Examples */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Basic Toast Notifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={showSuccessToast}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Success Toast
                </button>
                <button
                  onClick={showErrorToast}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Error Toast
                </button>
                <button
                  onClick={showWarningToast}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Warning Toast
                </button>
                <button
                  onClick={showInfoToast}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Info Toast
                </button>
              </div>
            </section>

            {/* Advanced Toast Examples */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Loader2 className="h-5 w-5 mr-2 text-blue-500" />
                Advanced Toast Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={showLoadingToast}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Loading Toast (Auto-dismiss)
                </button>
                <button
                  onClick={showPersistentToast}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Persistent Toast with Action
                </button>
                <button
                  onClick={simulateAsyncOperation}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Promise-based Toast
                </button>
              </div>
            </section>

            {/* API Integration Demo */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-indigo-500" />
                API Integration Demo
              </h2>
              <div className="max-w-md">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.name ? 'border-red-300' : ''
                      }`}
                      placeholder="Enter your name"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        formErrors.email ? 'border-red-300' : ''
                      }`}
                      placeholder="Enter your email"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                  <button
                    onClick={simulateApiCall}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Submit Form (with API Error Handling)'
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Error Boundary Testing */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Error Handling Testing
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-sm text-red-700 mb-3">
                  <strong>Warning:</strong> These buttons will trigger actual errors for testing purposes.
                  Use them to verify that the error handling system is working correctly.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={triggerError}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Trigger Component Error
                </button>
                <button
                  onClick={triggerGlobalError}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Trigger Global Error
                </button>
                <button
                  onClick={triggerPromiseRejection}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Trigger Promise Rejection
                </button>
              </div>
            </section>

            {/* Usage Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-500" />
                Usage Information
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
                <h3 className="font-medium text-blue-900 mb-2">Toast System Features:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Multiple notification types: success, error, warning, info, loading</li>
                  <li>Auto-dismiss with configurable duration</li>
                  <li>Persistent notifications for critical errors</li>
                  <li>Action buttons for user interaction</li>
                  <li>Promise-based notifications with loading states</li>
                  <li>Global error handling and API integration</li>
                  <li>Validation error handling</li>
                  <li>Error boundary integration</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}