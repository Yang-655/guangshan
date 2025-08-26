import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, MessageCircle, Gift, Users, Share, MoreHorizontal, Mic, MicOff, Video, VideoOff, Settings, Star, Crown, Zap, Volume2, FlipHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LiveInteraction from '../components/LiveInteraction';
import VoiceGenerator, { VoiceGeneratorRef } from '../components/VoiceGenerator';
import CameraStream from '../components/CameraStream';
import { useToast } from '../components/Toast';

interface LiveMessage {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
    level: number;
    isVip: boolean;
  };
  message: string;
  type: 'message' | 'gift' | 'join' | 'follow';
  timestamp: number;
  giftInfo?: {
    name: string;
    icon: React.ReactNode;
    count: number;
  };
}

interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
  animation: string;
}

const LiveStreaming: React.FC = () => {
  const navigate = useNavigate();
  const { success, info } = useToast();
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(1234);
  const [streamQuality, setStreamQuality] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [bitrate, setBitrate] = useState(2500);
  const [fps, setFps] = useState(30);
  const [streamHealth, setStreamHealth] = useState<'excellent' | 'good' | 'poor' | 'critical'>('good');
  const [networkLatency, setNetworkLatency] = useState(45);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [totalViewTime, setTotalViewTime] = useState(0);
  const [peakViewers, setPeakViewers] = useState(1234);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);

  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [enableTTS, setEnableTTS] = useState(false);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [autoReadComments, setAutoReadComments] = useState(false);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [mouseTimer, setMouseTimer] = useState<NodeJS.Timeout | null>(null);
  const [showUIInImmersive, setShowUIInImmersive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [showStreamStats, setShowStreamStats] = useState(false);
  const [danmakuEnabled, setDanmakuEnabled] = useState(true);
  const [danmakuSpeed, setDanmakuSpeed] = useState(1);
  const [danmakuOpacity, setDanmakuOpacity] = useState(0.8);
  const [moderationEnabled, setModerationEnabled] = useState(true);
  const [blockedWords, setBlockedWords] = useState<string[]>(['spam', '广告', '刷屏']);
  const [autoModeration, setAutoModeration] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareStats, setShareStats] = useState({
    total: 0,
    wechat: 0,
    qq: 0,
    weibo: 0,
    link: 0,
    native: 0
  });
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchCurrentY, setTouchCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pinchStartDistance, setPinchStartDistance] = useState(0);
  const [pinchCurrentDistance, setPinchCurrentDistance] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  
  const voiceGeneratorRef = useRef<VoiceGeneratorRef>(null);

  // 礼物列表
  const gifts: Gift[] = [
    { id: '1', name: '爱心', icon: '❤️', price: 1, animation: 'bounce' },
    { id: '2', name: '玫瑰', icon: '🌹', price: 5, animation: 'pulse' },
    { id: '3', name: '钻石', icon: '💎', price: 10, animation: 'sparkle' },
    { id: '4', name: '皇冠', icon: '👑', price: 50, animation: 'glow' },
    { id: '5', name: '火箭', icon: '🚀', price: 100, animation: 'fly' },
    { id: '6', name: '城堡', icon: '🏰', price: 500, animation: 'grand' }
  ];

  // 模拟消息数据
  const mockMessages: LiveMessage[] = [
    {
      id: '1',
      user: { id: '1', username: '观众小明', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20young%20man&image_size=square', level: 5, isVip: false },
      message: '主播好！',
      type: 'message',
      timestamp: Date.now() - 30000
    },
    {
      id: '2',
      user: { id: '2', username: 'VIP用户', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=vip%20user%20avatar%20elegant&image_size=square', level: 15, isVip: true },
      message: '送给主播一朵玫瑰',
      type: 'gift',
      timestamp: Date.now() - 20000,
      giftInfo: { name: '玫瑰', icon: '🌹', count: 1 }
    },
    {
      id: '3',
      user: { id: '3', username: '新观众', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=new%20user%20avatar%20friendly&image_size=square', level: 1, isVip: false },
      message: '进入了直播间',
      type: 'join',
      timestamp: Date.now() - 10000
    }
  ];

  // 设置直播状态以隐藏导航菜单
  useEffect(() => {
    localStorage.setItem('live_streaming', 'true');
    
    return () => {
      localStorage.removeItem('live_streaming');
    };
  }, []);

  useEffect(() => {
    setMessages(mockMessages);
    
    // 模拟实时消息
    const interval = setInterval(() => {
      const randomMessages = [
        '主播唱得真好听！',
        '这个直播太有趣了',
        '关注了！',
        '666',
        '主播加油！',
        '画质真清晰',
        '声音很棒',
        '内容很有趣',
        '支持主播',
        '第一次看直播'
      ];
      
      const messageText = randomMessages[Math.floor(Math.random() * randomMessages.length)];
      
      // 内容审核
      const isBlocked = moderationEnabled && autoModeration && 
        blockedWords.some(word => messageText.includes(word));
      
      if (!isBlocked) {
        const newMsg: LiveMessage = {
          id: Date.now().toString(),
          user: {
            id: Math.random().toString(),
            username: `观众${Math.floor(Math.random() * 1000)}`,
            avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=random%20user%20avatar&image_size=square',
            level: Math.floor(Math.random() * 20) + 1,
            isVip: Math.random() > 0.8
          },
          message: messageText,
          type: 'message',
          timestamp: Date.now()
        };
        
        setMessages(prev => {
          const updatedMessages = [...prev.slice(-20), newMsg];
          
          // TTS播放新消息
          if (enableTTS && autoReadComments && newMsg.type === 'message') {
            voiceGeneratorRef.current?.addComment(`${newMsg.user.username}说：${newMsg.message}`);
          } else if (enableTTS && newMsg.type === 'gift' && newMsg.giftInfo) {
            voiceGeneratorRef.current?.addSystem(`${newMsg.user.username}送出了${newMsg.giftInfo.name}`);
          } else if (enableTTS && newMsg.type === 'join') {
            voiceGeneratorRef.current?.addSystem(`${newMsg.user.username}进入了直播间`);
          }
          
          return updatedMessages;
        });
      }
      
      // 更新观众数量
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        const newCount = Math.max(1, prev + change);
        if (newCount > peakViewers) {
          setPeakViewers(newCount);
        }
        return newCount;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [enableTTS, autoReadComments, moderationEnabled, autoModeration, blockedWords, peakViewers]);

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
    
    setShowUIInImmersive(true);
    
    if (mouseTimer) {
      clearTimeout(mouseTimer);
    }
    
    const timer = setTimeout(() => {
      setShowUIInImmersive(false);
    }, 3000);
    
    setMouseTimer(timer);
  };

  // 计算两点间距离
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 手势控制沉浸式模式
  const handlePinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setPinchStartDistance(distance);
      setPinchCurrentDistance(distance);
      setIsPinching(true);
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setPinchCurrentDistance(distance);
    }
  };

  const handlePinchEnd = () => {
    if (isPinching && pinchStartDistance > 0) {
      const scale = pinchCurrentDistance / pinchStartDistance;
      
      // 放大手势进入沉浸模式 (scale > 1.2)
      if (scale > 1.2 && !isImmersiveMode) {
        setIsImmersiveMode(true);
        setShowUIInImmersive(true);
        // 3秒后自动隐藏UI
        setTimeout(() => {
          setShowUIInImmersive(false);
        }, 3000);
      }
      // 缩小手势退出沉浸模式 (scale < 0.8)
      else if (scale < 0.8 && isImmersiveMode) {
        setIsImmersiveMode(false);
      }
    }
    
    setIsPinching(false);
    setPinchStartDistance(0);
    setPinchCurrentDistance(0);
  };

  // 流媒体统计监控
  useEffect(() => {
    if (!isStreaming) return;
    
    const statsInterval = setInterval(() => {
      // 模拟网络延迟变化
      setNetworkLatency(prev => {
        const change = (Math.random() - 0.5) * 20;
        return Math.max(10, Math.min(200, prev + change));
      });
      
      // 模拟丢帧统计
      if (Math.random() < 0.1) {
        setDroppedFrames(prev => prev + Math.floor(Math.random() * 3));
      }
      
      // 更新流健康状态
      setStreamHealth(prev => {
        if (networkLatency > 150 || droppedFrames > 50) return 'critical';
        if (networkLatency > 100 || droppedFrames > 20) return 'poor';
        if (networkLatency > 60 || droppedFrames > 5) return 'good';
        return 'excellent';
      });
      
      // 更新直播时长
      if (streamStartTime) {
        setStreamDuration(Math.floor((Date.now() - streamStartTime) / 1000));
      }
      
      // 累计观看时长
      setTotalViewTime(prev => prev + viewerCount);
    }, 1000);
    
    return () => clearInterval(statsInterval);
  }, [isStreaming, networkLatency, droppedFrames, streamStartTime, viewerCount]);
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (mouseTimer) {
        clearTimeout(mouseTimer);
      }
    };
  }, [mouseTimer]);

  const handleSendMessage = (message: string) => {
    const chatMessage: LiveMessage = {
      id: Date.now().toString(),
      user: {
        id: 'current-user',
        username: '我',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=current%20user%20avatar&image_size=square',
        level: 10,
        isVip: false
      },
      message: message,
      type: 'message',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, chatMessage]);
    
    // TTS播放新消息
    if (enableTTS && autoReadComments) {
      voiceGeneratorRef.current?.addChat(`${chatMessage.user.username}说：${message}`);
    }
  };

  const handleSendGift = (gift: { id: string; name: string; icon: React.ReactNode; price: number; animation: string; rarity: 'common' | 'rare' | 'epic' | 'legendary' }, count: number) => {
    const giftMessage: LiveMessage = {
      id: Date.now().toString(),
      user: {
        id: 'current-user',
        username: '我',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=current%20user%20avatar&image_size=square',
        level: 10,
        isVip: false
      },
      message: `送出了${gift.name}`,
      type: 'gift',
      timestamp: Date.now(),
      giftInfo: { name: gift.name, icon: gift.icon, count: count }
    };
    setMessages(prev => [...prev, giftMessage]);
  };

  const handleToggleMic = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  const handleRequestConnect = () => {
    console.log('申请连麦');
  };

  const handleAcceptConnect = (userId: string) => {
    console.log('接受连麦:', userId);
  };

  const handleRejectConnect = (userId: string) => {
    console.log('拒绝连麦:', userId);
  };

  // 分享到不同平台的函数
  const shareToWeChat = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('正在观看直播');
    const desc = encodeURIComponent('快来看看这个精彩的直播！');
    
    // 微信分享（通过二维码或链接）
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${url}`, '_blank');
    updateShareStats('wechat');
    success('请扫描二维码分享到微信');
  };
  
  const shareToQQ = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('正在观看直播');
    const desc = encodeURIComponent('快来看看这个精彩的直播！');
    
    window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}&desc=${desc}`, '_blank');
    updateShareStats('qq');
    success('正在跳转到QQ分享');
  };
  
  const shareToWeibo = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('正在观看直播 - 快来看看这个精彩的直播！');
    
    window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`, '_blank');
    updateShareStats('weibo');
    success('正在跳转到微博分享');
  };
  
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      updateShareStats('link');
      success('直播链接已复制到剪贴板！');
      
      // 触觉反馈
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (error) {
      info('复制失败，请手动复制链接');
    }
  };
  
  const updateShareStats = (platform: keyof typeof shareStats) => {
    setShareStats(prev => ({
      ...prev,
      [platform]: prev[platform] + 1,
      total: prev.total + 1
    }));
  };
  
  // 触摸手势处理
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchCurrentY(e.touches[0].clientY);
    setIsDragging(false);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    setTouchCurrentY(currentY);
    
    const deltaY = currentY - touchStartY;
    if (Math.abs(deltaY) > 10) {
      setIsDragging(true);
    }
  };
  
  const handleTouchEnd = () => {
    if (isDragging) {
      const deltaY = touchCurrentY - touchStartY;
      // 如果向下滑动超过100px，关闭面板
      if (deltaY > 100) {
        setShowSharePanel(false);
        // 触觉反馈
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }
    setIsDragging(false);
    setTouchStartY(0);
    setTouchCurrentY(0);
  };
  
  const handleShareStream = async () => {
    if (isSharing) return; // 防止重复点击
    
    // 触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // 如果支持原生分享，直接分享；否则显示分享面板
    if (navigator.share) {
      setIsSharing(true);
      setShareSuccess(false);
      setShareError(false);
      
      try {
        await navigator.share({
          title: '正在观看直播',
          text: '快来看看这个精彩的直播！',
          url: window.location.href
        });
        
        // 分享成功动画
        setShareSuccess(true);
        updateShareStats('native');
        success('分享成功！');
        
        // 触觉反馈
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (error) {
        console.error('分享失败:', error);
        
        if (error instanceof Error && error.name === 'AbortError') {
          info('分享已取消');
        } else {
          setShareError(true);
          info('分享失败，请稍后重试');
          
          // 错误触觉反馈
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
          
          setTimeout(() => setShareError(false), 2000);
        }
      } finally {
        setTimeout(() => setIsSharing(false), 500);
      }
    } else {
      // 显示分享面板
      setShowSharePanel(true);
    }
  };

  const toggleStreaming = () => {
    if (!isStreaming) {
      // 开始直播
      setIsStreaming(true);
      setStreamStartTime(Date.now());
      setStreamDuration(0);
      setDroppedFrames(0);
      setTotalViewTime(0);
      setPeakViewers(viewerCount);
      setStreamHealth('excellent');
      // 设置直播状态，隐藏导航菜单
      localStorage.setItem('live_streaming', 'true');
      success('直播已开始！');
    } else {
      // 结束直播
      setIsStreaming(false);
      setStreamStartTime(null);
      // 清除直播状态，显示导航菜单
      localStorage.removeItem('live_streaming');
      info(`直播已结束，总时长: ${Math.floor(streamDuration / 60)}分${streamDuration % 60}秒`);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getStreamHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'poor': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  const getStreamHealthBg = (health: string) => {
    switch (health) {
      case 'excellent': return 'bg-green-500/20';
      case 'good': return 'bg-blue-500/20';
      case 'poor': return 'bg-yellow-500/20';
      case 'critical': return 'bg-red-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  const switchCamera = async () => {
    if (isSwitchingCamera) {
      return;
    }
    
    setIsSwitchingCamera(true);
    const newFacing = cameraFacing === 'front' ? 'back' : 'front';
    
    try {
      setCameraFacing(newFacing);
      info(`已切换到${newFacing === 'front' ? '前置' : '后置'}摄像头`);
    } catch (error) {
      console.error('切换摄像头失败:', error);
    } finally {
      setTimeout(() => {
        setIsSwitchingCamera(false);
      }, 500);
    }
  };

  // 处理点击空白区域关闭设置菜单
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // 如果点击的不是设置菜单或其子元素，则关闭菜单
    const target = e.target as HTMLElement;
    const settingsPanel = document.querySelector('[data-settings-panel]');
    const settingsButton = document.querySelector('[data-settings-button]');
    
    if (showSettings && 
        settingsPanel && 
        !settingsPanel.contains(target) && 
        settingsButton && 
        !settingsButton.contains(target)) {
      setShowSettings(false);
    }
    
    // 同样处理分享面板
    if (showSharePanel) {
      const sharePanel = document.querySelector('[data-share-panel]');
      const shareButton = document.querySelector('[data-share-button]');
      
      if (sharePanel && 
          !sharePanel.contains(target) && 
          shareButton && 
          !shareButton.contains(target)) {
        setShowSharePanel(false);
      }
    }
  };

  const renderMessage = (msg: LiveMessage) => {
    const levelColor = msg.user.level >= 15 ? 'text-yellow-500' : msg.user.level >= 10 ? 'text-purple-500' : msg.user.level >= 5 ? 'text-blue-500' : 'text-gray-500';
    
    return (
      <div key={msg.id} className="mb-2 animate-fade-in">
        <div className="flex items-start gap-2">
          <img
            src={msg.user.avatar}
            alt={msg.user.username}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <span className={`text-xs font-medium ${levelColor}`}>
                Lv.{msg.user.level}
              </span>
              {msg.user.isVip && (
                <Crown className="w-3 h-3 text-yellow-500" />
              )}
              <span className="text-sm font-medium text-white truncate">
                {msg.user.username}
              </span>
            </div>
            
            {msg.type === 'message' && (
              <p className="text-sm text-white/90 break-words">{msg.message}</p>
            )}
            
            {msg.type === 'gift' && msg.giftInfo && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg p-2">
                <span className="text-lg">{msg.giftInfo.icon}</span>
                <span className="text-sm text-white font-medium">
                  送出了 {msg.giftInfo.name} x{msg.giftInfo.count}
                </span>
              </div>
            )}
            
            {msg.type === 'join' && (
              <p className="text-sm text-blue-300">进入了直播间</p>
            )}
            
            {msg.type === 'follow' && (
              <p className="text-sm text-pink-300">关注了主播</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`min-h-screen bg-black relative overflow-hidden ${
        isImmersiveMode ? 'fixed inset-0 z-50' : ''
      }`}
      onClick={handleBackgroundClick}
    >
      {/* 直播画面区域 */}
      <div 
        className="absolute inset-0"
        onTouchStart={handlePinchStart}
        onTouchMove={handlePinchMove}
        onTouchEnd={handlePinchEnd}
      >
        {isStreaming ? (
          /* 直播中显示摄像头画面 */
          <CameraStream 
            isVideoOn={isVideoOn}
            onVideoToggle={() => setIsVideoOn(!isVideoOn)}
            facingMode={cameraFacing === 'front' ? 'user' : 'environment'}
            onCameraSwitch={switchCamera}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <VideoOff className="w-16 h-16" />
              </div>
              <p className="text-lg font-medium">直播已停止</p>
              <p className="text-sm opacity-75 mt-2 mb-4">开启摄像头开始直播</p>
              <button
                onClick={toggleStreaming}
                className="mt-4 bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors
                          md:px-6 md:py-2 md:text-base
                          max-md:px-5 max-md:py-2 max-md:text-sm
                          max-sm:px-4 max-sm:py-1.5 max-sm:text-sm max-sm:mt-3"
              >
                开始直播
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 顶部信息栏 */}
      <div className={`absolute top-0 left-0 right-0 z-20 p-2 pt-8 sm:p-3 sm:pt-10 md:p-4 md:pt-12 transition-opacity duration-300 ${
        isImmersiveMode 
          ? (showUIInImmersive ? 'opacity-100' : 'opacity-0 pointer-events-none')
          : 'opacity-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 bg-black/30 backdrop-blur-sm rounded-full"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 sm:px-3 sm:py-1">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-white text-xs sm:text-sm font-medium">
                {isStreaming ? '直播中' : '未开播'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 sm:px-3 sm:py-1">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              <span className="text-white text-xs sm:text-sm font-medium">{viewerCount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex gap-1 sm:gap-1.5 md:gap-2">
            {/* 结束直播按钮 - 只在直播中显示 */}
            {isStreaming && (
              <button
                onClick={toggleStreaming}
                className="p-1.5 sm:p-2 bg-red-500/80 backdrop-blur-sm rounded-full hover:bg-red-600/80 transition-colors"
                title="结束直播"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            )}
            <button
              onClick={switchCamera}
              disabled={isSwitchingCamera}
              className="p-1.5 sm:p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/40 transition-colors disabled:opacity-50"
              title="切换摄像头"
            >
              {isSwitchingCamera ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FlipHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 sm:p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/40 transition-colors"
              data-settings-button
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <button 
              onClick={handleShareStream}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleShareStream();
                }
              }}
              disabled={isSharing}
              className={`group relative p-1.5 sm:p-2 backdrop-blur-sm rounded-full 
                        transition-all duration-300 ease-out
                        border shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black
                        ${isSharing 
                          ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-yellow-400/30 shadow-yellow-500/25 cursor-wait' 
                          : shareSuccess 
                          ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400/30 shadow-green-500/25' 
                          : shareError 
                          ? 'bg-gradient-to-br from-red-500/30 to-pink-500/30 border-red-400/30 shadow-red-500/25' 
                          : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-white/10 hover:border-white/20 shadow-blue-500/25 hover:from-blue-500/30 hover:to-purple-500/30 hover:scale-110 active:scale-95'
                        }
                        disabled:opacity-75`}
              title={isSharing ? '分享中...' : '分享直播'}
              aria-label={isSharing ? '正在分享直播，请稍候' : shareSuccess ? '分享成功' : shareError ? '分享失败' : '分享直播到社交平台'}
              aria-expanded={showSharePanel}
              aria-haspopup="menu"
              role="button"
              tabIndex={0}
              data-share-button
            >
              {isSharing ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : shareSuccess ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 text-green-200 animate-bounce">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              ) : shareError ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 text-red-200 animate-pulse">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
              ) : (
                <Share className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-blue-200 transition-colors duration-300" />
              )}
              
              {/* 悬停光效 */}
              {!isSharing && !shareSuccess && !shareError && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              )}
              
              {/* 成功光效 */}
              {shareSuccess && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/0 via-green-400/30 to-green-400/0 
                              animate-pulse"></div>
              )}
              
              {/* 错误光效 */}
              {shareError && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400/0 via-red-400/30 to-red-400/0 
                              animate-pulse"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 分享面板 */}
        {showSharePanel && !isImmersiveMode && (
          <div 
             className={`absolute top-14 right-1 sm:top-16 sm:right-2 md:top-20 md:right-4 bg-black/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 z-40 w-64 sm:w-72
                       max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:p-4
                       transform transition-transform duration-300 ease-out
                       max-sm:translate-y-0 max-sm:animate-slide-up
                       ${isDragging ? 'max-sm:transition-none' : ''}`}
             role="menu"
             data-share-panel
             aria-label="分享选项菜单"
             style={{
               transform: isDragging && window.innerWidth < 640 
                 ? `translateY(${Math.max(0, touchCurrentY - touchStartY)}px)` 
                 : undefined
             }}
             onKeyDown={(e) => {
               if (e.key === 'Escape') {
                 setShowSharePanel(false);
               }
             }}
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
           >
             {/* 移动端拖拽指示器 */}
             <div className="sm:hidden flex justify-center mb-2">
               <div className="w-12 h-1 bg-gray-500 rounded-full"></div>
             </div>
           <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-white/10 pb-2">
               <h4 id="share-panel-title" className="text-white font-medium text-sm">分享直播</h4>
               <button
                 onClick={() => setShowSharePanel(false)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     setShowSharePanel(false);
                   }
                 }}
                 className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black rounded"
                 aria-label="关闭分享面板"
                 tabIndex={0}
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
            
            {/* 分享选项 */}
             <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="share-panel-title">
               <button
                 onClick={() => { shareToWeChat(); setShowSharePanel(false); }}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     shareToWeChat();
                     setShowSharePanel(false);
                   }
                 }}
                 className="flex flex-col items-center p-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                 aria-label={`分享到微信，已分享${shareStats.wechat}次`}
                 role="menuitem"
                 tabIndex={0}
               >
                 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                   <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                     <path d="M8.5 12.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm9 0c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z"/>
                     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                   </svg>
                 </div>
                 <span className="text-white text-xs">微信</span>
                 <span className="text-gray-400 text-xs" aria-hidden="true">{shareStats.wechat}</span>
               </button>
               
               <button
                 onClick={() => { shareToQQ(); setShowSharePanel(false); }}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     shareToQQ();
                     setShowSharePanel(false);
                   }
                 }}
                 className="flex flex-col items-center p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
                 aria-label={`分享到QQ，已分享${shareStats.qq}次`}
                 role="menuitem"
                 tabIndex={0}
               >
                 <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                   <span className="text-white font-bold text-sm" aria-hidden="true">Q</span>
                 </div>
                 <span className="text-white text-xs">QQ</span>
                 <span className="text-gray-400 text-xs" aria-hidden="true">{shareStats.qq}</span>
               </button>
               
               <button
                 onClick={() => { shareToWeibo(); setShowSharePanel(false); }}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     shareToWeibo();
                     setShowSharePanel(false);
                   }
                 }}
                 className="flex flex-col items-center p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black"
                 aria-label={`分享到微博，已分享${shareStats.weibo}次`}
                 role="menuitem"
                 tabIndex={0}
               >
                 <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                   <span className="text-white font-bold text-sm" aria-hidden="true">微</span>
                 </div>
                 <span className="text-white text-xs">微博</span>
                 <span className="text-gray-400 text-xs" aria-hidden="true">{shareStats.weibo}</span>
               </button>
               
               <button
                 onClick={() => { copyLink(); setShowSharePanel(false); }}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     copyLink();
                     setShowSharePanel(false);
                   }
                 }}
                 className="flex flex-col items-center p-3 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-black"
                 aria-label={`复制直播链接，已复制${shareStats.link}次`}
                 role="menuitem"
                 tabIndex={0}
               >
                 <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                   <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                   </svg>
                 </div>
                 <span className="text-white text-xs">复制链接</span>
                 <span className="text-gray-400 text-xs" aria-hidden="true">{shareStats.link}</span>
               </button>
             </div>
            
            {/* 分享统计 */}
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">总分享次数</span>
                <span className="text-white font-medium">{shareStats.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 设置面板 */}
      {showSettings && !isImmersiveMode && !showSharePanel && (
        <div 
          className="absolute top-14 right-1 sm:top-16 sm:right-2 md:top-20 md:right-4 bg-black/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 z-30 max-h-[80vh] overflow-y-auto w-56 sm:w-64 md:w-80 text-xs sm:text-sm"
          data-settings-panel
        >
          <div className="space-y-4">
            {/* 基础控制 */}
            <div className="space-y-2">
              <h4 className="text-white font-medium text-sm border-b border-white/10 pb-2">基础控制</h4>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors ${
                  isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                }`}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                {isMuted ? '取消静音' : '静音'}
              </button>
              
              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors ${
                  !isVideoOn ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                }`}
              >
                {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
                {isVideoOn ? '关闭摄像头' : '开启摄像头'}
              </button>
              
              <button
                onClick={switchCamera}
                disabled={isSwitchingCamera}
                className="flex items-center gap-3 w-full p-2 rounded-lg transition-colors bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
              >
                {isSwitchingCamera ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FlipHorizontal size={16} />
                )}
                {isSwitchingCamera ? '切换中...' : `切换到${cameraFacing === 'front' ? '后置' : '前置'}摄像头`}
              </button>
            </div>
            
            {/* 流媒体设置 */}
            <div className="space-y-2">
              <h4 className="text-white font-medium text-sm border-b border-white/10 pb-2">流媒体设置</h4>
              
              {!isStreaming && (
                <>
                  <div className="space-y-2">
                    <label className="text-white text-sm">画质</label>
                    <select
                      value={streamQuality}
                      onChange={(e) => setStreamQuality(e.target.value as '720p' | '1080p' | '4K')}
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                    >
                      <option value="720p">720p (标准)</option>
                      <option value="1080p">1080p (高清)</option>
                      <option value="4K">4K (超高清)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white text-sm">码率: {bitrate} kbps</label>
                    <input
                      type="range"
                      min="1000"
                      max="8000"
                      step="500"
                      value={bitrate}
                      onChange={(e) => setBitrate(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white text-sm">帧率: {fps} FPS</label>
                    <select
                      value={fps}
                      onChange={(e) => setFps(Number(e.target.value))}
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                    >
                      <option value={24}>24 FPS</option>
                      <option value={30}>30 FPS</option>
                      <option value={60}>60 FPS</option>
                    </select>
                  </div>
                </>
              )}
              
              <button
                onClick={() => setShowStreamStats(!showStreamStats)}
                className="flex items-center gap-3 w-full p-2 rounded-lg transition-colors bg-white/10 text-white hover:bg-white/20"
              >
                <Settings size={16} />
                {showStreamStats ? '隐藏' : '显示'}流媒体统计
              </button>
            </div>
            
            {/* 弹幕设置 */}
            <div className="space-y-2">
              <h4 className="text-white font-medium text-sm border-b border-white/10 pb-2">弹幕设置</h4>
              
              <button
                onClick={() => setDanmakuEnabled(!danmakuEnabled)}
                className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors ${
                  danmakuEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white'
                }`}
              >
                <MessageCircle size={16} />
                {danmakuEnabled ? '关闭弹幕' : '开启弹幕'}
              </button>
              
              {danmakuEnabled && (
                <>
                  <div className="space-y-2">
                    <label className="text-white text-sm">弹幕速度: {danmakuSpeed}x</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={danmakuSpeed}
                      onChange={(e) => setDanmakuSpeed(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white text-sm">弹幕透明度: {Math.round(danmakuOpacity * 100)}%</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={danmakuOpacity}
                      onChange={(e) => setDanmakuOpacity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
            
            {/* 内容审核 */}
            <div className="space-y-2">
              <h4 className="text-white font-medium text-sm border-b border-white/10 pb-2">内容审核</h4>
              
              <button
                onClick={() => setModerationEnabled(!moderationEnabled)}
                className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors ${
                  moderationEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white'
                }`}
              >
                <Settings size={16} />
                {moderationEnabled ? '关闭审核' : '开启审核'}
              </button>
              
              {moderationEnabled && (
                <button
                  onClick={() => setAutoModeration(!autoModeration)}
                  className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors ${
                    autoModeration ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white'
                  }`}
                >
                  <Zap size={16} />
                  {autoModeration ? '关闭自动审核' : '开启自动审核'}
                </button>
              )}
            </div>
            
            {/* 开始直播按钮 */}
            {!isStreaming && (
              <button
                onClick={toggleStreaming}
                className="flex items-center justify-center gap-3 w-full p-3 rounded-lg transition-colors bg-green-500/20 text-green-400 hover:bg-green-500/30 font-medium"
              >
                <Zap size={16} />
                开始直播
              </button>
            )}
            
            {/* 语音播报设置 */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <button
                onClick={() => setEnableTTS(!enableTTS)}
                className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors ${
                  enableTTS ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white'
                }`}
              >
                <Volume2 size={16} />
                {enableTTS ? '关闭语音播报' : '开启语音播报'}
              </button>
              
              {enableTTS && (
                <>
                  <button
                    onClick={() => setAutoReadComments(!autoReadComments)}
                    className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors ${
                      autoReadComments ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white'
                    }`}
                  >
                    <MessageCircle size={16} />
                    {autoReadComments ? '关闭自动播报' : '开启自动播报'}
                  </button>
                  
                  <button
                    onClick={() => setShowVoicePanel(!showVoicePanel)}
                    className="flex items-center gap-3 w-full p-2 rounded-lg transition-colors bg-white/10 text-white hover:bg-white/20"
                  >
                    <Settings size={16} />
                    语音设置
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 流媒体统计面板 */}
      {showStreamStats && isStreaming && !isImmersiveMode && (
        <div className="absolute top-14 left-1 sm:top-16 sm:left-2 md:top-20 md:left-4 bg-black/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 md:p-4 z-30 w-44 sm:w-52 md:w-64 text-xs sm:text-sm">
          <div className="space-y-3">
            <h4 className="text-white font-medium text-sm border-b border-white/10 pb-2">流媒体统计</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">画质:</span>
                <span className="text-white">{streamQuality}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">码率:</span>
                <span className="text-white">{bitrate} kbps</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">帧率:</span>
                <span className="text-white">{fps} FPS</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">网络延迟:</span>
                <span className={`${networkLatency > 100 ? 'text-red-400' : networkLatency > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {networkLatency}ms
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">丢帧:</span>
                <span className={`${droppedFrames > 10 ? 'text-red-400' : droppedFrames > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {droppedFrames}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">流健康度:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStreamHealthBg(streamHealth)} ${getStreamHealthColor(streamHealth)}`}>
                  {streamHealth === 'excellent' ? '优秀' : 
                   streamHealth === 'good' ? '良好' : 
                   streamHealth === 'poor' ? '一般' : '较差'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">直播时长:</span>
                <span className="text-white">{formatDuration(streamDuration)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">总观看时长:</span>
                <span className="text-white">{Math.round(totalViewTime / 60)}分钟</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">峰值观众:</span>
                <span className="text-white">{peakViewers}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 独立礼物留言显示区域 */}
      <div className={`absolute left-1 sm:left-2 md:left-4 top-1/2 transform -translate-y-1/2 w-56 sm:w-64 md:w-80 max-h-80 sm:max-h-96 z-40 transition-opacity duration-300 ${
        isImmersiveMode 
          ? (showUIInImmersive ? 'opacity-100' : 'opacity-0 pointer-events-none')
          : 'opacity-100'
      }`}>
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2 overflow-y-auto max-h-full">
          <h4 className="text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
            <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
            礼物留言
          </h4>
          <div className="space-y-1.5 sm:space-y-2">
            {messages.filter(msg => msg.type === 'gift').slice(-5).map((msg) => (
              <div key={msg.id} className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg p-1.5 sm:p-2">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <img src={msg.user.avatar} alt={msg.user.username} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" />
                  <span className="text-white text-xs font-medium truncate">{msg.user.username}</span>
                  {msg.user.isVip && <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 flex-shrink-0" />}
                </div>
                {msg.giftInfo && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-sm sm:text-lg">{msg.giftInfo.icon}</span>
                    <span className="text-xs sm:text-sm text-white font-medium">
                      送出了 {msg.giftInfo.name} x{msg.giftInfo.count}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* 增强的直播互动组件 */}
      <div className={`transition-opacity duration-300 ${
        isImmersiveMode 
          ? (showUIInImmersive ? 'opacity-100' : 'opacity-0 pointer-events-none')
          : 'opacity-100'
      }`}>
        <LiveInteraction
          streamId="live-stream-1"
          isHost={true}
          viewerCount={viewerCount}
          onSendMessage={handleSendMessage}
          onSendGift={handleSendGift}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
          onRequestConnect={handleRequestConnect}
          onAcceptConnect={handleAcceptConnect}
          onRejectConnect={handleRejectConnect}
          danmakuEnabled={danmakuEnabled}
          danmakuSpeed={danmakuSpeed}
          danmakuOpacity={danmakuOpacity}
          moderationEnabled={moderationEnabled}
          blockedWords={blockedWords}
          autoModeration={autoModeration}
        />
      </div>





      {/* TTS语音面板 */}
      {enableTTS && showVoicePanel && !isImmersiveMode && (
        <div className="absolute top-20 left-4 w-80 z-20">
          <VoiceGenerator
            ref={voiceGeneratorRef}
            enabled={enableTTS}
            mode="all"
            autoPlay={autoReadComments}
            className="shadow-lg"
            onVoiceStart={(text) => console.log('开始播放:', text)}
            onVoiceEnd={(text) => console.log('播放结束:', text)}
            onError={(error) => console.error('语音错误:', error)}
          />
        </div>
      )}
      
      {/* TTS状态指示器 */}
      {enableTTS && (
        <div className={`absolute top-14 right-12 sm:top-16 sm:right-16 md:top-20 md:right-20 z-10 transition-opacity duration-300 scale-75 sm:scale-90 md:scale-100 ${
          isImmersiveMode 
            ? (showUIInImmersive ? 'opacity-100' : 'opacity-0 pointer-events-none')
            : 'opacity-100'
        }`}>
          <div className={`flex items-center gap-1.5 sm:gap-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 sm:px-3 sm:py-1 ${
            autoReadComments ? 'text-green-400' : 'text-blue-400'
          }`}>
            <Volume2 className="w-4 h-4 max-sm:w-3 max-sm:h-3" />
            <span className="text-sm font-medium max-sm:text-xs">
              {autoReadComments ? '语音播报中' : '语音已启用'}
            </span>
          </div>
        </div>
      )}

      {/* 飘心动画 */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-up"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <Heart className="w-6 h-6 text-red-500 fill-current opacity-70" />
          </div>
        ))}
      </div>
      
      {/* 沉浸式模式提示 */}
      {isImmersiveMode && (
        <div className={`absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm transition-opacity duration-300 z-30 ${
          showUIInImmersive ? 'opacity-100' : 'opacity-0'
        }`}>
          按 ESC 键或点击画面退出沉浸模式
        </div>
      )}
    </div>
  );
};

export default LiveStreaming;