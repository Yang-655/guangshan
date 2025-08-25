import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X, RefreshCw } from 'lucide-react';

// 反馈类型
type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// 反馈配置
interface FeedbackConfig {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
}

const feedbackConfigs: Record<FeedbackType, FeedbackConfig> = {
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600'
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600'
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600'
  },
  loading: {
    icon: <RefreshCw className="w-5 h-5 animate-spin" />,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    iconColor: 'text-gray-600'
  }
};

// 内联反馈组件
interface InlineFeedbackProps {
  type: FeedbackType;
  message: string;
  onClose?: () => void;
  className?: string;
  showIcon?: boolean;
}

export function InlineFeedback({ 
  type, 
  message, 
  onClose, 
  className = '',
  showIcon = true 
}: InlineFeedbackProps) {
  const config = feedbackConfigs[type];

  return (
    <div className={`
      ${config.bgColor} ${config.borderColor} ${config.textColor}
      border rounded-lg p-3 flex items-start gap-3
      ${className}
    `}>
      {showIcon && (
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {config.icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">
          {message}
        </p>
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// 表单字段反馈组件
interface FieldFeedbackProps {
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  className?: string;
}

export function FieldFeedback({ 
  error, 
  success, 
  warning, 
  info, 
  className = '' 
}: FieldFeedbackProps) {
  if (error) {
    return (
      <div className={`mt-1 ${className}`}>
        <InlineFeedback 
          type="error" 
          message={error} 
          showIcon={false}
          className="text-xs py-1 px-2"
        />
      </div>
    );
  }

  if (success) {
    return (
      <div className={`mt-1 ${className}`}>
        <InlineFeedback 
          type="success" 
          message={success} 
          showIcon={false}
          className="text-xs py-1 px-2"
        />
      </div>
    );
  }

  if (warning) {
    return (
      <div className={`mt-1 ${className}`}>
        <InlineFeedback 
          type="warning" 
          message={warning} 
          showIcon={false}
          className="text-xs py-1 px-2"
        />
      </div>
    );
  }

  if (info) {
    return (
      <div className={`mt-1 ${className}`}>
        <InlineFeedback 
          type="info" 
          message={info} 
          showIcon={false}
          className="text-xs py-1 px-2"
        />
      </div>
    );
  }

  return null;
}

// 操作反馈组件
interface ActionFeedbackProps {
  isLoading?: boolean;
  error?: string;
  success?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ActionFeedback({ 
  isLoading, 
  error, 
  success, 
  onRetry, 
  onDismiss, 
  className = '' 
}: ActionFeedbackProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <InlineFeedback 
          type="loading" 
          message="处理中，请稍候..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-2">
                操作失败
              </p>
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                重试
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={className}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-1">
                操作成功
              </p>
              <p className="text-sm text-green-700">
                {success}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 hover:bg-green-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-green-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// 确认对话框组件
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'info',
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <XCircle className="w-6 h-6 text-red-600" />,
      confirmBg: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: <Info className="w-6 h-6 text-blue-600" />,
      confirmBg: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          {config.icon}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600">
              {message}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${config.confirmBg}`}
          >
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// 进度反馈组件
interface ProgressFeedbackProps {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
  errorStep?: number;
  className?: string;
}

export function ProgressFeedback({
  steps,
  currentStep,
  completedSteps = [],
  errorStep,
  className = ''
}: ProgressFeedbackProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = currentStep === index;
        const isError = errorStep === index;
        
        return (
          <div key={index} className="flex items-center gap-3">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${isCompleted ? 'bg-green-100 text-green-600' : 
                isCurrent ? 'bg-blue-100 text-blue-600' :
                isError ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-400'}
            `}>
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : isError ? (
                <XCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isCompleted ? 'text-green-600' :
                isCurrent ? 'text-blue-600' :
                isError ? 'text-red-600' :
                'text-gray-400'
              }`}>
                {step}
              </p>
            </div>
            
            {isCurrent && (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            )}
          </div>
        );
      })}
    </div>
  );
}