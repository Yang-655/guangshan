import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Loader2, Check, AlertCircle } from 'lucide-react';

// 增强的按钮组件 - 带触觉反馈和动画
interface EnhancedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  hapticFeedback?: boolean;
}

export function EnhancedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  hapticFeedback = true
}: EnhancedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 shadow-md hover:shadow-lg',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // 触觉反馈
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // 波纹效果
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };
      setRipples(prev => [...prev, newRipple]);

      // 移除波纹
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }

    onClick?.();
  }, [disabled, loading, hapticFeedback, onClick]);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden rounded-lg font-medium
        transition-all duration-200 ease-out
        transform active:scale-95
        ${variants[variant]}
        ${sizes[size]}
        ${isPressed ? 'scale-95' : 'scale-100'}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* 波纹效果 */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animationDuration: '0.6s'
          }}
        />
      ))}

      {/* 内容 */}
      <span className="relative flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>
    </button>
  );
}

// 增强的输入框组件 - 带动画和验证状态
interface EnhancedInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  success?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function EnhancedInput({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  type = 'text',
  error,
  success,
  loading = false,
  disabled = false,
  className = '',
  autoFocus = false
}: EnhancedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasValue(value.length > 0);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (success) return <Check className="w-4 h-4 text-green-500" />;
    return null;
  };

  const getBorderColor = () => {
    if (error) return 'border-red-300 focus:border-red-500';
    if (success) return 'border-green-300 focus:border-green-500';
    return 'border-gray-300 focus:border-blue-500';
  };

  return (
    <div className={`relative ${className}`}>
      {/* 浮动标签 */}
      {label && (
        <label
          className={`
            absolute left-3 transition-all duration-200 ease-out pointer-events-none
            ${isFocused || hasValue
              ? 'top-0 text-xs bg-white px-1 -translate-y-1/2'
              : 'top-1/2 text-sm -translate-y-1/2'
            }
            ${error ? 'text-red-500' : success ? 'text-green-500' : isFocused ? 'text-blue-500' : 'text-gray-500'}
          `}
        >
          {label}
        </label>
      )}

      {/* 输入框容器 */}
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={isFocused ? placeholder : ''}
          disabled={disabled || loading}
          className={`
            w-full px-3 py-3 rounded-lg border-2 transition-all duration-200
            bg-white text-gray-900 placeholder-gray-400
            ${getBorderColor()}
            ${disabled || loading ? 'bg-gray-50 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
            ${label ? 'pt-4' : ''}
          `}
        />

        {/* 状态图标 */}
        {(loading || error || success) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>
        )}
      </div>

      {/* 错误/成功消息 */}
      {(error || success) && (
        <div className={`mt-1 text-xs transition-all duration-200 ${
          error ? 'text-red-500' : 'text-green-500'
        }`}>
          {error || success}
        </div>
      )}
    </div>
  );
}

// 增强的折叠面板组件
interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  className = ''
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={toggle}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      </button>
      
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ height }}
      >
        <div ref={contentRef} className="p-4 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

// 增强的进度条组件
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = 'default',
  animated = true,
  className = ''
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const variants = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            variants[variant]
          } ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// 增强的模态框组件
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlay?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlay = true,
  className = ''
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-200 ${
          isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* 模态框内容 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative bg-white rounded-lg shadow-xl w-full transition-all duration-200
            ${sizes[size]}
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            ${className}
          `}
        >
          {title && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          )}
          
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// 触摸手势Hook
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold = 50
) {
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // 水平滑动
      if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
      if (isRightSwipe && onSwipeRight) onSwipeRight();
    } else {
      // 垂直滑动
      if (isUpSwipe && onSwipeUp) onSwipeUp();
      if (isDownSwipe && onSwipeDown) onSwipeDown();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: onTouchEndHandler
  };
}