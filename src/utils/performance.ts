// 性能优化工具函数
import React from 'react';

// 图片懒加载
export const createLazyImage = () => {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  return {
    observe: (img: HTMLImageElement) => imageObserver.observe(img),
    disconnect: () => imageObserver.disconnect()
  };
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 图片预加载
export const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map((url) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    })
  );
};

// 内存缓存
class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: T, ttl = 5 * 60 * 1000): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const memoryCache = new MemoryCache();

// 虚拟滚动计算
export const calculateVirtualItems = ({
  totalItems,
  itemHeight,
  containerHeight,
  scrollTop
}: {
  totalItems: number;
  itemHeight: number;
  containerHeight: number;
  scrollTop: number;
}) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    totalItems - 1
  );

  return {
    startIndex: Math.max(0, startIndex - 2), // 预渲染2个
    endIndex: Math.min(endIndex + 2, totalItems - 1), // 预渲染2个
    offsetY: startIndex * itemHeight
  };
};

// 组件性能监控
export const performanceMonitor = {
  startTime: 0,
  
  start(label: string): void {
    this.startTime = performance.now();
    console.time(label);
  },
  
  end(label: string): number {
    const duration = performance.now() - this.startTime;
    console.timeEnd(label);
    return duration;
  },
  
  measure(name: string, startMark: string, endMark: string): void {
    performance.measure(name, startMark, endMark);
  }
};

// 资源预取
export const prefetchResource = (url: string, type: 'script' | 'style' | 'image' = 'script'): void => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  
  if (type === 'style') {
    link.as = 'style';
  } else if (type === 'image') {
    link.as = 'image';
  } else {
    link.as = 'script';
  }
  
  document.head.appendChild(link);
};

// 批量DOM操作
export const batchDOMUpdates = (callback: () => void): void => {
  requestAnimationFrame(() => {
    callback();
  });
};

// 检测设备性能
export const getDevicePerformance = () => {
  const connection = (navigator as any).connection;
  const memory = (performance as any).memory;
  
  return {
    // 网络连接
    networkType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    
    // 内存信息
    usedJSHeapSize: memory?.usedJSHeapSize || 0,
    totalJSHeapSize: memory?.totalJSHeapSize || 0,
    jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
    
    // 硬件并发
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    
    // 设备内存
    deviceMemory: (navigator as any).deviceMemory || 0
  };
};

// 自适应质量
export const getOptimalImageQuality = () => {
  const perf = getDevicePerformance();
  const isLowEnd = perf.hardwareConcurrency <= 2 || perf.deviceMemory <= 2;
  const isSlowNetwork = perf.networkType === 'slow-2g' || perf.networkType === '2g';
  
  if (isLowEnd || isSlowNetwork) {
    return 'low';
  } else if (perf.networkType === '3g') {
    return 'medium';
  } else {
    return 'high';
  }
};

// 错误边界处理
export const createErrorBoundary = (fallback: React.ComponentType) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
      console.error('Error caught by boundary:', error, errorInfo);
      // 可以在这里上报错误到监控系统
    }

    render() {
      if (this.state.hasError) {
        return React.createElement(fallback);
      }

      return this.props.children;
    }
  };
};

// 组件懒加载
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => {
    return React.createElement(
      React.Suspense,
      { 
        fallback: fallback ? React.createElement(fallback) : React.createElement('div', null, 'Loading...') 
      },
      React.createElement(LazyComponent, props)
    );
  };
};