import React from 'react';
import { cn, classNames, createVariants } from '../lib/utils';

/**
 * Example component demonstrating the cn utility usage
 * This shows various ways to use the shadcn-style class merging
 */

// Example 1: Basic cn usage with conditional classes
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ExampleButton({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className,
  children 
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        
        // Size variants
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        
        // Color variants
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
        },
        
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed hover:bg-current',
        
        // Custom className override
        className
      )}
    >
      {children}
    </button>
  );
}

// Example 2: Using createVariants for more complex component variants
const cardVariants = createVariants(
  'rounded-lg border p-4 shadow-sm', // base classes
  {
    variant: {
      default: 'bg-white border-gray-200',
      success: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200',
      error: 'bg-red-50 border-red-200',
    },
    size: {
      sm: 'p-3 text-sm',
      md: 'p-4 text-base',
      lg: 'p-6 text-lg',
    }
  }
);

interface CardProps {
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export function ExampleCard({ variant = 'default', size = 'md', className, children }: CardProps) {
  return (
    <div className={cardVariants({ variant, size, className })}>
      {children}
    </div>
  );
}

// Example 3: Complex conditional styling with cn
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  showDot?: boolean;
  className?: string;
}

export function ExampleStatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
        
        // Status-based styling
        status === 'online' && 'bg-green-100 text-green-800',
        status === 'offline' && 'bg-gray-100 text-gray-800',
        status === 'busy' && 'bg-red-100 text-red-800',
        status === 'away' && 'bg-yellow-100 text-yellow-800',
        
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            {
              'bg-green-500': status === 'online',
              'bg-gray-400': status === 'offline',
              'bg-red-500': status === 'busy',
              'bg-yellow-500': status === 'away',
            }
          )}
        />
      )}
      {status}
    </span>
  );
}

// Example 4: Using classNames utility for simple conditional classes
interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function ExampleAlert({ type, title, message, dismissible, onDismiss }: AlertProps) {
  const iconMap = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div
      className={classNames(
        'rounded-md p-4',
        type === 'info' && 'bg-blue-50 border border-blue-200',
        type === 'success' && 'bg-green-50 border border-green-200',
        type === 'warning' && 'bg-yellow-50 border border-yellow-200',
        type === 'error' && 'bg-red-50 border border-red-200'
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-lg">{iconMap[type]}</span>
        </div>
        <div className="ml-3 flex-1">
          <h3
            className={cn(
              'text-sm font-medium',
              type === 'info' && 'text-blue-800',
              type === 'success' && 'text-green-800',
              type === 'warning' && 'text-yellow-800',
              type === 'error' && 'text-red-800'
            )}
          >
            {title}
          </h3>
          <div
            className={cn(
              'mt-2 text-sm',
              type === 'info' && 'text-blue-700',
              type === 'success' && 'text-green-700',
              type === 'warning' && 'text-yellow-700',
              type === 'error' && 'text-red-700'
            )}
          >
            {message}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className={cn(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                type === 'info' && 'text-blue-400 hover:bg-blue-100 focus:ring-blue-600',
                type === 'success' && 'text-green-400 hover:bg-green-100 focus:ring-green-600',
                type === 'warning' && 'text-yellow-400 hover:bg-yellow-100 focus:ring-yellow-600',
                type === 'error' && 'text-red-400 hover:bg-red-100 focus:ring-red-600'
              )}
            >
              <span className="sr-only">Dismiss</span>
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Example usage component
export function CnExamples() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">cn Utility Examples</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Buttons with cn</h3>
        <div className="flex gap-2">
          <ExampleButton variant="primary" size="sm">Primary Small</ExampleButton>
          <ExampleButton variant="secondary" size="md">Secondary Medium</ExampleButton>
          <ExampleButton variant="danger" size="lg">Danger Large</ExampleButton>
          <ExampleButton disabled>Disabled</ExampleButton>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cards with createVariants</h3>
        <div className="grid grid-cols-2 gap-4">
          <ExampleCard variant="success" size="sm">Success Card</ExampleCard>
          <ExampleCard variant="warning" size="md">Warning Card</ExampleCard>
          <ExampleCard variant="error" size="lg">Error Card</ExampleCard>
          <ExampleCard variant="default">Default Card</ExampleCard>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Status Badges</h3>
        <div className="flex gap-2">
          <ExampleStatusBadge status="online" />
          <ExampleStatusBadge status="busy" />
          <ExampleStatusBadge status="away" showDot={false} />
          <ExampleStatusBadge status="offline" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Alerts with classNames</h3>
        <div className="space-y-3">
          <ExampleAlert 
            type="info" 
            title="Information" 
            message="This is an info alert using the cn utility." 
            dismissible 
          />
          <ExampleAlert 
            type="success" 
            title="Success!" 
            message="Your changes have been saved successfully." 
          />
          <ExampleAlert 
            type="warning" 
            title="Warning" 
            message="Please review your settings before continuing." 
          />
          <ExampleAlert 
            type="error" 
            title="Error" 
            message="Something went wrong. Please try again." 
          />
        </div>
      </div>
    </div>
  );
}
