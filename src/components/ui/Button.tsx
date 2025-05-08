import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps): JSX.Element => {
  const baseClasses = 'font-medium rounded focus:outline-none transition-colors';
  
  const variantClasses = {
    primary: 'bg-[#7D2027] text-white hover:bg-[#6a1b21]',
    secondary: 'bg-[#565F6E] text-white hover:bg-[#4a5260]',
    outline: 'border border-[#7D2027] text-[#7D2027] hover:bg-[#7D2027] hover:text-white'
  };
  
  const sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export { Button };
export default Button;