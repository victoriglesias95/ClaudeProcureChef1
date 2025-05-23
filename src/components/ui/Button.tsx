// src/components/ui/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn.ts';

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-white shadow-sm",
          "hover:bg-primary-dark hover:shadow-md",
          "active:bg-primary-dark active:shadow-sm",
          "focus:ring-primary"
        ],
        secondary: [
          "bg-accent text-white shadow-sm",
          "hover:bg-accent-dark hover:shadow-md",
          "active:bg-accent-dark active:shadow-sm",
          "focus:ring-accent"
        ],
        success: [
          "bg-success text-white shadow-sm",
          "hover:bg-green-600 hover:shadow-md",
          "active:bg-green-700 active:shadow-sm",
          "focus:ring-success"
        ],
        danger: [
          "bg-error text-white shadow-sm",
          "hover:bg-red-600 hover:shadow-md",
          "active:bg-red-700 active:shadow-sm",
          "focus:ring-error"
        ],
        outline: [
          "border-2 border-primary text-primary bg-transparent",
          "hover:bg-primary hover:text-white hover:shadow-sm",
          "active:bg-primary-dark active:border-primary-dark",
          "focus:ring-primary"
        ],
        ghost: [
          "text-gray-700 bg-transparent",
          "hover:bg-gray-100 hover:text-gray-900",
          "active:bg-gray-200",
          "focus:ring-gray-500"
        ],
        link: [
          "text-primary underline-offset-4",
          "hover:underline hover:text-primary-dark",
          "focus:ring-primary"
        ]
      },
      size: {
        xs: "text-xs px-2 py-1 rounded",
        sm: "text-sm px-3 py-1.5 rounded-md",
        md: "text-base px-4 py-2 rounded-md",
        lg: "text-lg px-6 py-3 rounded-lg",
        xl: "text-xl px-8 py-4 rounded-lg"
      },
      fullWidth: {
        true: "w-full"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className,
    variant,
    size,
    fullWidth,
    isLoading,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg 
              className="animate-spin -ml-1 mr-2 h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

// Icon Button variant
export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      xs: "p-1",
      sm: "p-1.5",
      md: "p-2",
      lg: "p-3",
      xl: "p-4"
    };
    
    return (
      <Button
        ref={ref}
        className={cn(
          "aspect-square",
          sizeClasses[size || "md"],
          className
        )}
        size={size}
        {...props}
      />
    );
  }
);

IconButton.displayName = 'IconButton';

// Utility function for cn (className merge)
// Add this to src/utils/cn.ts
/*
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
*/
