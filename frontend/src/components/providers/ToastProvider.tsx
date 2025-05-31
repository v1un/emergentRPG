// Toast Provider for Notifications

'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './ThemeProvider';

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { resolvedTheme } = useTheme();

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
            color: resolvedTheme === 'dark' ? '#f9fafb' : '#111827',
            border: `1px solid ${resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '500px',
          },
          // Success toast styling
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          // Error toast styling
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
          // Loading toast styling
          loading: {
            duration: Infinity,
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  );
}

export default ToastProvider;
