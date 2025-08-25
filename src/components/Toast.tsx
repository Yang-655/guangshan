import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

interface ToastConfig {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const toastConfigs: Record<ToastType, ToastConfig> = {
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800'
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800'
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800'
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800'
  }
};

export default function Toast({ 
  type, 
  message, 
  duration = 4000, 
  onClose, 
  className = '' 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  
  const config = toastConfigs[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // 动画持续时间
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-[9999] max-w-sm w-full mx-4
      transform transition-all duration-300 ease-in-out
      ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      ${className}
    `}>
      <div className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border rounded-lg shadow-lg p-4
        flex items-start gap-3
      `}>
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">
            {message}
          </p>
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Toast管理器
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastManagerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastManager({ toasts, onRemove }: ToastManagerProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ 
            transform: `translateY(${index * 8}px)`,
            zIndex: 9999 - index
          }}
        >
          <Toast
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: ToastType, message: string, duration?: number) => {
    const id = Date.now().toString();
    const newToast: ToastItem = { id, type, message, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // 自动移除
    if (duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration || 4000);
    }
    
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success: (message: string, duration?: number) => addToast('success', message, duration),
    error: (message: string, duration?: number) => addToast('error', message, duration),
    warning: (message: string, duration?: number) => addToast('warning', message, duration),
    info: (message: string, duration?: number) => addToast('info', message, duration)
  };
}