import React, { useState, useRef, useEffect } from 'react';
import { ImageOff, Loader, WifiOff } from 'lucide-react';
import { generateImageWithCache, isOnline, setupNetworkListener, getLocalFallbackImage } from '../services/imageService';

interface LazyImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  // 新增属性
  useImageService?: boolean; // 是否使用图片服务
  prompt?: string; // 图片生成提示词
  imageSize?: 'square' | 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
}

const LazyImageWithFallback: React.FC<LazyImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  placeholder,
  onLoad,
  onError,
  useImageService = false,
  prompt,
  imageSize = 'square'
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(isOnline());
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 默认fallback图片
  const defaultFallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEwMEgxMTVWMTMwSDg1VjEwMEg3MEwxMDAgNzBaIiBmaWxsPSIjNkI3Mjg0Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3Mjg0IiBmb250LXNpemU9IjEyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pgo8L3N2Zz4=';

  // 网络状态监听
  useEffect(() => {
    const cleanup = setupNetworkListener((online) => {
      setNetworkStatus(online);
      if (!online && isLoading) {
        // 网络断开时，直接使用本地fallback
        setIsLoading(false);
        setHasError(true);
        const localFallback = getLocalFallbackImage('placeholder');
        setImageSrc(localFallback);
      }
    });
    
    return cleanup;
  }, [isLoading]);

  useEffect(() => {
    // 创建Intersection Observer来实现懒加载
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        let finalImageSrc = src;
        
        console.log('🖼️ LazyImageWithFallback 开始加载图片:', {
          src: src.substring(0, 100) + (src.length > 100 ? '...' : ''),
          isBase64: src.startsWith('data:'),
          isBlob: src.startsWith('blob:'),
          isHttp: src.startsWith('http'),
          isLocal: src.startsWith('/'),
          useImageService,
          prompt
        });
        
        // 如果使用图片服务且提供了prompt
        if (useImageService && prompt) {
          try {
            finalImageSrc = await generateImageWithCache({
              prompt,
              imageSize,
              retries: 2,
              timeout: 5000
            });
          } catch (error) {
            console.warn('图片服务调用失败，使用原始src:', error);
            // 如果图片服务失败，继续使用原始src
          }
        }
        
        // 对于Base64数据，直接设置，不需要通过Image对象验证
        if (finalImageSrc.startsWith('data:')) {
          console.log('✅ 检测到Base64数据，直接设置图片源');
          setImageSrc(finalImageSrc);
          setIsLoading(false);
          setHasError(false);
          onLoad?.();
          return;
        }
        
        // 对于其他类型的图片，使用Image对象验证
        const img = new Image();
        
        img.onload = () => {
          console.log('✅ 图片加载成功:', finalImageSrc.substring(0, 50) + '...');
          setImageSrc(finalImageSrc);
          setIsLoading(false);
          setHasError(false);
          onLoad?.();
        };
        
        img.onerror = () => {
          console.warn('❌ 图片加载失败:', finalImageSrc.substring(0, 50) + '...');
          handleImageError();
        };
        
        // 检查src是否为有效的URL
        if (finalImageSrc.startsWith('blob:') || finalImageSrc.startsWith('http') || finalImageSrc.startsWith('/')) {
          img.src = finalImageSrc;
        } else {
          throw new Error('Invalid image URL');
        }
        
      } catch (error) {
        console.warn('❌ 图片加载过程出错:', error);
        handleImageError();
      }
    };
    
    const handleImageError = () => {
      console.log('⚠️ 图片加载失败，用户要求不显示任何fallback图片');
      setIsLoading(false);
      setHasError(true);
      
      // 用户明确要求不显示AI生成图或占位图，设置为空
      setImageSrc('');
      
      onError?.();
    };
    
    loadImage();
  }, [isInView, src, fallbackSrc, onLoad, onError, useImageService, prompt, imageSize]);

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  };

  const renderError = () => {
    // 用户要求不显示任何错误提示或占位图，返回透明背景
    return (
      <div className={`bg-transparent ${className}`}>
        {/* 不显示任何内容，保持透明 */}
      </div>
    );
  };

  if (!isInView) {
    return (
      <div ref={imgRef} className={`bg-gray-200 ${className}`}>
        {renderPlaceholder()}
      </div>
    );
  }

  if (isLoading) {
    return renderPlaceholder();
  }

  if (hasError && !imageSrc) {
    return renderError();
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc || defaultFallback}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        console.log('❌ 图片渲染时发生错误，设置为透明');
        setHasError(true);
        setImageSrc(defaultFallback);
      }}
    />
  );
};

export default LazyImageWithFallback;