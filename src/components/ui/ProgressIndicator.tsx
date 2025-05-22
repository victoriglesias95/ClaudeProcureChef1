// src/components/ui/ProgressIndicator.tsx - Progress feedback
import React from 'react';

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  className = ''
}) => (
  <div className={`flex items-center ${className}`}>
    {steps.map((step, index) => (
      <React.Fragment key={step}>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            index < currentStep 
              ? 'bg-green-500 text-white' 
              : index === currentStep
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-600'
          }`}>
            {index < currentStep ? '✓' : index + 1}
          </div>
          <span className={`ml-2 text-sm ${
            index <= currentStep ? 'text-gray-900' : 'text-gray-500'
          }`}>
            {step}
          </span>
        </div>
        
        {index < steps.length - 1 && (
          <div className={`w-12 h-0.5 mx-4 ${
            index < currentStep ? 'bg-green-500' : 'bg-gray-200'
          }`} />
        )}
      </React.Fragment>
    ))}
  </div>
);