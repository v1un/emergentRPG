// Enhanced Reusable Button Component with Full Accessibility Support

import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';
import { AccessibilityProps, announceToScreenReader, generateId } from '@/utils/accessibility';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 hover:shadow-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-lg',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-lg',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80',
        gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl',
        success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-lg',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 shadow-sm hover:shadow-lg',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-lg px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  // Enhanced accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-controls'?: string;

  // Enhanced functionality props
  loadingText?: string;
  successText?: string;
  errorText?: string;
  confirmAction?: boolean;
  confirmMessage?: string;
  tooltip?: string;

  // Event handlers with enhanced error handling
  onSuccess?: () => void | Promise<void>;
  onAsyncError?: (error: Error) => void;
  onConfirm?: () => void | Promise<void>;

  // State management
  showSuccess?: boolean;
  showError?: boolean;
  errorMessage?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,

    // Enhanced accessibility props
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-pressed': ariaPressed,
    'aria-controls': ariaControls,

    // Enhanced functionality props
    loadingText = 'Loading...',
    successText,
    errorText,
    confirmAction = false,
    confirmMessage = 'Are you sure?',
    tooltip,

    // Event handlers
    onClick,
    onSuccess,
    onAsyncError,
    onConfirm,

    // State management
    showSuccess = false,
    showError = false,
    errorMessage,

    ...props
  }, ref) => {
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalSuccess, setInternalSuccess] = useState(false);
    const [internalError, setInternalError] = useState(false);
    const [buttonId] = useState(() => generateId('button'));
    const [tooltipId] = useState(() => generateId('tooltip'));

    const isLoading = loading || internalLoading;
    const isSuccess = showSuccess || internalSuccess;
    const isError = showError || internalError;
    const isDisabled = disabled || isLoading;

    // Reset success/error states after delay
    useEffect(() => {
      if (isSuccess) {
        const timer = setTimeout(() => {
          setInternalSuccess(false);
          if (successText) {
            announceToScreenReader(`Success: ${successText}`, 'polite');
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }, [isSuccess, successText]);

    useEffect(() => {
      if (isError) {
        const timer = setTimeout(() => {
          setInternalError(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [isError]);

    // Helper function to execute async handlers
    const executeHandler = async (handler: (() => void | Promise<void>) | undefined) => {
      if (!handler) return;
      const result = handler();
      if (result instanceof Promise) {
        await result;
      }
    };

    // Helper function to handle errors
    const handleError = useCallback((error: unknown) => {
      setInternalError(true);
      const errorObj = error instanceof Error ? error : new Error(String(error));

      // Announce error to screen readers
      const errorMsg = errorMessage ?? errorText ?? errorObj.message ?? 'An error occurred';
      announceToScreenReader(`Error: ${errorMsg}`, 'assertive');

      if (onAsyncError) {
        onAsyncError(errorObj);
      }
    }, [errorMessage, errorText, onAsyncError]);

    // Enhanced click handler with error handling and confirmation
    const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return;

      // Handle confirmation if required
      if (confirmAction && !window.confirm(confirmMessage)) {
        return;
      }

      try {
        setInternalLoading(true);
        setInternalError(false);

        // Announce loading state to screen readers
        if (loadingText) {
          announceToScreenReader(loadingText, 'polite');
        }

        // Execute handlers
        await executeHandler(() => onClick?.(event));
        if (confirmAction) {
          await executeHandler(onConfirm);
        }

        // Show success state
        setInternalSuccess(true);
        if (onSuccess) {
          onSuccess();
        }

      } catch (error) {
        handleError(error);
      } finally {
        setInternalLoading(false);
      }
    }, [
      isDisabled, confirmAction, confirmMessage, onClick, onConfirm, onSuccess,
      loadingText, handleError
    ]);

    // Determine button content based on state
    const getButtonContent = () => {
      if (isLoading) {
        return loadingText;
      }
      if (isSuccess && successText) {
        return successText;
      }
      if (isError && (errorText ?? errorMessage)) {
        return errorText ?? errorMessage;
      }
      return children;
    };

    // Determine variant based on state
    const getVariant = () => {
      if (isSuccess) return 'success';
      if (isError) return 'destructive';
      return variant;
    };

    // Build accessibility props
    const accessibilityProps: AccessibilityProps = {
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy ?? (tooltip ? tooltipId : undefined),
      'aria-expanded': ariaExpanded,
      'aria-pressed': ariaPressed,
      'aria-controls': ariaControls,
      'aria-busy': isLoading,
      'aria-disabled': isDisabled,
    };

    return (
      <div className="relative inline-block">
        <button
          id={buttonId}
          className={cn(buttonVariants({ variant: getVariant(), size, className }))}
          ref={ref}
          disabled={isDisabled}
          onClick={handleClick}
          {...accessibilityProps}
          {...props}
        >
          {isLoading && (
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {!isLoading && isSuccess && (
            <svg
              className="mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {!isLoading && isError && (
            <svg
              className="mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {!isLoading && !isSuccess && !isError && leftIcon && (
            <span className="mr-2" aria-hidden="true">{leftIcon}</span>
          )}
          <span>{getButtonContent()}</span>
          {!isLoading && !isSuccess && !isError && rightIcon && (
            <span className="ml-2" aria-hidden="true">{rightIcon}</span>
          )}
        </button>

        {/* Tooltip */}
        {tooltip && (
          <div
            id={tooltipId}
            role="tooltip"
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
          >
            {tooltip}
          </div>
        )}
      </div>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
