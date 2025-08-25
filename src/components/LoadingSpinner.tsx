import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  variant?: 'default' | 'overlay' | 'inline';
}

export default function LoadingSpinner({ 
  size = 'md', 
  text, 
  className = '', 
  variant = 'default' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const spinner = (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  );

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        {spinner}
        {text && (
          <span className={`${textSizeClasses[size]} text-gray-600`}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3 max-w-sm mx-4">
          {spinner}
          {text && (
            <span className={`${textSizeClasses[size]} text-gray-700 text-center`}>
              {text}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      {spinner}
      {text && (
        <span className={`${textSizeClasses[size]} text-gray-600 text-center`}>
          {text}
        </span>
      )}
    </div>
  );
}