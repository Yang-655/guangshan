import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowLeft, ArrowRight, ChevronDown, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHapticFeedback } from './MobileOptimization';

// 增强的搜索组件
interface EnhancedSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResults?: (results: any[]) => void;
  suggestions?: string[];
  recentSearches?: string[];
  className?: string;
  autoFocus?: boolean;
  showHistory?: boolean;
}

export function EnhancedSearch({
  placeholder = '搜索...',
  onSearch,
  onResults,
  suggestions = [],
  recentSearches = [],
  className = '',
  autoFocus = false,
  showHistory = true
}: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const haptic = useHapticFeedback();

  // 模拟搜索API
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 模拟搜索结果
    const mockResults = [
      { id: 1, type: 'user', title: `用户: ${searchQuery}`, subtitle: '关注者 1.2万' },
      { id: 2, type: 'video', title: `视频: ${searchQuery}相关内容`, subtitle: '播放量 50万' },
      { id: 3, type: 'topic', title: `话题: #${searchQuery}`, subtitle: '参与 8.5万' }
    ];
    
    setResults(mockResults);
    setIsLoading(false);
    onResults?.(mockResults);
  }, [onResults]);

  // 实时搜索
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + recentSearches.length + results.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          // 处理选中项
          handleItemSelect(selectedIndex);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsExpanded(false);
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleItemSelect = (index: number) => {
    let selectedItem: string;
    
    if (index < suggestions.length) {
      selectedItem = suggestions[index];
    } else if (index < suggestions.length + recentSearches.length) {
      selectedItem = recentSearches[index - suggestions.length];
    } else {
      const resultIndex = index - suggestions.length - recentSearches.length;
      selectedItem = results[resultIndex]?.title || '';
    }
    
    setQuery(selectedItem);
    setShowSuggestions(false);
    haptic.lightTap();
    onSearch?.(selectedItem);
  };

  const handleSearch = () => {
    if (query.trim()) {
      haptic.mediumTap();
      onSearch?.(query);
      setShowSuggestions(false);
      // 添加到搜索历史
      if (!recentSearches.includes(query)) {
        recentSearches.unshift(query);
        if (recentSearches.length > 10) {
          recentSearches.pop();
        }
      }
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    haptic.lightTap();
    inputRef.current?.focus();
  };

  const expandSearch = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const collapseSearch = () => {
    setIsExpanded(false);
    setShowSuggestions(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜索输入框 */}
      <div className={`
        flex items-center bg-gray-100 rounded-full transition-all duration-300 ease-out
        ${isExpanded ? 'w-full' : 'w-10 h-10'}
        ${isExpanded ? 'px-4 py-2' : 'px-0 py-0'}
      `}>
        {!isExpanded ? (
          <button
            onClick={expandSearch}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        ) : (
          <>
            <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(query.length > 0)}
              placeholder={placeholder}
              autoFocus={autoFocus}
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin mr-2" />
            )}
            {query && (
              <button
                onClick={clearSearch}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={collapseSearch}
              className="ml-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* 搜索建议和结果 */}
      {isExpanded && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {/* 搜索建议 */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-gray-500 px-2 py-1">搜索建议</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  onClick={() => handleItemSelect(index)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedIndex === index ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span>{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 搜索历史 */}
          {showHistory && recentSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 px-2 py-1">最近搜索</div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleItemSelect(suggestions.length + index)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedIndex === suggestions.length + index ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200" />
                    <span className="text-gray-600">{search}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 搜索结果 */}
          {results.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 px-2 py-1">搜索结果</div>
              {results.map((result, index) => (
                <button
                  key={`result-${result.id}`}
                  onClick={() => handleItemSelect(suggestions.length + recentSearches.length + index)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedIndex === suggestions.length + recentSearches.length + index 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      result.type === 'user' ? 'bg-blue-100 text-blue-600' :
                      result.type === 'video' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {result.type === 'user' ? '👤' : result.type === 'video' ? '🎥' : '#'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.title}</div>
                      <div className="text-sm text-gray-500">{result.subtitle}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 无结果 */}
          {query && !isLoading && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <div className="text-sm">未找到相关结果</div>
              <div className="text-xs mt-1">尝试使用其他关键词</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 页面转场动画组件
interface PageTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  className?: string;
}

export function PageTransition({
  children,
  direction = 'right',
  duration = 300,
  className = ''
}: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const getTransformClass = () => {
    const baseClass = 'transition-all ease-out';
    const durationClass = `duration-${duration}`;
    
    if (!isVisible) {
      switch (direction) {
        case 'left':
          return `${baseClass} ${durationClass} -translate-x-full opacity-0`;
        case 'right':
          return `${baseClass} ${durationClass} translate-x-full opacity-0`;
        case 'up':
          return `${baseClass} ${durationClass} -translate-y-full opacity-0`;
        case 'down':
          return `${baseClass} ${durationClass} translate-y-full opacity-0`;
        default:
          return `${baseClass} ${durationClass} translate-x-full opacity-0`;
      }
    }
    
    return `${baseClass} ${durationClass} translate-x-0 translate-y-0 opacity-100`;
  };

  return (
    <div className={`${getTransformClass()} ${className}`}>
      {children}
    </div>
  );
}

// 增强的按钮反馈组件
interface ButtonFeedbackProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy';
  soundEffect?: boolean;
  className?: string;
}

export function ButtonFeedback({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  hapticType = 'light',
  soundEffect = false,
  className = ''
}: ButtonFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const haptic = useHapticFeedback();

  const playSound = useCallback(() => {
    if (soundEffect && 'AudioContext' in window) {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  }, [soundEffect]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // 触觉反馈
    switch (hapticType) {
      case 'light':
        haptic.lightTap();
        break;
      case 'medium':
        haptic.mediumTap();
        break;
      case 'heavy':
        haptic.heavyTap();
        break;
    }

    // 声音反馈
    playSound();

    // 波纹效果
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };
      setRipples(prev => [...prev, newRipple]);

      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }

    onClick?.();
  }, [disabled, loading, hapticType, haptic, playSound, onClick]);

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
        transition-all duration-150 ease-out
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

// 导航增强Hook
export function useNavigationEnhancement() {
  const navigate = useNavigate();
  const location = useLocation();
  const haptic = useHapticFeedback();
  const [isNavigating, setIsNavigating] = useState(false);

  const enhancedNavigate = useCallback((to: string, options?: { replace?: boolean }) => {
    setIsNavigating(true);
    haptic.lightTap();
    
    // 添加导航动画延迟
    setTimeout(() => {
      navigate(to, options);
      setIsNavigating(false);
    }, 100);
  }, [navigate, haptic]);

  const goBack = useCallback(() => {
    haptic.mediumTap();
    window.history.back();
  }, [haptic]);

  const goForward = useCallback(() => {
    haptic.mediumTap();
    window.history.forward();
  }, [haptic]);

  return {
    navigate: enhancedNavigate,
    goBack,
    goForward,
    isNavigating,
    currentPath: location.pathname
  };
}