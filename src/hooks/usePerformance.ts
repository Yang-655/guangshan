import { useEffect, useRef, useState, useCallback } from 'react';

// 性能监控Hook
export const usePerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(Date.now());
  const [renderTime, setRenderTime] = useState<number>(0);
  const [renderCount, setRenderCount] = useState<number>(0);

  useEffect(() => {
    const endTime = Date.now();
    const duration = endTime - renderStartTime.current;
    setRenderTime(duration);
    setRenderCount(prev => prev + 1);
    
    // 在开发环境下输出性能信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} - Render #${renderCount + 1}: ${duration}ms`);
      
      // 如果渲染时间超过阈值，发出警告
      if (duration > 16) { // 60fps = 16.67ms per frame
        console.warn(`[Performance Warning] ${componentName} took ${duration}ms to render (>16ms)`);
      }
    }
    
    renderStartTime.current = Date.now();
  });

  return { renderTime, renderCount };
};

// 内存使用监控Hook
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  const updateMemoryInfo = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      });
    }
  }, []);

  useEffect(() => {
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, [updateMemoryInfo]);

  return { memoryInfo, updateMemoryInfo };
};

// 网络性能监控Hook
export const useNetworkMonitor = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null>(null);

  useEffect(() => {
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setNetworkInfo({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        });
      }
    };

    updateNetworkInfo();
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  return networkInfo;
};

// 页面加载性能监控Hook
export const usePagePerformance = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  } | null>(null);

  useEffect(() => {
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0
      };

      // 获取 FCP (First Contentful Paint)
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        metrics.firstContentfulPaint = fcpEntry.startTime;
      }

      // 获取 LCP (Largest Contentful Paint)
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          metrics.largestContentfulPaint = lastEntry.startTime;
          setPerformanceMetrics({ ...metrics });
        }
      });
      
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      setPerformanceMetrics(metrics);
    };

    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return performanceMetrics;
};

// 组件重渲染追踪Hook
export const useRenderTracker = (componentName: string, props: Record<string, any>) => {
  const prevProps = useRef<Record<string, any>>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render Tracker] ${componentName} rendered ${renderCount.current} times`);
      
      if (prevProps.current) {
        const changedProps = Object.keys(props).filter(
          key => props[key] !== prevProps.current![key]
        );
        
        if (changedProps.length > 0) {
          console.log(`[Render Tracker] ${componentName} props changed:`, changedProps);
        } else {
          console.warn(`[Render Tracker] ${componentName} re-rendered without prop changes`);
        }
      }
    }
    
    prevProps.current = props;
  });

  return renderCount.current;
};

// 防抖Hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 节流Hook
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// 图片预加载Hook
export const useImagePreloader = (imageUrls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (imageUrls.length === 0) {
      setIsLoading(false);
      return;
    }

    let loadedCount = 0;
    const totalImages = imageUrls.length;

    const preloadImage = (url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, url]));
          loadedCount++;
          if (loadedCount === totalImages) {
            setIsLoading(false);
          }
          resolve();
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setIsLoading(false);
          }
          resolve();
        };
        img.src = url;
      });
    };

    Promise.all(imageUrls.map(preloadImage));
  }, [imageUrls]);

  return { loadedImages, isLoading };
};