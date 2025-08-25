import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Vibrate, Smartphone, Wifi, WifiOff, Battery, BatteryLow } from 'lucide-react';

// 移动端状态检测Hook
export function useMobileStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const [networkType, setNetworkType] = useState<string>('unknown');
  const [deviceOrientation, setDeviceOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    // 网络状态监听
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 电池状态监听
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level);
        });
        
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }

    // 网络类型检测
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkType(connection.effectiveType || 'unknown');
      
      connection.addEventListener('change', () => {
        setNetworkType(connection.effectiveType || 'unknown');
      });
    }

    // 设备方向监听
    const handleOrientationChange = () => {
      setDeviceOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };
    
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return {
    isOnline,
    batteryLevel,
    isCharging,
    networkType,
    deviceOrientation,
    isLowBattery: batteryLevel !== null && batteryLevel < 0.2
  };
}

// 触觉反馈Hook
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate(10), [vibrate]);
  const mediumTap = useCallback(() => vibrate(50), [vibrate]);
  const heavyTap = useCallback(() => vibrate(100), [vibrate]);
  const doubleTap = useCallback(() => vibrate([50, 50, 50]), [vibrate]);
  const errorVibration = useCallback(() => vibrate([100, 50, 100]), [vibrate]);
  const successVibration = useCallback(() => vibrate([50, 25, 50, 25, 50]), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    doubleTap,
    errorVibration,
    successVibration
  };
}

// 长按检测Hook
export function useLongPress(
  onLongPress: () => void,
  delay: number = 500,
  onPress?: () => void
) {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    setIsLongPressing(true);
    isLongPressRef.current = false;
    
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback(() => {
    setIsLongPressing(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (!isLongPressRef.current && onPress) {
      onPress();
    }
  }, [onPress]);

  const cancel = useCallback(() => {
    setIsLongPressing(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLongPressing,
    handlers: {
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: stop,
      onTouchCancel: cancel
    }
  };
}

// 移动端优化的滚动容器
interface MobileScrollContainerProps {
  children: React.ReactNode;
  onPullToRefresh?: () => Promise<void>;
  onReachBottom?: () => void;
  refreshThreshold?: number;
  bottomThreshold?: number;
  className?: string;
}

export function MobileScrollContainer({
  children,
  onPullToRefresh,
  onReachBottom,
  refreshThreshold = 80,
  bottomThreshold = 100,
  className = ''
}: MobileScrollContainerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const haptic = useHapticFeedback();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current || containerRef.current.scrollTop > 0) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, refreshThreshold * 1.5));
      
      if (distance >= refreshThreshold && !canRefresh) {
        setCanRefresh(true);
        haptic.lightTap();
      } else if (distance < refreshThreshold && canRefresh) {
        setCanRefresh(false);
      }
    }
  }, [refreshThreshold, canRefresh, haptic]);

  const handleTouchEnd = useCallback(async () => {
    if (canRefresh && onPullToRefresh && !isRefreshing) {
      setIsRefreshing(true);
      haptic.successVibration();
      
      try {
        await onPullToRefresh();
      } finally {
        setIsRefreshing(false);
        setCanRefresh(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [canRefresh, onPullToRefresh, isRefreshing, haptic]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !onReachBottom) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    if (distanceFromBottom <= bottomThreshold) {
      onReachBottom();
    }
  }, [onReachBottom, bottomThreshold]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onScroll={handleScroll}
      style={{
        transform: `translateY(${Math.min(pullDistance * 0.5, refreshThreshold * 0.5)}px)`,
        transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
      }}
    >
      {/* 下拉刷新指示器 */}
      {onPullToRefresh && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
          style={{
            height: Math.min(pullDistance, refreshThreshold),
            transform: `translateY(-${refreshThreshold}px)`,
            opacity: pullDistance > 0 ? 1 : 0
          }}
        >
          <div className="flex items-center gap-2 text-gray-600">
            {isRefreshing ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">刷新中...</span>
              </>
            ) : canRefresh ? (
              <>
                <div className="w-5 h-5 text-blue-500">↑</div>
                <span className="text-sm">松开刷新</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 text-gray-400">↓</div>
                <span className="text-sm">下拉刷新</span>
              </>
            )}
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

// 移动端状态栏组件
interface MobileStatusBarProps {
  showNetworkStatus?: boolean;
  showBatteryStatus?: boolean;
  className?: string;
}

export function MobileStatusBar({
  showNetworkStatus = true,
  showBatteryStatus = true,
  className = ''
}: MobileStatusBarProps) {
  const { isOnline, batteryLevel, isCharging, networkType, isLowBattery } = useMobileStatus();

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {showNetworkStatus && (
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
            {isOnline ? networkType.toUpperCase() : '离线'}
          </span>
        </div>
      )}
      
      {showBatteryStatus && batteryLevel !== null && (
        <div className="flex items-center gap-1">
          {isLowBattery ? (
            <BatteryLow className="w-3 h-3 text-red-500" />
          ) : (
            <Battery className="w-3 h-3 text-gray-600" />
          )}
          <span className={isLowBattery ? 'text-red-600' : 'text-gray-600'}>
            {Math.round(batteryLevel * 100)}%
            {isCharging && ' ⚡'}
          </span>
        </div>
      )}
    </div>
  );
}

// 移动端安全区域组件
interface SafeAreaProps {
  children: React.ReactNode;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  className?: string;
}

export function SafeArea({
  children,
  top = true,
  bottom = true,
  left = true,
  right = true,
  className = ''
}: SafeAreaProps) {
  const safeAreaClasses = [
    top && 'pt-safe-top',
    bottom && 'pb-safe-bottom',
    left && 'pl-safe-left',
    right && 'pr-safe-right'
  ].filter(Boolean).join(' ');

  return (
    <div className={`${safeAreaClasses} ${className}`}>
      {children}
    </div>
  );
}

// 移动端手势识别组件
interface GestureRecognizerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  threshold?: number;
  className?: string;
}

export function GestureRecognizer({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onRotate,
  threshold = 50,
  className = ''
}: GestureRecognizerProps) {
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialAngle, setInitialAngle] = useState<number | null>(null);
  const haptic = useHapticFeedback();

  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchAngle = (touch1: React.Touch, touch2: React.Touch): number => {
    return Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    ) * 180 / Math.PI;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const angle = getTouchAngle(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
      setInitialAngle(angle);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (e.touches.length === 2 && initialDistance && initialAngle) {
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const currentAngle = getTouchAngle(e.touches[0], e.touches[1]);
      
      if (onPinch) {
        const scale = currentDistance / initialDistance;
        onPinch(scale);
      }
      
      if (onRotate) {
        const angleDiff = currentAngle - initialAngle;
        onRotate(angleDiff);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // 水平滑动
      if (isLeftSwipe && onSwipeLeft) {
        haptic.lightTap();
        onSwipeLeft();
      }
      if (isRightSwipe && onSwipeRight) {
        haptic.lightTap();
        onSwipeRight();
      }
    } else {
      // 垂直滑动
      if (isUpSwipe && onSwipeUp) {
        haptic.lightTap();
        onSwipeUp();
      }
      if (isDownSwipe && onSwipeDown) {
        haptic.lightTap();
        onSwipeDown();
      }
    }

    setInitialDistance(null);
    setInitialAngle(null);
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}