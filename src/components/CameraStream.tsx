import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, RotateCcw, Settings } from 'lucide-react';

interface CameraStreamProps {
  isVideoOn: boolean;
  onVideoToggle: () => void;
  className?: string;
  facingMode?: 'user' | 'environment';
  onCameraSwitch?: () => void;
}

export default function CameraStream({ 
  isVideoOn, 
  onVideoToggle, 
  className = '', 
  facingMode: externalFacingMode = 'user',
  onCameraSwitch 
}: CameraStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalFacingMode, setInternalFacingMode] = useState<'user' | 'environment'>('user');
  
  // 使用外部传入的facingMode，如果没有则使用内部状态
  const currentFacingMode = externalFacingMode || internalFacingMode;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // 启动摄像头
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持摄像头功能');
      }

      // 请求摄像头权限
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false // 音频由其他组件处理
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
        videoRef.current.srcObject = stream;

        const el = videoRef.current;
        const token = Symbol('camToken');
        (el as any).__camToken = token;

        const playSafe = async () => {
          if (el.readyState < 1) {
            await new Promise<void>((resolve) => {
              const onLoaded = () => {
                el.removeEventListener('loadedmetadata', onLoaded);
                resolve();
              };
              el.addEventListener('loadedmetadata', onLoaded, { once: true });
            });
          }
          if ((el as any).__camToken !== token) return;
          try {
            await el.play();
          } catch (err: any) {
            const msg = String(err?.message || '');
            if (err?.name === 'AbortError' || msg.includes('interrupted') || msg.includes('AbortError')) {
              // 忽略由切换流导致的中断错误
              return;
            }
            console.error('摄像头视频播放失败:', err);
          }
        };

        requestAnimationFrame(() => { playSafe(); });
      }
    } catch (err) {
      console.error('摄像头启动失败:', err);
      setHasPermission(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问');
        } else if (err.name === 'NotFoundError') {
          setError('未找到摄像头设备');
        } else if (err.name === 'NotReadableError') {
          setError('摄像头被其他应用占用');
        } else {
          setError(err.message || '摄像头启动失败');
        }
      } else {
        setError('摄像头启动失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 停止摄像头
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 切换前后摄像头
  const switchCamera = async () => {
    if (onCameraSwitch) {
      // 如果有外部切换处理函数，调用它
      onCameraSwitch();
    } else {
      // 否则使用内部逻辑
      const newFacingMode = internalFacingMode === 'user' ? 'environment' : 'user';
      setInternalFacingMode(newFacingMode);
      
      if (isVideoOn) {
        stopCamera();
        // 延迟一下再启动新摄像头
        setTimeout(() => {
          startCamera();
        }, 100);
      }
    }
  };

  // 处理视频开关和摄像头方向变化
  useEffect(() => {
    if (isVideoOn) {
      startCamera();
    } else {
      stopCamera();
    }

    // 清理函数
    return () => {
      stopCamera();
    };
  }, [isVideoOn, currentFacingMode, startCamera]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className={`relative w-full h-full bg-gray-900 overflow-hidden ${className}`}>
      {isVideoOn ? (
        <>
          {/* 摄像头视频流 */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{
              transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none'
            }}
            autoPlay
            playsInline
            muted
          />
          
          {/* 加载状态 */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">正在启动摄像头...</p>
              </div>
            </div>
          )}
          
          {/* 错误状态 */}
          {error && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
              <div className="text-center text-white max-w-sm">
                <CameraOff className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <p className="text-sm mb-4">{error}</p>
                <button
                  onClick={startCamera}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          )}
          
          {/* 摄像头控制按钮 - 只在没有外部切换控制时显示 */}
          {!onCameraSwitch && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={switchCamera}
                className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                title="切换摄像头"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onVideoToggle}
                className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                title="关闭摄像头"
              >
                <CameraOff className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* 摄像头状态指示器 */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium">
              {currentFacingMode === 'user' ? '前置摄像头' : '后置摄像头'}
            </span>
          </div>
        </>
      ) : (
        /* 摄像头关闭状态 */
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CameraOff className="w-16 h-16" />
            </div>
            <p className="text-lg font-medium mb-2">摄像头已关闭</p>
            <p className="text-sm opacity-75 mb-4">开启摄像头开始直播</p>
            <button
              onClick={onVideoToggle}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full transition-colors flex items-center gap-2 mx-auto"
            >
              <Camera className="w-4 h-4" />
              开启摄像头
            </button>
          </div>
        </div>
      )}
    </div>
  );
}