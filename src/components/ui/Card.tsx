import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps): JSX.Element => {
  return (
    <div className={`bg-white rounded-md shadow-md ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }: CardProps): JSX.Element => {
  return (
    <div className={`p-4 border-b ${className}`}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '' }: CardProps): JSX.Element => {
  return (
    <h3 className={`text-lg font-medium ${className}`}>
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = '' }: CardProps): JSX.Element => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardContent };
export default Card;