import React, { useState, useRef, useEffect, useCallback } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallback?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==',
  threshold = 0.1,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  useEffect(() => {
    const currentImg = imgRef.current;
    if (!currentImg) return;

    // 创建 Intersection Observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin: '50px'
      }
    );

    observerRef.current.observe(currentImg);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold]);

  const currentSrc = hasError ? fallback : isInView ? src : placeholder;

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-70'} ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
    />
  );
};

// 带有渐进式加载效果的图片组件
interface ProgressiveImageProps {
  src: string;
  lowQualitySrc?: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  lowQualitySrc,
  alt,
  className = '',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || src);

  const handleLoad = useCallback(() => {
    if (currentSrc === lowQualitySrc && src !== lowQualitySrc) {
      // 低质量图片加载完成，开始加载高质量图片
      setCurrentSrc(src);
    } else {
      // 高质量图片加载完成
      setIsLoaded(true);
      onLoad?.();
    }
  }, [currentSrc, lowQualitySrc, src, onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">加载失败</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-70 scale-105 blur-sm'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
};

// 带有加载动画的头像组件
interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackText?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackText
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const getFallbackText = () => {
    if (fallbackText) return fallbackText;
    return alt.charAt(0).toUpperCase();
  };

  if (!src || hasError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${className}`}>
        {getFallbackText()}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold animate-pulse">
          {getFallbackText()}
        </div>
      )}
    </div>
  );
};