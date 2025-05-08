import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  rounded?: 'default' | 'full';
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  isLoading = false,
  fullWidth = false,
  rounded = 'default',
  ...props
}: ButtonProps): JSX.Element => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium focus:outline-none transition-colors';
  
  // Variant classes
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary/50',
    secondary: 'bg-accent text-white hover:bg-accent-dark focus:ring-2 focus:ring-accent/50',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-500/50',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-white focus:ring-2 focus:ring-primary/50',
    ghost: 'text-primary hover:bg-primary/10 focus:ring-2 focus:ring-primary/50',
    danger: 'bg-error text-white hover:bg-red-600 focus:ring-2 focus:ring-error/50',
  };
  
  // Size classes
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'text-xs py-1 px-2',
    sm: 'text-sm py-1.5 px-3',
    md: 'text-base py-2 px-4',
    lg: 'text-lg py-2.5 px-5',
  };
  
  // Rounded classes
  const roundedClasses = {
    default: 'rounded-md',
    full: 'rounded-full'
  };
  
  // Width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Combine all classes
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${roundedClasses[rounded]} ${widthClass} ${className}`;
  
  return (
    <button
      className={classes}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && !isLoading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
