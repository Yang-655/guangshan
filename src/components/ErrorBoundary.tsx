import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              出现了一些问题
            </h2>
            
            <p className="text-gray-600 mb-6">
              页面遇到了意外错误，请尝试刷新页面或返回首页
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-medium text-gray-700 mb-2">错误详情：</p>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                返回首页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 函数式错误显示组件
interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  className = '', 
  variant = 'default' 
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">{errorMessage}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-blue-600 hover:text-blue-700 text-sm underline ml-2"
          >
            重试
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{errorMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                重试
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        加载失败
      </h3>
      
      <p className="text-gray-600 mb-4 max-w-sm mx-auto">
        {errorMessage}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;