// Enhanced IconButton Component with Full Accessibility Support

import React, { forwardRef } from 'react';
import { Button, ButtonProps } from './Button';
import { cn } from '@/utils/helpers';

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string; // Required for icon buttons
  tooltip?: string;
  badge?: {
    content: string | number;
    variant?: 'default' | 'destructive' | 'success' | 'warning';
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    icon,
    'aria-label': ariaLabel,
    tooltip,
    badge,
    className,
    size = 'icon',
    ...props 
  }, ref) => {
    const getBadgeClasses = () => {
      const baseClasses = 'absolute text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center';
      const variantClasses = {
        default: 'bg-blue-500 text-white',
        destructive: 'bg-red-500 text-white',
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-black',
      };
      const positionClasses = {
        'top-right': '-top-1 -right-1',
        'top-left': '-top-1 -left-1',
        'bottom-right': '-bottom-1 -right-1',
        'bottom-left': '-bottom-1 -left-1',
      };
      
      return cn(
        baseClasses,
        variantClasses[badge?.variant ?? 'default'],
        positionClasses[badge?.position ?? 'top-right']
      );
    };

    return (
      <div className="relative inline-block">
        <Button
          ref={ref}
          size={size}
          className={cn('relative', className)}
          aria-label={ariaLabel}
          tooltip={tooltip}
          {...props}
        >
          <span aria-hidden="true">{icon}</span>
        </Button>
        
        {/* Badge */}
        {badge && (
          <span 
            className={getBadgeClasses()}
            aria-label={`${badge.content} notifications`}
          >
            {badge.content}
          </span>
        )}
      </div>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton };
export default IconButton;
