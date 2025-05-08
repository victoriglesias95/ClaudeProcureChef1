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

export { Card };
export default Card;