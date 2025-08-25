import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward, Mic } from 'lucide-react';
import VoiceGenerator, { VoiceGeneratorRef } from './VoiceGenerator';
import SubtitleDisplay from './SubtitleDisplay';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  // TTS相关属性
  enableTTS?: boolean;
  subtitles?: Array<{ start: number; end: number; text: string; }>;
  autoReadSubtitles?: boolean;
}

interface QualityOption {
  label: string;
  value: string;
  src: string;
}

const VideoPlayer = forwardRef<{ togglePlay: () => void }, VideoPlayerProps>(({
  src,
  poster,
  autoPlay = false,
  loop = false,
  muted = false,
  className = '',
  style,
  onTimeUpdate,
  onEnded,
  enableTTS = false,
  subtitles = [],
  autoReadSubtitles = false
}, ref: React.Ref<{ togglePlay: () => void }>) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [quality, setQuality] = useState('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [lastSubtitleIndex, setLastSubtitleIndex] = useState(-1);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [mouseTimer, setMouseTimer] = useState<NodeJS.Timeout | null>(null);
  const [showControlsInImmersive, setShowControlsInImmersive] = useState(false);
  
  // 长按加速相关状态
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [accelerationSpeed, setAccelerationSpeed] = useState(1);
  const [originalPlaybackRate, setOriginalPlaybackRate] = useState(1);
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  
  const voiceGeneratorRef = useRef<VoiceGeneratorRef>(null);

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const qualityOptions: QualityOption[] = [
    { label: '自动', value: 'auto', src },
    { label: '高清 1080p', value: '1080p', src },
    { label: '标清 720p', value: '720p', src },
    { label: '流畅 480p', value: '480p', src }
  ];

  // 优化视频事件处理，提升性能和缓冲体验
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      setHasError(false);
      setErrorMessage('');
      setRetryCount(0);
      setIsRetrying(false);
      
      // 预设质量选项
      if (video.videoWidth && video.videoHeight) {
        const resolution = `${video.videoWidth}x${video.videoHeight}`;
        setQuality(resolution);
      }
    };

    // 优化时间更新处理，减少频繁更新
    let timeUpdateThrottle: NodeJS.Timeout | null = null;
    const handleTimeUpdate = () => {
      if (timeUpdateThrottle) return;
      
      timeUpdateThrottle = setTimeout(() => {
        const current = video.currentTime;
        setCurrentTime(current);
        onTimeUpdate?.(current, video.duration);
        
        // Update buffered progress with throttling
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          const newBuffered = (bufferedEnd / video.duration) * 100;
          setBuffered(newBuffered);
          
          // 智能预加载：如果缓冲不足，调整预加载策略
          const currentProgress = (current / video.duration) * 100;
          if (newBuffered - currentProgress < 10) { // 缓冲不足10%
            video.preload = 'auto';
          }
        }
        
        // 处理字幕TTS播放
        if (enableTTS && autoReadSubtitles && subtitles.length > 0) {
          const currentSubtitleIndex = subtitles.findIndex(
            subtitle => current >= subtitle.start && current <= subtitle.end
          );
          
          if (currentSubtitleIndex !== -1 && currentSubtitleIndex !== lastSubtitleIndex) {
            const subtitle = subtitles[currentSubtitleIndex];
            voiceGeneratorRef.current?.addSubtitle(subtitle.text);
            setLastSubtitleIndex(currentSubtitleIndex);
          }
        }
        
        timeUpdateThrottle = null;
      }, 100); // 100ms节流
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    
    const handlePause = () => setIsPlaying(false);
    
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    
    const handleLoadStart = () => setIsLoading(true);
    
    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
      setErrorMessage('');
      setRetryCount(0);
      setIsRetrying(false);
      // 预加载一些内容以改善播放体验
      if (video.readyState >= 2) {
        video.preload = 'auto';
      }
    };
    
    // 新增：处理缓冲状态
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlayThrough = () => setIsLoading(false);
    
    // 新增：处理播放错误
    const handleError = (e: Event) => {
      console.error('VideoPlayer: 视频播放错误:', e);
      
      // 详细记录错误信息
      const target = e.target as HTMLVideoElement;
      const error = target.error;
      
      console.log('VideoPlayer: 错误详细信息:');
      console.log('- 视频源:', target.src ? target.src.substring(0, 100) + '...' : '无');
      console.log('- 视频源类型:', target.src ? (target.src.startsWith('data:') ? 'base64' : target.src.startsWith('blob:') ? 'blob' : 'http') : '无');
      console.log('- 视频源长度:', target.src ? target.src.length : 0);
      console.log('- 错误对象:', error);
      
      setIsLoading(false);
      setIsRetrying(false);
      
      // 根据错误类型设置用户友好的错误信息
      let shouldAutoRetry = false;
      let errorMsg = '';
      
      if (error) {
        console.log('- 错误代码:', error.code);
        console.log('- 错误消息:', error.message);
        
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMsg = '视频播放被中断';
            console.log('VideoPlayer: 错误类型 - 播放被中断');
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMsg = '网络错误，请检查网络连接';
            shouldAutoRetry = retryCount < 2; // 网络错误自动重试2次
            console.log('VideoPlayer: 错误类型 - 网络错误');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMsg = '视频解码失败，格式可能不支持';
            console.log('VideoPlayer: 错误类型 - 解码失败，可能是base64格式问题');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = '视频格式不支持或文件损坏';
            console.log('VideoPlayer: 错误类型 - 格式不支持，可能是base64数据问题');
            break;
          default:
            errorMsg = '视频播放出现未知错误';
            shouldAutoRetry = retryCount < 1; // 未知错误重试1次
            console.log('VideoPlayer: 错误类型 - 未知错误');
        }
      } else {
        errorMsg = '视频加载失败';
        shouldAutoRetry = retryCount < 2;
        console.log('VideoPlayer: 错误类型 - 加载失败（无错误对象）');
      }
      
      setErrorMessage(errorMsg);
      
      // 自动重试逻辑
      if (shouldAutoRetry) {
        console.log(`VideoPlayer: 准备重试 (${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        setIsRetrying(true);
        setTimeout(() => {
          if (video) {
            console.log('VideoPlayer: 执行重试加载');
            video.load();
          }
        }, 1000 + retryCount * 1000); // 递增延迟重试
      } else {
        setHasError(true);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('error', handleError);

    return () => {
      if (timeUpdateThrottle) {
        clearTimeout(timeUpdateThrottle);
      }
      
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('error', handleError);
    };
  }, [onTimeUpdate, onEnded, enableTTS, autoReadSubtitles, subtitles, lastSubtitleIndex]);

  // 监听src属性变化并添加调试日志
  useEffect(() => {
    console.log('VideoPlayer: src属性变化检测');
    console.log('VideoPlayer: 新的src值:', src);
    
    if (src) {
      // 检查src类型
      const srcType = src.startsWith('data:video/') ? 'base64' : 
                     src.startsWith('blob:') ? 'blob' : 
                     src.startsWith('http') ? 'http' : 'unknown';
      
      console.log('VideoPlayer: src类型:', srcType);
      console.log('VideoPlayer: src长度:', src.length);
      console.log('VideoPlayer: src前100字符:', src.substring(0, 100));
      
      const video = videoRef.current;
      if (video) {
        console.log('VideoPlayer: 处理src变更');
        console.log('VideoPlayer: 当前video.src:', video.src);
        
        // 重置状态
        setHasError(false);
        setErrorMessage('');
        setRetryCount(0);
        setIsLoading(true);

        // 根据来源类型设置合理的预加载策略
        try {
          if (src.startsWith('data:') || src.startsWith('blob:')) {
            video.preload = 'auto';
          } else {
            video.preload = 'metadata';
          }
        } catch {}
        
        // 调用加载，避免重复设置src导致的竞态，由React属性绑定负责更新src
        try {
          if (video.src !== src) {
            console.log('VideoPlayer: React将更新video.src，调用load()刷新');
          }
          video.load();
          console.log('VideoPlayer: 调用video.load()');
        } catch (err) {
          console.warn('VideoPlayer: 调用load失败:', err);
        }
      } else {
        console.warn('VideoPlayer: videoRef.current为null');
      }
    } else {
      console.warn('VideoPlayer: src为空或未定义');
    }
  }, [src]);

  // 同步父组件的muted属性到内部状态与video元素，确保外部静音切换生效
  useEffect(() => {
    setIsMuted(muted);
    const v = videoRef.current;
    if (v) {
      try {
        v.muted = muted;
      } catch {}
    }
  }, [muted]);

  // 沉浸式模式ESC键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImmersiveMode) {
        setIsImmersiveMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImmersiveMode]);

  // 沉浸式模式下的鼠标移动处理
  const handleMouseMove = () => {
    if (!isImmersiveMode) return;
    
    setShowControlsInImmersive(true);
    
    if (mouseTimer) {
      clearTimeout(mouseTimer);
    }
    
    const timer = setTimeout(() => {
      setShowControlsInImmersive(false);
    }, 3000);
    
    setMouseTimer(timer);
  };

  // 切换沉浸式模式
  const toggleImmersiveMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsImmersiveMode(!isImmersiveMode);
    if (!isImmersiveMode) {
      setShowControlsInImmersive(true);
      // 3秒后自动隐藏控制栏
      setTimeout(() => {
        setShowControlsInImmersive(false);
      }, 3000);
    }
  };

  // 长按开始处理
  const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 防止重复触发
    if (longPressTimer || isLongPressing) {
      return;
    }
    
    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      
      setIsLongPressing(true);
      setOriginalPlaybackRate(video.playbackRate);
      setAccelerationSpeed(2); // 开始2倍速
      video.playbackRate = 2;
      setShowSpeedIndicator(true);
      
      // 渐进加速到3倍速
      setTimeout(() => {
        const currentVideo = videoRef.current;
        if (currentVideo && isLongPressing) {
          setAccelerationSpeed(3);
          currentVideo.playbackRate = 3;
        }
      }, 1000);
    }, 500); // 500ms后开始长按
    
    setLongPressTimer(timer);
  };

  // 长按结束处理
  const handleLongPressEnd = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (isLongPressing) {
      const video = videoRef.current;
      if (video) {
        video.playbackRate = originalPlaybackRate;
      }
      setIsLongPressing(false);
      setAccelerationSpeed(1);
      setShowSpeedIndicator(false);
    }
  };

  // 处理视频点击（区分点击和长按）
  const handleVideoInteraction = (e: React.MouseEvent) => {
    if (isLongPressing) {
      // 长按状态下不处理点击
      return;
    }
    
    // 检查点击目标是否为按钮或其子元素
    const target = e.target as HTMLElement;
    const isButton = target.closest('button') !== null;
    
    // 如果点击的是按钮区域，不处理视频交互
    if (isButton) {
      return;
    }
    
    // 点击视频区域播放/暂停
    togglePlay();
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (mouseTimer) {
        clearTimeout(mouseTimer);
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [mouseTimer, longPressTimer]);


  // 优化播放/暂停切换，提升用户体验
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        // 改善播放体验
        setIsLoading(true);
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsLoading(false);
            })
            .catch(error => {
              console.warn('Video play failed:', error);
              setIsPlaying(false);
              setIsLoading(false);
              // 可以在这里添加用户友好的错误提示
            });
        }
      }
    } catch (error) {
      console.warn('Toggle play failed:', error);
      setIsLoading(false);
    }
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    togglePlay
  }), [isPlaying]);

  // 进度条拖动相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  // 上下滑动相关状态
  const [isVerticalDragging, setIsVerticalDragging] = useState(false);
  const [verticalDragType, setVerticalDragType] = useState<'volume' | 'brightness' | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [brightness, setBrightness] = useState(1);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState(false);

  // 优化进度条交互，添加拖动支持
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartTime(newTime);
    setPreviewTime(newTime);
    setShowPreview(true);
    
    // 立即更新视频时间
    video.currentTime = newTime;
  };

  const handleProgressMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, moveX / rect.width));
    const newTime = percentage * duration;
    
    setPreviewTime(newTime);
    video.currentTime = newTime;
  };

  const handleProgressMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setShowPreview(false);
  };

  // 处理上下滑动手势
  const handleVideoMouseDown = (e: React.MouseEvent) => {
    if (isLongPressing || isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftSide = x < rect.width / 2;
    
    setIsVerticalDragging(true);
    setVerticalDragType(isLeftSide ? 'brightness' : 'volume');
    setDragStartY(e.clientY);
    setDragStartValue(isLeftSide ? brightness : volume);
  };

  const handleVideoMouseMove = (e: MouseEvent) => {
    if (!isVerticalDragging || !verticalDragType) return;
    
    const deltaY = dragStartY - e.clientY;
    const sensitivity = 0.005;
    const delta = deltaY * sensitivity;
    
    if (verticalDragType === 'volume') {
      const newVolume = Math.max(0, Math.min(1, dragStartValue + delta));
      handleVolumeChange(newVolume);
      setShowVolumeIndicator(true);
    } else if (verticalDragType === 'brightness') {
      const newBrightness = Math.max(0.2, Math.min(2, dragStartValue + delta));
      setBrightness(newBrightness);
      setShowBrightnessIndicator(true);
    }
  };

  const handleVideoMouseUp = () => {
    if (isVerticalDragging) {
      setIsVerticalDragging(false);
      setVerticalDragType(null);
      
      // 延迟隐藏指示器
      setTimeout(() => {
        setShowVolumeIndicator(false);
        setShowBrightnessIndicator(false);
      }, 1000);
    }
  };

  // 触摸事件处理
  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, touchX / rect.width));
    const newTime = percentage * duration;
    
    setIsDragging(true);
    setDragStartX(touch.clientX);
    setDragStartTime(newTime);
    setPreviewTime(newTime);
    setShowPreview(true);
    
    video.currentTime = newTime;
  };

  const handleVideoTouchStart = (e: React.TouchEvent) => {
    if (isLongPressing || isDragging) return;
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const isLeftSide = x < rect.width / 2;
    
    setIsVerticalDragging(true);
    setVerticalDragType(isLeftSide ? 'brightness' : 'volume');
    setDragStartY(touch.clientY);
    setDragStartValue(isLeftSide ? brightness : volume);
  };

  const handleGlobalTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 0) return;
    
    const touch = e.touches[0];
    
    // 进度条拖动
    if (isDragging) {
      const video = videoRef.current;
      const progressBar = progressRef.current;
      if (!video || !progressBar || !duration) return;

      const rect = progressBar.getBoundingClientRect();
      const moveX = touch.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, moveX / rect.width));
      const newTime = percentage * duration;
      
      setPreviewTime(newTime);
      video.currentTime = newTime;
    }
    
    // 垂直滑动
    if (isVerticalDragging && verticalDragType) {
      const deltaY = dragStartY - touch.clientY;
      const sensitivity = 0.005;
      const delta = deltaY * sensitivity;
      
      if (verticalDragType === 'volume') {
        const newVolume = Math.max(0, Math.min(1, dragStartValue + delta));
        handleVolumeChange(newVolume);
        setShowVolumeIndicator(true);
      } else if (verticalDragType === 'brightness') {
        const newBrightness = Math.max(0.2, Math.min(2, dragStartValue + delta));
        setBrightness(newBrightness);
        setShowBrightnessIndicator(true);
      }
    }
  };

  const handleGlobalTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      setShowPreview(false);
    }
    
    if (isVerticalDragging) {
      setIsVerticalDragging(false);
      setVerticalDragType(null);
      
      setTimeout(() => {
        setShowVolumeIndicator(false);
        setShowBrightnessIndicator(false);
      }, 1000);
    }
  };

  // 全局鼠标和触摸事件监听
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleProgressMouseMove(e);
      handleVideoMouseMove(e);
    };
    
    const handleGlobalMouseUp = () => {
      handleProgressMouseUp();
      handleVideoMouseUp();
    };
    
    if (isDragging || isVerticalDragging) {
      // 鼠标事件
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      // 触摸事件
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, isVerticalDragging, dragStartY, dragStartValue, verticalDragType, brightness, volume]);

  // 优化进度条点击（非拖动时）
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return; // 拖动时不处理点击
    
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar || !duration) return;

    try {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = percentage * duration;
      
      // 显示缓冲状态
      setIsLoading(true);
      
      video.currentTime = newTime;
      
      // 短暂延迟后隐藏缓冲状态
      setTimeout(() => {
        if (video.readyState >= 2) {
          setIsLoading(false);
        }
      }, 500);
    } catch (error) {
      console.warn('Progress click failed:', error);
      setIsLoading(false);
    }
  };

  // 优化音量控制，添加本地存储
  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setVolume(clampedVolume);
      video.volume = clampedVolume;
      setIsMuted(clampedVolume === 0);
      
      // 保存用户音量偏好到本地存储
      localStorage.setItem('videoPlayerVolume', clampedVolume.toString());
    } catch (error) {
      console.warn('Volume change failed:', error);
    }
  };

  // 优化静音切换，保存音量状态
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      // 恢复之前的音量
      const savedVolume = localStorage.getItem('videoPlayerVolumeBeforeMute');
      const restoreVolume = savedVolume ? parseFloat(savedVolume) : (volume > 0 ? volume : 0.5);
      video.volume = restoreVolume;
      setVolume(restoreVolume);
      setIsMuted(false);
    } else {
      // 保存当前音量
      const currentVolume = volume > 0 ? volume : 0.5;
      localStorage.setItem('videoPlayerVolumeBeforeMute', currentVolume.toString());
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const changeQuality = (qualityOption: QualityOption) => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = video.currentTime;
    const wasPlaying = !video.paused;
    
    video.src = qualityOption.src;
    video.currentTime = currentTime;
    
    if (wasPlaying) {
      video.play();
    }
    
    setQuality(qualityOption.value);
    setShowSettings(false);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden group ${className} ${isImmersiveMode ? 'fixed inset-0 z-50 rounded-none' : ''}`}
      onMouseEnter={() => !isImmersiveMode && setShowControls(true)}
      onMouseLeave={() => !isImmersiveMode && setShowControls(false)}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        className={`w-full h-full object-cover cursor-pointer select-none transition-all duration-300 ${isLongPressing ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''} ${isDragging ? 'cursor-grabbing' : ''} ${isVerticalDragging ? 'cursor-ns-resize' : ''}`}
        style={{
          ...style,
          filter: `brightness(${brightness})`,
          transition: isVerticalDragging ? 'none' : 'filter 0.3s ease'
        }}
        onClick={handleVideoInteraction}
        onMouseDown={(e) => {
          handleLongPressStart(e);
          handleVideoMouseDown(e);
        }}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={(e) => {
          handleLongPressStart(e);
          handleVideoTouchStart(e);
        }}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Loading Spinner */}
      {(isLoading || isRetrying) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            {isRetrying && (
              <p className="text-white text-sm">
                正在重试... ({retryCount}/3)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center p-6 max-w-sm mx-4">
            <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-medium mb-2">播放失败</h3>
            <p className="text-gray-300 text-sm mb-4">{errorMessage}</p>
            <div className="space-y-2">
               <button
                 onClick={() => {
                   setHasError(false);
                   setErrorMessage('');
                   setRetryCount(0);
                   setIsRetrying(true);
                   const video = videoRef.current;
                   if (video) {
                     video.load();
                   }
                 }}
                 className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
               >
                 重新加载
               </button>
               <button
                 onClick={() => {
                   setHasError(false);
                   setErrorMessage('');
                   setRetryCount(0);
                   setIsRetrying(false);
                 }}
                 className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
               >
                 关闭
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isPlaying && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
          >
            <Play className="w-8 h-8 text-black ml-1" />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 transition-all duration-500 ease-in-out backdrop-blur-sm ${
        isImmersiveMode 
          ? (showControlsInImmersive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')
          : (showControls ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2')
      }`}>
        {/* Progress Bar with Time Display */}
        <div className="mb-4 flex items-center space-x-3">
          <div 
            ref={progressRef}
            className={`flex-1 h-2 bg-gray-600 rounded-full cursor-pointer relative transition-all duration-200 hover:h-3 ${isDragging ? 'h-3' : ''}`}
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
          >
            {/* Buffered Progress */}
            <div 
              className="absolute top-0 left-0 h-full bg-gray-400 rounded-full transition-all duration-300"
              style={{ width: `${buffered}%`, opacity: 0.7 }}
            />
            {/* Current Progress */}
            <div 
              className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
            {/* Progress Handle */}
            <div 
              className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full transition-all duration-200 shadow-lg ${isDragging || showPreview ? 'opacity-100 scale-125' : 'opacity-0 hover:opacity-100'}`}
              style={{ left: `${progressPercentage}%`, marginLeft: '-8px' }}
            />
            
            {/* 拖动预览时间提示 */}
            {showPreview && (
              <div 
                className="absolute bottom-6 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded transition-opacity duration-200"
                style={{ left: `${(previewTime / duration) * 100}%` }}
              >
                {formatTime(previewTime)}
              </div>
            )}
          </div>
          
          {/* 时间显示 - 移到进度条右边 */}
          <span className="text-white text-sm bg-black bg-opacity-30 px-2 py-1 rounded whitespace-nowrap transition-all duration-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
      
      {/* 字幕显示 */}
      {enableTTS && subtitles.length > 0 && (
        <div className={`absolute left-4 right-4 transition-opacity duration-300 ${
          isImmersiveMode ? 'bottom-8' : 'bottom-20'
        }`}>
          <SubtitleDisplay
            videoCurrentTime={currentTime}
            subtitles={subtitles.map((sub, index) => ({
              id: index.toString(),
              text: sub.text,
              startTime: sub.start,
              endTime: sub.end,
              language: 'zh-CN'
            }))}
            isVisible={true}
            onToggleVisibility={() => {}}
          />
        </div>
      )}
      
      {/* TTS语音面板 */}
      {enableTTS && showVoicePanel && !isImmersiveMode && (
        <div className="absolute top-4 right-4 w-80">
          <VoiceGenerator
            ref={voiceGeneratorRef}
            enabled={true}
            mode="subtitle"
            autoPlay={autoReadSubtitles}
            className="shadow-lg"
            onVoiceStart={(text) => console.log('开始播放:', text)}
            onVoiceEnd={(text) => console.log('播放结束:', text)}
            onError={(error) => console.error('语音错误:', error)}
          />
        </div>
      )}
      
      {/* 音量指示器 */}
      {showVolumeIndicator && (
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 z-40 transition-all duration-300">
          <div className="bg-black bg-opacity-70 text-white px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <div className="w-20 h-2 bg-gray-600 rounded-full">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-200"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 亮度指示器 */}
      {showBrightnessIndicator && (
        <div className="absolute top-1/2 left-8 transform -translate-y-1/2 z-40 transition-all duration-300">
          <div className="bg-black bg-opacity-70 text-white px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div className="w-20 h-2 bg-gray-600 rounded-full">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all duration-200"
                  style={{ width: `${((brightness - 0.2) / 1.8) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{Math.round(brightness * 100)}%</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 加速倍数指示器 */}
      {showSpeedIndicator && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-yellow-500 bg-opacity-90 text-black px-6 py-3 rounded-full text-2xl font-bold shadow-lg animate-pulse">
            {accelerationSpeed}x
          </div>
          <div className="text-center mt-2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
            长按加速中...
          </div>
        </div>
      )}
      
      {/* 沉浸式模式提示 */}
      {isImmersiveMode && !showSpeedIndicator && (
        <div className={`absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm transition-opacity duration-300 ${
          showControlsInImmersive ? 'opacity-100' : 'opacity-0'
        }`}>
          按 ESC 键或点击视频退出沉浸模式
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;