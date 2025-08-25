import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  RotateCcw,
  Minimize2,
  Maximize2
} from 'lucide-react';
import callService, { CallState, CallEvent, CallUser } from '../services/callService';
import { toast } from 'sonner';

interface CallInterfaceProps {
  onClose?: () => void;
}

const CallInterface: React.FC<CallInterfaceProps> = ({ onClose }) => {
  const [callState, setCallState] = useState<CallState>(callService.getCallState());
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 格式化通话时长
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // 更新通话时长
  const updateDuration = () => {
    if (callState.isInCall) {
      setCallDuration(callService.getCallDuration());
    }
  };

  // 设置视频流（安全播放，避免 AbortError）
  const setupVideoStream = (videoElement: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!videoElement || !stream) return;

    try {
      // 如果已是同一流且正在播放则跳过
      if (videoElement.srcObject === stream && !videoElement.paused) return;

      // 先暂停，避免在切换源时触发中断错误
      try { videoElement.pause(); } catch {}

      videoElement.playsInline = true;
      videoElement.autoplay = true;

      // 记录一次性令牌，避免旧的播放请求在切源后继续执行
      const token = Symbol('loadToken');
      (videoElement as any).__loadToken = token;

      if (videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }

      const playSafe = async () => {
        // 等待元数据就绪
        if (videoElement.readyState < 1) {
          await new Promise<void>((resolve) => {
            const onLoaded = () => {
              videoElement.removeEventListener('loadedmetadata', onLoaded);
              resolve();
            };
            videoElement.addEventListener('loadedmetadata', onLoaded, { once: true });
          });
        }

        // 如果在等待期间又被切换了流，终止本次播放流程
        if ((videoElement as any).__loadToken !== token) return;

        try {
          await videoElement.play();
        } catch (err: any) {
          // 浏览器在切换流/重新加载时会抛出 AbortError，可安全忽略
          const msg = String(err?.message || '');
          if (err?.name === 'AbortError' || msg.includes('interrupted') || msg.includes('AbortError')) {
            return;
          }
          console.error('video.play() 失败:', err);
        }
      };

      // 放到下一帧，确保 srcObject 变更生效
      requestAnimationFrame(() => { playSafe(); });
    } catch (e) {
      console.error('setupVideoStream 执行异常:', e);
    }
  };

  // 处理通话事件
  const handleCallEvent = (event: CallEvent) => {
    console.log('通话事件:', event);
    setCallState(callService.getCallState());
    
    switch (event.type) {
      case 'stream-ready':
        setupVideoStream(localVideoRef.current, event.data.stream);
        break;
      case 'remote-stream-ready':
        setupVideoStream(remoteVideoRef.current, event.data.stream);
        break;
      case 'call-ended':
      case 'call-rejected':
        if (onClose) {
          onClose();
        }
        break;
    }
  };

  // 组件挂载时设置事件监听
  useEffect(() => {
    const eventTypes = [
      'incoming-call',
      'call-accepted',
      'call-rejected', 
      'call-ended',
      'call-error',
      'stream-ready',
      'remote-stream-ready'
    ] as const;

    eventTypes.forEach(type => {
      callService.addEventListener(type, handleCallEvent);
    });

    // 设置通话时长更新定时器
    durationIntervalRef.current = setInterval(updateDuration, 1000);

    return () => {
      eventTypes.forEach(type => {
        callService.removeEventListener(type, handleCallEvent);
      });
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // 监听通话状态变化，设置视频流
  useEffect(() => {
    if (callState.localStream) {
      setupVideoStream(localVideoRef.current, callState.localStream);
    }
    if (callState.remoteStream) {
      setupVideoStream(remoteVideoRef.current, callState.remoteStream);
    }
  }, [callState.localStream, callState.remoteStream]);

  // 处理接听通话
  const handleAcceptCall = () => {
    callService.acceptCall();
  };

  // 处理拒绝通话
  const handleRejectCall = () => {
    callService.rejectCall();
  };

  // 处理结束通话
  const handleEndCall = () => {
    callService.endCall();
  };

  // 处理静音切换
  const handleToggleMute = () => {
    callService.toggleMute();
    setCallState(callService.getCallState());
  };

  // 处理视频切换
  const handleToggleVideo = () => {
    callService.toggleVideo();
    setCallState(callService.getCallState());
  };

  // 处理摄像头切换
  const handleSwitchCamera = () => {
    callService.switchCamera();
  };

  // 处理最小化/最大化
  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // 如果没有通话状态，不渲染组件
  if (!callState.isInCall && !callState.isIncoming && !callState.isOutgoing) {
    return null;
  }

  // 最小化状态的渲染
  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 min-w-[200px]">
        <div className="flex items-center gap-2 flex-1">
          {callState.remoteUser && (
            <img 
              src={callState.remoteUser.avatar} 
              alt={callState.remoteUser.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div className="text-white text-sm">
            <div className="font-medium">{callState.remoteUser?.name}</div>
            <div className="text-xs opacity-75">
              {callState.isInCall ? formatDuration(callDuration) : '连接中...'}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleToggleMinimize}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <Maximize2 size={16} className="text-white" />
        </button>
        
        <button
          onClick={handleEndCall}
          className="p-1 bg-red-500 hover:bg-red-600 rounded transition-colors"
        >
          <PhoneOff size={16} className="text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 头部信息栏 */}
      <div className="bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {callState.remoteUser && (
            <img 
              src={callState.remoteUser.avatar} 
              alt={callState.remoteUser.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div className="text-white">
            <div className="font-medium text-lg">{callState.remoteUser?.name}</div>
            <div className="text-sm opacity-75">
              {callState.isIncoming && '来电中...'}
              {callState.isOutgoing && !callState.isInCall && '呼叫中...'}
              {callState.isInCall && formatDuration(callDuration)}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleToggleMinimize}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <Minimize2 size={20} className="text-white" />
        </button>
      </div>

      {/* 视频区域 */}
      <div className="flex-1 relative">
        {/* 远程视频 */}
        {callState.callType === 'video' && (
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={false}
          />
        )}
        
        {/* 语音通话时的占位符 */}
        {callState.callType === 'voice' && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
            {callState.remoteUser && (
              <div className="text-center">
                <img 
                  src={callState.remoteUser.avatar} 
                  alt={callState.remoteUser.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-white/20"
                />
                <div className="text-white text-2xl font-medium">{callState.remoteUser.name}</div>
                <div className="text-white/75 text-lg mt-2">
                  {callState.isInCall ? '语音通话中' : '连接中...'}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 本地视频（画中画） */}
        {callState.callType === 'video' && callState.localStream && (
          <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-white/20">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      <div className="bg-black/50 backdrop-blur-sm p-6">
        {/* 来电时的按钮 */}
        {callState.isIncoming && (
          <div className="flex justify-center gap-8">
            <button
              onClick={handleRejectCall}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
            >
              <PhoneOff size={24} className="text-white" />
            </button>
            
            <button
              onClick={handleAcceptCall}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
            >
              <Phone size={24} className="text-white" />
            </button>
          </div>
        )}
        
        {/* 通话中的控制按钮 */}
        {(callState.isInCall || callState.isOutgoing) && (
          <div className="flex justify-center gap-4">
            {/* 静音按钮 */}
            <button
              onClick={handleToggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                callState.isMuted 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {callState.isMuted ? (
                <MicOff size={20} className="text-white" />
              ) : (
                <Mic size={20} className="text-white" />
              )}
            </button>
            
            {/* 视频按钮（仅视频通话时显示） */}
            {callState.callType === 'video' && (
              <>
                <button
                  onClick={handleToggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    !callState.isVideoEnabled 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {callState.isVideoEnabled ? (
                    <Video size={20} className="text-white" />
                  ) : (
                    <VideoOff size={20} className="text-white" />
                  )}
                </button>
                
                {/* 切换摄像头按钮 */}
                <button
                  onClick={handleSwitchCamera}
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <RotateCcw size={20} className="text-white" />
                </button>
              </>
            )}
            
            {/* 挂断按钮 */}
            <button
              onClick={handleEndCall}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
            >
              <PhoneOff size={24} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallInterface;