import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import callService, { CallEvent, CallUser } from '../services/callService';
import { toast } from 'sonner';

interface IncomingCallNotificationProps {
  onAccept?: () => void;
  onReject?: () => void;
}

const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({ 
  onAccept, 
  onReject 
}) => {
  // 开关：是否输出调试日志
  const DEBUG_UI = (import.meta as any)?.env?.VITE_UI_DEBUG === 'true';
  
  const [isVisible, setIsVisible] = useState(false);
  const [remoteUser, setRemoteUser] = useState<CallUser | null>(null);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [hasUserGesture, setHasUserGesture] = useState(false);

  useEffect(() => {
    const onFirstInteraction = () => setHasUserGesture(true);
    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
  }, []);

  // 处理来电事件
  const handleIncomingCall = (event: CallEvent) => {
    if (event.type === 'incoming-call') {
      setRemoteUser(event.data.remoteUser);
      setCallType(event.data.callType);
      setIsVisible(true);
      setIsRinging(true);
      
      // 播放铃声（这里可以添加实际的铃声播放逻辑）
      playRingtone();
    }
  };

  // 处理通话状态变化
  const handleCallStateChange = (event: CallEvent) => {
    if (['call-accepted', 'call-rejected', 'call-ended'].includes(event.type)) {
      setIsVisible(false);
      setIsRinging(false);
      stopRingtone();
    }
  };

  // 播放铃声
  const playRingtone = () => {
    // 这里可以添加实际的铃声播放逻辑
    // 例如使用 Web Audio API 或 HTML5 Audio
    if (DEBUG_UI) console.log('播放铃声');
    
    // 简单的振动提醒（如果设备支持）
    if ('vibrate' in navigator && hasUserGesture) {
      try {
        navigator.vibrate([200, 100, 200, 100, 200]);
      } catch (_) {
        // ignore
      }
    }
  };

  // 停止铃声
  const stopRingtone = () => {
    if (DEBUG_UI) console.log('停止铃声');
    if ('vibrate' in navigator && hasUserGesture) {
      try {
        navigator.vibrate(0);
      } catch (_) {
        // ignore
      }
    }
  };

  // 接听通话
  const handleAcceptCall = () => {
    callService.acceptCall();
    setIsVisible(false);
    setIsRinging(false);
    stopRingtone();
    
    if (onAccept) {
      onAccept();
    }
  };

  // 拒绝通话
  const handleRejectCall = () => {
    callService.rejectCall();
    setIsVisible(false);
    setIsRinging(false);
    stopRingtone();
    
    if (onReject) {
      onReject();
    }
  };

  // 设置事件监听
  useEffect(() => {
    callService.addEventListener('incoming-call', handleIncomingCall);
    callService.addEventListener('call-accepted', handleCallStateChange);
    callService.addEventListener('call-rejected', handleCallStateChange);
    callService.addEventListener('call-ended', handleCallStateChange);

    return () => {
      callService.removeEventListener('incoming-call', handleIncomingCall);
      callService.removeEventListener('call-accepted', handleCallStateChange);
      callService.removeEventListener('call-rejected', handleCallStateChange);
      callService.removeEventListener('call-ended', handleCallStateChange);
      stopRingtone();
    };
  }, []);

  // 如果不可见，不渲染组件
  if (!isVisible || !remoteUser) {
    return null;
  }

  return (
    <>
      {/* 全屏遮罩 */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
          {/* 来电信息 */}
          <div className="text-center mb-8">
            <div className="relative mb-4">
              <img 
                src={remoteUser.avatar} 
                alt={remoteUser.name}
                className={`w-24 h-24 rounded-full object-cover mx-auto border-4 border-blue-500 ${
                  isRinging ? 'animate-pulse' : ''
                }`}
              />
              {/* 通话类型图标 */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                {callType === 'video' ? (
                  <Video size={16} className="text-white" />
                ) : (
                  <Phone size={16} className="text-white" />
                )}
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {remoteUser.name}
            </h3>
            
            <p className="text-gray-600">
              {callType === 'video' ? '视频通话' : '语音通话'}来电
            </p>
            
            {/* 动画波纹效果 */}
            {isRinging && (
              <div className="flex justify-center mt-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="flex justify-center gap-8">
            {/* 拒绝按钮 */}
            <button
              onClick={handleRejectCall}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <PhoneOff size={24} className="text-white" />
            </button>
            
            {/* 接听按钮 */}
            <button
              onClick={handleAcceptCall}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Phone size={24} className="text-white" />
            </button>
          </div>
          
          {/* 提示文字 */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              滑动接听或拒绝通话
            </p>
          </div>
        </div>
      </div>
      
      {/* 顶部通知栏（备用显示方式） */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-blue-500 text-white p-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <img 
            src={remoteUser.avatar} 
            alt={remoteUser.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <div className="font-medium text-sm">{remoteUser.name}</div>
            <div className="text-xs opacity-90">
              {callType === 'video' ? '视频' : '语音'}通话来电
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleRejectCall}
            className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
          >
            <PhoneOff size={16} className="text-white" />
          </button>
          
          <button
            onClick={handleAcceptCall}
            className="p-2 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
          >
            <Phone size={16} className="text-white" />
          </button>
        </div>
      </div>
    </>
  );
};

export default IncomingCallNotification;