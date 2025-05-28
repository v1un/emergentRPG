// Enhanced ButtonGroup Component for Managing Related Buttons

import React, { forwardRef, Children, cloneElement, isValidElement } from 'react';
import { cn } from '@/utils/helpers';
import { ButtonProps } from './Button';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'segmented';
  size?: 'sm' | 'default' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({
    children,
    className,
    variant = 'default',
    size = 'default',
    orientation = 'horizontal',
    spacing = 'none',
    fullWidth = false,
    disabled = false,
    'aria-label': ariaLabel,
    role = 'group',
    ...props
  }, ref) => {
    const getGroupClasses = () => {
      const baseClasses = 'inline-flex';
      const orientationClasses = {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      };
      const spacingClasses = {
        none: spacing === 'none' ? 'space-x-0' : '',
        sm: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
        md: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
        lg: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
      };
      const variantClasses = {
        default: '',
        outlined: 'border border-input rounded-md',
        segmented: 'border border-input rounded-md overflow-hidden',
      };
      
      return cn(
        baseClasses,
        orientationClasses[orientation],
        spacingClasses[spacing],
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      );
    };

    const getButtonClasses = (index: number, total: number) => {
      if (variant === 'segmented') {
        const isFirst = index === 0;
        const isLast = index === total - 1;
        const isMiddle = !isFirst && !isLast;
        
        if (orientation === 'horizontal') {
          return cn(
            'border-0 rounded-none',
            isFirst && 'rounded-l-md',
            isLast && 'rounded-r-md border-r-0',
            isMiddle && 'border-r border-input',
            !isLast && 'border-r border-input'
          );
        } else {
          return cn(
            'border-0 rounded-none',
            isFirst && 'rounded-t-md',
            isLast && 'rounded-b-md border-b-0',
            isMiddle && 'border-b border-input',
            !isLast && 'border-b border-input'
          );
        }
      }
      return '';
    };

    // Clone children with enhanced props
    const enhancedChildren = Children.map(children, (child, index) => {
      if (!isValidElement(child)) return child;
      
      const total = Children.count(children);
      const buttonClasses = getButtonClasses(index, total);
      
      const childProps = child.props as any; // Type assertion for React element props
      const enhancedProps: Partial<ButtonProps> = {
        disabled: disabled || childProps.disabled,
        size: childProps.size || size,
        className: cn(buttonClasses, childProps.className),
      };
      
      if (fullWidth) {
        enhancedProps.className = cn(enhancedProps.className, 'flex-1');
      }
      
      return cloneElement(child, enhancedProps);
    });

    return (
      <div
        ref={ref}
        className={getGroupClasses()}
        role={role}
        aria-label={ariaLabel}
        {...props}
      >
        {enhancedChildren}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

export { ButtonGroup };
export default ButtonGroup;
