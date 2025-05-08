import React from 'react';

interface SectionHeaderProps {
  title: string;
  onViewMore?: () => void;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  onViewMore,
  className = ''
}) => {
  return (
    <div className={`flex justify-between items-center mb-4 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {onViewMore && (
        <button 
          onClick={onViewMore}
          className="px-4 py-2 text-sm font-medium text-primary bg-gray-100 rounded-full hover:bg-gray-200"
        >
          View more
        </button>
      )}
    </div>
  );
};

export default SectionHeader;