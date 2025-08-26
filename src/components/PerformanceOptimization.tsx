import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';

// 高级懒加载图片组件
interface AdvancedLazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  quality?: number;
  sizes?: string;
}

export const AdvancedLazyImage = memo<AdvancedLazyImageProps>(function AdvancedLazyImage({
  src,
  alt,
  placeholder,
  blurDataURL,
  width,
  height,
  className = '',
  onLoad,
  onError,
  priority = false,
  quality = 75,
  sizes
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 创建优化的图片URL
  const optimizedSrc = useMemo(() => {
    if (!src) return '';
    
    // 如果是外部URL，添加质量参数
    if (src.includes('trae-api-sg.mchost.guru')) {
      const url = new URL(src);
      url.searchParams.set('quality', quality.toString());
      if (width) url.searchParams.set('width', width.toString());
      if (height) url.searchParams.set('height', height.toString());
      return url.toString();
    }
    
    return src;
  }, [src, quality, width, height]);

  // 交叉观察器设置
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [priority, isInView]);

  // 图片加载处理
  useEffect(() => {
    if (!isInView || isLoaded || hasError) return;

    setIsLoading(true);
    
    const img = new Image();
    img.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };
    
    img.src = optimizedSrc;
  }, [isInView, optimizedSrc, isLoaded, hasError, onLoad, onError]);

  const containerStyle = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    aspectRatio: width && height ? `${width}/${height}` : undefined
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={containerStyle}
    >
      {/* 模糊占位符 */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
        />
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <AlertCircle className="w-6 h-6 text-gray-400" />
        </div>
      )}

      {/* 实际图片 */}
      {isLoaded && (
        <img
          src={optimizedSrc}
          alt={alt}
          sizes={sizes}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* 占位符 */}
      {!isInView && !priority && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400 text-sm">{placeholder}</span>
        </div>
      )}
    </div>
  );
});

// 高性能虚拟滚动组件
interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  estimatedItemHeight?: number;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  estimatedItemHeight
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      result.push({
        index: i,
        item: items[i],
        offsetTop: i * itemHeight
      });
    }
    return result;
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    onScroll?.(newScrollTop);

    // 滚动结束检测
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [onScroll]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, item, offsetTop }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offsetTop,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      
      {/* 滚动指示器 */}
      {isScrolling && (
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {Math.round((scrollTop / (totalHeight - containerHeight)) * 100)}%
        </div>
      )}
    </div>
  );
}

// 内存优化的组件缓存
interface MemoizedComponentProps {
  children: React.ReactNode;
  dependencies?: any[];
  maxCacheSize?: number;
}

const componentCache = new Map<string, React.ReactElement>();
const cacheKeys: string[] = [];

export function MemoizedComponent({
  children,
  dependencies = [],
  maxCacheSize = 50
}: MemoizedComponentProps) {
  const cacheKey = useMemo(() => {
    return JSON.stringify(dependencies);
  }, dependencies);

  const cachedComponent = useMemo(() => {
    if (componentCache.has(cacheKey)) {
      return componentCache.get(cacheKey)!;
    }

    const component = children as React.ReactElement;
    
    // 缓存管理
    if (componentCache.size >= maxCacheSize) {
      const oldestKey = cacheKeys.shift();
      if (oldestKey) {
        componentCache.delete(oldestKey);
      }
    }
    
    componentCache.set(cacheKey, component);
    cacheKeys.push(cacheKey);
    
    return component;
  }, [cacheKey, children, maxCacheSize]);

  return cachedComponent;
}

// 性能监控Hook
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(Date.now());
  const [renderTime, setRenderTime] = useState<number>(0);
  const [renderCount, setRenderCount] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  useEffect(() => {
    const endTime = Date.now();
    const duration = endTime - renderStartTime.current;
    setRenderTime(duration);
    setRenderCount(prev => prev + 1);
    
    // 内存使用监控
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryUsage(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    
    // 开发环境下的性能警告
    if (process.env.NODE_ENV === 'development') {
      if (duration > 16) { // 超过一帧的时间
        console.warn(`⚠️ ${componentName} 渲染时间过长: ${duration}ms`);
      }
      
      if (renderCount > 10) {
        console.warn(`⚠️ ${componentName} 渲染次数过多: ${renderCount}`);
      }
    }
    
    renderStartTime.current = Date.now();
  });

  return {
    renderTime,
    renderCount,
    memoryUsage
  };
}

// 防抖Hook优化
export function useOptimizedDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// 节流Hook优化
export function useOptimizedThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const now = Date.now();
    const timeSinceLastRan = now - lastRan.current;
    
    if (timeSinceLastRan >= limit) {
      setThrottledValue(value);
      lastRan.current = now;
    } else {
      timeoutRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }, limit - timeSinceLastRan);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, limit]);

  return throttledValue;
}

// 网络状态优化组件
interface NetworkOptimizedContentProps {
  children: React.ReactNode;
  lowQualityFallback?: React.ReactNode;
  offlineFallback?: React.ReactNode;
  className?: string;
}

export function NetworkOptimizedContent({
  children,
  lowQualityFallback,
  offlineFallback,
  className = ''
}: NetworkOptimizedContentProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 网络连接类型检测
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType));
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
        setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType));
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline && offlineFallback) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
        <WifiOff className="w-8 h-8 text-gray-400 mb-2" />
        <div className="text-gray-600 text-center">
          {offlineFallback}
        </div>
      </div>
    );
  }

  if (isSlowConnection && lowQualityFallback) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
          <Wifi className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-800 text-sm">网络较慢，已切换到低质量模式</span>
        </div>
        {lowQualityFallback}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// 资源预加载Hook
export function useResourcePreloader(resources: string[]) {
  const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set());
  const [failedResources, setFailedResources] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const preloadResource = useCallback((url: string) => {
    return new Promise<void>((resolve, reject) => {
      if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        // 图片预加载
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
        // 视频预加载
        const video = document.createElement('video');
        video.oncanplaythrough = () => resolve();
        video.onerror = () => reject(new Error(`Failed to load video: ${url}`));
        video.src = url;
        video.load();
      } else {
        // 其他资源预加载
        fetch(url)
          .then(() => resolve())
          .catch(() => reject(new Error(`Failed to load resource: ${url}`)));
      }
    });
  }, []);

  const preloadAll = useCallback(async () => {
    setIsLoading(true);
    const loaded = new Set<string>();
    const failed = new Set<string>();

    await Promise.allSettled(
      resources.map(async (resource) => {
        try {
          await preloadResource(resource);
          loaded.add(resource);
        } catch {
          failed.add(resource);
        }
      })
    );

    setLoadedResources(loaded);
    setFailedResources(failed);
    setIsLoading(false);
  }, [resources, preloadResource]);

  useEffect(() => {
    if (resources.length > 0) {
      preloadAll();
    }
  }, [resources, preloadAll]);

  return {
    loadedResources,
    failedResources,
    isLoading,
    loadedCount: loadedResources.size,
    failedCount: failedResources.size,
    totalCount: resources.length,
    progress: resources.length > 0 ? (loadedResources.size + failedResources.size) / resources.length : 0
  };
}

// 组件卸载清理Hook
export function useCleanup(cleanup: () => void) {
  const cleanupRef = useRef(cleanup);
  cleanupRef.current = cleanup;

  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);
}