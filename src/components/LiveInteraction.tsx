import React, { useState, useRef, useEffect } from 'react';
import { Send, Gift, Mic, MicOff, Video, VideoOff, Heart, Star, Zap, Crown, Diamond, Flame, Users, Settings, Volume2, VolumeX, MessageCircle, Share, Eye, ThumbsUp, Coffee, Cake, Car, Rocket, Languages, Play, Pause, FileText } from 'lucide-react';
import TranslationSettings, { TranslationConfig } from './TranslationSettings';
import TranslationDisplay from './TranslationDisplay';
import { translationService, TranslationResult } from '../utils/translationService';

// 扩展Window接口以支持danmakuTimeouts和gc
declare global {
  interface Window {
    danmakuTimeouts?: Set<NodeJS.Timeout>;
    gc?: () => void;
  }
}

interface DanmakuMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: number;
  color: string;
  speed: number;
  position: number;
}

interface TranslatedMessage {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  timestamp: number;
  type: 'danmaku' | 'voice';
  username?: string;
  avatar?: string;
}

interface GiftItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: number;
  animation: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LiveUser {
  id: string;
  username: string;
  avatar: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isConnected: boolean;
}

interface LiveInteractionProps {
  streamId: string;
  isHost: boolean;
  viewerCount: number;
  onSendMessage: (message: string) => void;
  onSendGift?: (gift: GiftItem, count: number) => void;
  onRequestConnect?: () => void;
  onAcceptConnect?: (userId: string) => void;
  onRejectConnect?: (userId: string) => void;
  micEnabled?: boolean;
  videoEnabled?: boolean;
  onToggleMic?: () => void;
  onToggleVideo?: () => void;
  danmakuEnabled?: boolean;
  danmakuSpeed?: number;
  danmakuOpacity?: number;
  moderationEnabled?: boolean;
  blockedWords?: string[];
  autoModeration?: boolean;
}

const LiveInteraction: React.FC<LiveInteractionProps> = ({
  streamId,
  isHost,
  viewerCount,
  onSendMessage,
  onSendGift,
  onToggleMic,
  onToggleVideo,
  onRequestConnect,
  onAcceptConnect,
  onRejectConnect,
  micEnabled = true,
  videoEnabled = true,
  danmakuEnabled = true,
  danmakuSpeed = 1,
  danmakuOpacity = 1,
  moderationEnabled = false,
  blockedWords = [],
  autoModeration = false
}) => {
  const danmakuRef = useRef<HTMLDivElement>(null);
  const desktopChatRef = useRef<HTMLDivElement>(null);
  const mobileChatRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showConnectPanel, setShowConnectPanel] = useState(false);
  const [danmakuMessages, setDanmakuMessages] = useState<DanmakuMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    username: string;
    avatar: string;
    content: string;
    timestamp: number;
    isVip: boolean;
    type?: string;
    duration?: number;
    audioBlob?: Blob;
    transcribedText?: string;
    realtimeTranscript?: string;
    isTranscribing?: boolean;
  }[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<LiveUser[]>([]);
  const [connectRequests, setConnectRequests] = useState<LiveUser[]>([]);
  const [giftEffects, setGiftEffects] = useState<any[]>([]);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [showDanmaku, setShowDanmaku] = useState(danmakuEnabled);
  const [danmakuSettings, setDanmakuSettings] = useState({
    opacity: danmakuOpacity,
    speed: danmakuSpeed,
    fontSize: 16,
    density: 0.7
  });
  
  // 更新弹幕设置当props改变时
  useEffect(() => {
    setShowDanmaku(danmakuEnabled);
    setDanmakuSettings(prev => ({
      ...prev,
      speed: danmakuSpeed,
      opacity: danmakuOpacity
    }));
  }, [danmakuEnabled, danmakuSpeed, danmakuOpacity]);
  
  // 翻译相关状态
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  
  // 设置面板状态
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [notificationSettings, setNotificationSettings] = useState({
    newMessage: true,
    gift: true,
    follow: true
  });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [translationConfig, setTranslationConfig] = useState<TranslationConfig>({
    enabled: false,
    danmakuTranslation: true,
    voiceTranslation: true,
    sourceLanguage: 'auto',
    targetLanguage: 'zh',
    showOriginal: true,
    autoDetect: true,
    translationSpeed: 'fast',
    displayMode: 'overlay'
  });
  const [translatedMessages, setTranslatedMessages] = useState<TranslatedMessage[]>([]);
  const [isTranslationVisible, setIsTranslationVisible] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // 语音录制相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCancellingVoice, setIsCancellingVoice] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0); // 音量级别 0-100
  const [recordingQuality, setRecordingQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [realtimeTranscript, setRealtimeTranscript] = useState(''); // 实时语音识别结果
  const [transcribedText, setTranscribedText] = useState(''); // 完整转录文本
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressProgressRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const voiceButtonRef = useRef<HTMLButtonElement | null>(null);
  const speechRecognitionRef = useRef<any>(null); // 语音识别实例
  const recognitionRef = useRef<any>(null); // 实时语音识别实例
  const audioStreamRef = useRef<MediaStream | null>(null); // 音频流引用
  const audioChunksRef = useRef<Blob[]>([]); // 音频数据块
  const isCancelledRef = useRef<boolean>(false); // 录音取消状态
  const startTouchY = useRef<number>(0);
  const currentTouchY = useRef<number>(0);
  const isPressedRef = useRef<boolean>(false); // 用于在异步回调中获取最新的按压状态

  // 获取字体大小对应的CSS类
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const gifts: GiftItem[] = [
    { id: '1', name: '点赞', icon: <Heart className="w-6 h-6" />, price: 1, animation: 'bounce', rarity: 'common' },
    { id: '2', name: '咖啡', icon: <Coffee className="w-6 h-6" />, price: 10, animation: 'float', rarity: 'common' },
    { id: '3', name: '蛋糕', icon: <Cake className="w-6 h-6" />, price: 50, animation: 'spin', rarity: 'rare' },
    { id: '4', name: '跑车', icon: <Car className="w-6 h-6" />, price: 500, animation: 'zoom', rarity: 'epic' },
    { id: '5', name: '火箭', icon: <Rocket className="w-6 h-6" />, price: 1000, animation: 'explode', rarity: 'legendary' },
    { id: '6', name: '皇冠', icon: <Crown className="w-6 h-6" />, price: 2000, animation: 'glow', rarity: 'legendary' },
    { id: '7', name: '钻石', icon: <Diamond className="w-6 h-6" />, price: 5000, animation: 'sparkle', rarity: 'legendary' },
    { id: '8', name: '火焰', icon: <Flame className="w-6 h-6" />, price: 100, animation: 'flame', rarity: 'rare' }
  ];

  const mockChatMessages = [
    { id: '1', username: '用户123', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar&image_size=square', content: '主播好棒！', timestamp: Date.now() - 60000, isVip: false },
    { id: '2', username: 'VIP用户', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=vip%20user%20avatar&image_size=square', content: '送个火箭支持一下', timestamp: Date.now() - 45000, isVip: true },
    { id: '3', username: '粉丝小王', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=fan%20avatar&image_size=square', content: '什么时候开播？', timestamp: Date.now() - 30000, isVip: false },
    { id: '4', username: '土豪大佬', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=rich%20user%20avatar&image_size=square', content: '刷个皇冠！', timestamp: Date.now() - 15000, isVip: true }
  ];

  // 组件卸载时的资源清理
  useEffect(() => {
    return () => {
      console.log('LiveInteraction组件卸载，开始清理资源...');
      
      // 清理所有录音相关资源
      cleanupAllResources();
      
      // 清理实时语音识别
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (e) {
          console.error('停止语音识别失败:', e);
        }
        recognitionRef.current = null;
      }
      
      // 清理所有定时器
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (longPressProgressRef.current) {
        clearInterval(longPressProgressRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      // 清理弹幕定时器
      if (window.danmakuTimeouts) {
        window.danmakuTimeouts.forEach(timeoutId => {
          clearTimeout(timeoutId);
        });
        window.danmakuTimeouts.clear();
        delete window.danmakuTimeouts;
      }
      
      // 清理音频相关资源
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      // 清理音频数据和状态
      audioChunksRef.current = [];
      
      // 强制垃圾回收提示（仅在开发环境）
      if (process.env.NODE_ENV === 'development' && window.gc) {
        try {
          window.gc();
          console.log('手动触发垃圾回收');
        } catch (e) {
          console.log('无法手动触发垃圾回收');
        }
      }
      
      console.log('LiveInteraction组件资源清理完成');
    };
  }, []);

  useEffect(() => {
    setChatMessages(mockChatMessages);
    
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
        const newChatMsg = {
          id: Date.now().toString(),
          username: `观众${Math.floor(Math.random() * 1000)}`,
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=random%20user%20avatar&image_size=square',
          content: messageText,
          timestamp: Date.now(),
          isVip: Math.random() > 0.8
        };
        
        // 限制聊天消息数量，避免内存泄漏
        setChatMessages(prev => {
          const newMessages = [...prev, newChatMsg];
          // 保持最多50条消息，超出则删除最旧的
          return newMessages.length > 50 ? newMessages.slice(-50) : newMessages;
        });
      }
      
      // 模拟弹幕消息
      if (showDanmaku && Math.random() > 0.7) {
        addDanmakuMessage({
          id: Date.now().toString(),
          userId: 'user' + Math.floor(Math.random() * 1000),
          username: '观众' + Math.floor(Math.random() * 1000),
          avatar: '',
          content: ['太棒了！', '666', '主播加油', '好看', '点赞'][Math.floor(Math.random() * 5)],
          timestamp: Date.now(),
          color: ['#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'][Math.floor(Math.random() * 5)],
          speed: 1 + Math.random(),
          position: Math.random() * 80 + 10
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showDanmaku, moderationEnabled, autoModeration, blockedWords]);

  // 当消息列表更新时自动滚动到底部
  useEffect(() => {
    const scrollToBottom = () => {
      if (desktopChatRef.current) {
        desktopChatRef.current.scrollTop = desktopChatRef.current.scrollHeight;
      }
      if (mobileChatRef.current) {
        mobileChatRef.current.scrollTop = mobileChatRef.current.scrollHeight;
      }
    };
    
    // 延迟执行以确保DOM已更新
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [chatMessages]);

  const addDanmakuMessage = (message: DanmakuMessage) => {
    setDanmakuMessages(prev => {
      const newMessages = [...prev, message];
      // 限制弹幕数量，最多保持20条活跃弹幕
      return newMessages.length > 20 ? newMessages.slice(-20) : newMessages;
    });
    
    // 5秒后移除弹幕
    const timeoutId = setTimeout(() => {
      setDanmakuMessages(prev => prev.filter(m => m.id !== message.id));
    }, 5000);
    
    // 存储定时器ID以便清理
    if (!window.danmakuTimeouts) {
      window.danmakuTimeouts = new Set();
    }
    window.danmakuTimeouts.add(timeoutId);
    
    // 定时器执行后自动清理
    setTimeout(() => {
      if (window.danmakuTimeouts) {
        window.danmakuTimeouts.delete(timeoutId);
      }
    }, 5000);
  };

  // 内容审核函数
  const moderateContent = (content: string): { isBlocked: boolean; reason?: string } => {
    if (!moderationEnabled) return { isBlocked: false };
    
    // 检查屏蔽词
    const lowerContent = content.toLowerCase();
    for (const word of blockedWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        return { isBlocked: true, reason: `包含屏蔽词: ${word}` };
      }
    }
    
    // 自动审核 - 简单的规则检查
    if (autoModeration) {
      // 检查重复字符
      if (/(.)\1{3,}/.test(content)) {
        return { isBlocked: true, reason: '包含过多重复字符' };
      }
      
      // 检查全大写
      if (content.length > 10 && content === content.toUpperCase()) {
        return { isBlocked: true, reason: '全大写内容' };
      }
      
      // 检查过多特殊字符
      const specialCharCount = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
      if (specialCharCount > content.length * 0.3) {
        return { isBlocked: true, reason: '包含过多特殊字符' };
      }
    }
    
    return { isBlocked: false };
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    // 内容审核
    const moderationResult = moderateContent(message);
    if (moderationResult.isBlocked) {
      alert(`消息被拦截: ${moderationResult.reason}`);
      return;
    }
    
    const newMessage = {
      id: Date.now().toString(),
      username: '我',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=my%20avatar&image_size=square',
      content: message,
      timestamp: Date.now(),
      isVip: false
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    onSendMessage(message);
    
    // 添加到弹幕
    if (showDanmaku) {
      addDanmakuMessage({
        id: newMessage.id,
        userId: 'current',
        username: '我',
        avatar: newMessage.avatar,
        content: message,
        timestamp: Date.now(),
        color: '#4ecdc4',
        speed: danmakuSettings.speed,
        position: Math.random() * 80 + 10
      });
    }
    
    // 翻译消息
    if (translationConfig.enabled && translationConfig.danmakuTranslation) {
      await translateMessage(message, 'danmaku', '我', newMessage.avatar);
    }
    
    setMessage('');
    
    // 自动滚动到最新消息
    setTimeout(() => {
      if (desktopChatRef.current) {
        desktopChatRef.current.scrollTop = desktopChatRef.current.scrollHeight;
      }
      if (mobileChatRef.current) {
        mobileChatRef.current.scrollTop = mobileChatRef.current.scrollHeight;
      }
    }, 100);
  };

  const sendGift = (gift: GiftItem, count: number = 1) => {
    onSendGift?.(gift, count);
    
    // 添加礼物特效
    const effect = {
      id: Date.now().toString(),
      gift,
      count,
      timestamp: Date.now()
    };
    
    setGiftEffects(prev => [...prev, effect]);
    
    // 3秒后移除特效
    setTimeout(() => {
      setGiftEffects(prev => prev.filter(e => e.id !== effect.id));
    }, 3000);
    
    setShowGiftPanel(false);
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    onToggleMic();
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    onToggleVideo();
  };

  // 处理设置按钮点击
  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 格式化录音时间
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 增强的麦克风权限检查
  const checkMicrophonePermission = async () => {
    try {
      console.log('开始检查麦克风权限...');
      
      // 1. 检查HTTPS环境
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.error('录音功能需要HTTPS环境');
        return {
          granted: false,
          reason: '🔒 安全限制：录音功能需要在HTTPS环境下使用\n\n解决方案：\n• 使用HTTPS访问网站\n• 在localhost环境下测试\n• 联系网站管理员启用HTTPS',
          code: 'HTTPS_REQUIRED'
        };
      }
      
      // 2. 检查浏览器兼容性
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('浏览器不支持录音功能');
        return {
          granted: false,
          reason: '🌐 浏览器不兼容：当前浏览器不支持录音功能\n\n推荐浏览器：\n• Chrome 47+\n• Firefox 36+\n• Safari 11+\n• Edge 79+',
          code: 'BROWSER_NOT_SUPPORTED'
        };
      }
      
      // 3. 检查是否有可用的音频输入设备
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        console.log('检测到音频输入设备:', audioInputs.length);
        
        if (audioInputs.length === 0) {
          return {
            granted: false,
            reason: '🎤 未检测到麦克风设备\n\n请检查：\n• 麦克风是否正确连接\n• 设备驱动是否正常\n• 其他应用是否占用麦克风',
            code: 'NO_AUDIO_DEVICE'
          };
        }
      } catch (deviceError) {
        console.warn('无法枚举设备:', deviceError);
      }
      
      // 4. 检查权限状态
      let permissionState = 'prompt';
      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        permissionState = micPermission.state;
        console.log('麦克风权限状态:', permissionState);
        
        if (permissionState === 'denied') {
          return {
            granted: false,
            reason: '❌ 麦克风权限被拒绝\n\n恢复步骤：\n1. 点击地址栏左侧的锁形图标\n2. 将麦克风权限设为"允许"\n3. 刷新页面重试\n\n或在浏览器设置中管理网站权限',
            code: 'PERMISSION_DENIED'
          };
        }
      } catch (permissionError) {
        console.warn('无法查询权限状态:', permissionError);
      }
      
      // 5. 实际测试麦克风访问
      try {
        console.log('测试麦克风访问...');
        const testStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: { ideal: 16000 },
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        
        // 检查音频轨道状态
        const audioTracks = testStream.getAudioTracks();
        if (audioTracks.length === 0) {
          testStream.getTracks().forEach(track => track.stop());
          return {
            granted: false,
            reason: '🎤 无法获取音频轨道\n\n可能原因：\n• 麦克风被其他应用占用\n• 设备驱动异常\n• 系统音频服务未启动',
            code: 'NO_AUDIO_TRACK'
          };
        }
        
        const track = audioTracks[0];
        console.log('音频轨道信息:', {
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings()
        });
        
        // 检查轨道是否可用
        if (track.readyState !== 'live') {
          testStream.getTracks().forEach(track => track.stop());
          return {
            granted: false,
            reason: '🎤 麦克风设备状态异常\n\n请尝试：\n• 重新连接麦克风\n• 重启浏览器\n• 检查系统音频设置',
            code: 'DEVICE_NOT_LIVE'
          };
        }
        
        // 清理测试流
        testStream.getTracks().forEach(track => track.stop());
        
        console.log('麦克风权限检查通过');
        return {
          granted: true,
          reason: null,
          code: 'SUCCESS',
          deviceInfo: {
            label: track.label,
            settings: track.getSettings()
          }
        };
        
      } catch (accessError) {
        console.error('麦克风访问测试失败:', accessError);
        
        // 根据错误类型提供具体指导
        let errorMessage = '🎤 无法访问麦克风';
        let errorCode = 'ACCESS_FAILED';
        
        if (accessError instanceof DOMException) {
          switch (accessError.name) {
            case 'NotAllowedError':
              errorMessage = '❌ 麦克风权限被拒绝\n\n请按以下步骤操作：\n1. 点击地址栏的麦克风图标\n2. 选择"始终允许"\n3. 刷新页面重试';
              errorCode = 'PERMISSION_DENIED';
              break;
            case 'NotFoundError':
              errorMessage = '🎤 未找到麦克风设备\n\n请检查：\n• 麦克风是否正确连接\n• 设备管理器中是否识别\n• 尝试重新插拔设备';
              errorCode = 'DEVICE_NOT_FOUND';
              break;
            case 'NotReadableError':
              errorMessage = '🔒 麦克风被其他应用占用\n\n请关闭以下应用后重试：\n• QQ、微信、钉钉等通讯软件\n• 其他录音或视频通话应用\n• 音频编辑软件';
              errorCode = 'DEVICE_BUSY';
              break;
            case 'OverconstrainedError':
              errorMessage = '⚙️ 麦克风配置不兼容\n\n设备不支持当前录音质量设置\n正在尝试使用兼容配置...';
              errorCode = 'CONSTRAINTS_ERROR';
              break;
            case 'SecurityError':
              errorMessage = '🔒 安全限制\n\n录音功能需要在安全环境下使用\n请确保使用HTTPS访问';
              errorCode = 'SECURITY_ERROR';
              break;
            default:
              errorMessage = `🎤 麦克风访问失败: ${accessError.message}\n\n请尝试：\n• 刷新页面重试\n• 检查麦克风权限设置\n• 重启浏览器`;
              errorCode = 'UNKNOWN_ERROR';
          }
        }
        
        return {
          granted: false,
          reason: errorMessage,
          code: errorCode,
          originalError: accessError
        };
      }
      
    } catch (error) {
      console.error('权限检查过程中发生错误:', error);
      return {
        granted: false,
        reason: '🔧 权限检查失败\n\n发生未知错误，请尝试：\n• 刷新页面\n• 重启浏览器\n• 检查网络连接',
        code: 'CHECK_FAILED',
        originalError: error
      };
    }
  };

  // 开始录音
  const startRecording = async () => {
    console.log('startRecording被调用，当前录音状态:', isRecording);
    if (isRecording) {
      console.log('已在录音中，跳过');
      return;
    }
    
    console.log('开始初始化录音...');
    
    // 停止之前可能还在运行的语音识别，确保状态完全清理
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
        console.log('已停止之前的语音识别');
      } catch (error) {
        console.log('停止语音识别时出错:', error);
      }
    }
    
    // 清空上次的转录结果，为新录音做准备
    setRealtimeTranscript('');
    setTranscribedText('');
    console.log('已清理转录状态，准备新录音');
    
    // 输出调试信息
    console.log('浏览器信息:', {
      userAgent: navigator.userAgent,
      protocol: location.protocol,
      hostname: location.hostname,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      supportedMimeTypes: [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ].filter(type => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type))
    });
    
    // 检查麦克风权限
    const permission = await checkMicrophonePermission();
    if (!permission.granted) {
      console.error('麦克风权限检查失败:', permission);
      
      // 显示详细的错误信息和解决方案
      const errorTitle = permission.code === 'PERMISSION_DENIED' ? '麦克风权限被拒绝' :
                         permission.code === 'DEVICE_NOT_FOUND' ? '未找到麦克风设备' :
                         permission.code === 'DEVICE_BUSY' ? '麦克风被占用' :
                         permission.code === 'HTTPS_REQUIRED' ? '需要HTTPS环境' :
                         permission.code === 'BROWSER_NOT_SUPPORTED' ? '浏览器不支持' :
                         '录音功能不可用';
      
      // 使用更友好的提示方式
      if (window.confirm(`${errorTitle}\n\n${permission.reason}\n\n点击"确定"查看详细帮助，点击"取消"关闭提示`)) {
        // 可以在这里打开帮助页面或显示更详细的指导
        console.log('用户选择查看帮助');
      }
      
      // 重置录音相关状态
      handleRecordingError(new Error(permission.reason || '麦克风权限检查失败'));
      return;
    }
    
    // 记录成功的权限检查信息
    if (permission.deviceInfo) {
      console.log('麦克风设备信息:', permission.deviceInfo);
    }
    
    try {
      // 优化的音频配置
      const audioConstraints = {
        audio: {
          sampleRate: { ideal: 48000, min: 16000 }, // 理想48kHz，最低16kHz
          channelCount: 1, // 单声道节省带宽
          echoCancellation: { ideal: true }, // 回声消除
          noiseSuppression: { ideal: true }, // 噪音抑制
          autoGainControl: { ideal: true }, // 自动增益控制
          sampleSize: 16, // 16位采样
          latency: { ideal: 0.05, max: 0.2 }, // 低延迟优化
          volume: { ideal: 1.0 }, // 音量控制
          googEchoCancellation: { ideal: true }, // Google回声消除
          googNoiseSuppression: { ideal: true }, // Google噪音抑制
          googAutoGainControl: { ideal: true }, // Google自动增益
          googHighpassFilter: { ideal: true }, // 高通滤波器
          googTypingNoiseDetection: { ideal: true } // 键盘噪音检测
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      
      // 创建音频上下文用于音量监测
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // 开始监测音量
      const monitorAudioLevel = () => {
        if (!analyserRef.current || !isRecording) return;
        
        const dataArray = new Uint8Array(analyser.bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        // 计算平均音量
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        
        setAudioLevel(normalizedLevel);
        
        if (isRecording) {
          requestAnimationFrame(monitorAudioLevel);
        }
      };
      
      // 开始音量监测
      requestAnimationFrame(monitorAudioLevel);
      
      // 设置录音质量标识
      setRecordingQuality('high');
      
      // 检查浏览器支持的音频格式
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
          }
        }
      }
      
      // 动态选择最佳比特率
      let audioBitsPerSecond = 128000; // 默认128kbps
      
      // 根据音频格式调整比特率
      if (mimeType.includes('opus')) {
        audioBitsPerSecond = 64000; // Opus编码效率更高，可用较低比特率
      } else if (mimeType.includes('mp4')) {
        audioBitsPerSecond = 96000; // AAC编码
      } else if (mimeType.includes('wav')) {
        audioBitsPerSecond = 256000; // WAV需要更高比特率
      }
      
      // 创建MediaRecorder with优化配置
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond
      });
      
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // 优化的音频处理
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        
        // 清理音频流
        stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        
        // 如果不是取消状态，处理并发送语音消息
        if (!isCancellingVoice && audioBlob.size > 0) {
          // 延迟发送，确保语音识别有时间处理最后的结果
          setTimeout(async () => {
            try {
              // 压缩音频文件（如果需要）
              const optimizedBlob = await optimizeAudioBlob(audioBlob);
              sendVoiceMessage(optimizedBlob);
            } catch (error) {
              console.error('音频优化失败，使用原始文件:', error);
              sendVoiceMessage(audioBlob);
            }
          }, 200);
        }
        
        // 清理内存
        audioChunks.length = 0;
        setIsCancellingVoice(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      console.log('MediaRecorder已启动');
      
      setIsRecording(true);
      
      // 延迟启动实时语音识别，确保与录音同步
      setTimeout(() => {
        // 使用mediaRecorderRef来检查录音状态，避免闭包问题
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          startRealtimeSpeechRecognition();
          console.log('语音识别已延迟启动，与录音同步');
        }
      }, 200);
      setRecordingTime(0);
      
      // 清除长按相关状态和定时器
      setIsLongPressing(false);
      setLongPressProgress(100); // 设置为100%表示完成
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      if (longPressProgressRef.current) {
        clearInterval(longPressProgressRef.current);
        longPressProgressRef.current = null;
      }
      
      // 录音状态已更新

      // 开始计时
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // 最大录音时长60秒
          if (newTime >= 60) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('录音启动失败:', error);
      
      // 详细的错误处理
      let errorMessage = '录音失败';
      let shouldTryFallback = false;
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = '麦克风权限被拒绝。请点击地址栏的麦克风图标，选择"始终允许"，然后刷新页面重试';
            break;
          case 'NotFoundError':
            errorMessage = '未找到麦克风设备。请检查：\n1. 麦克风是否正确连接\n2. 其他应用是否正在使用麦克风\n3. 系统音频设置是否正确';
            break;
          case 'NotReadableError':
            errorMessage = '麦克风设备被其他应用占用。请关闭其他使用麦克风的应用（如QQ、微信、钉钉等）后重试';
            break;
          case 'OverconstrainedError':
            errorMessage = '麦克风不支持当前配置，正在尝试降级配置...';
            shouldTryFallback = true;
            break;
          case 'SecurityError':
            errorMessage = '安全限制：录音功能需要在HTTPS环境下使用。请使用HTTPS访问或在localhost下测试';
            break;
          case 'AbortError':
            errorMessage = '录音操作被中断';
            break;
          default:
            errorMessage = `录音失败: ${error.message}\n\n可能的解决方案：\n1. 刷新页面重试\n2. 检查麦克风权限设置\n3. 尝试使用其他浏览器`;
        }
      } else {
        errorMessage = `录音失败: ${error}\n\n请尝试：\n1. 刷新页面\n2. 检查麦克风设备\n3. 确保在HTTPS环境下使用`;
      }
      
      // 如果需要尝试降级配置
      if (shouldTryFallback) {
        console.log('尝试使用降级配置重新录音');
        setTimeout(() => {
          startRecordingWithFallback();
        }, 1000);
        return;
      }
      
      // 显示错误提示给用户
      alert(errorMessage);
      
      // 重置录音状态
      handleRecordingError(error, errorMessage);
    }
  };

  // 智能音频优化函数
  const optimizeAudioBlob = async (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        console.log(`原始音频大小: ${(audioBlob.size / 1024).toFixed(2)}KB`);
        
        // 设置目标大小阈值
        const targetSize = 150 * 1024; // 150KB目标大小
        const maxSize = 500 * 1024; // 500KB最大大小
        
        // 如果文件已经很小，直接返回
        if (audioBlob.size < targetSize) {
          console.log('音频文件已经足够小，无需优化');
          resolve(audioBlob);
          return;
        }
        
        // 如果文件过大，需要压缩
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const fileReader = new FileReader();
        
        fileReader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            console.log(`原始音频信息: ${audioBuffer.sampleRate}Hz, ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels}声道`);
            
            // 智能选择目标采样率
            let targetSampleRate = audioBuffer.sampleRate;
            const compressionRatio = audioBlob.size / targetSize;
            
            if (compressionRatio > 4) {
              targetSampleRate = 16000; // 大幅压缩
            } else if (compressionRatio > 2) {
              targetSampleRate = 22050; // 中等压缩
            } else {
              targetSampleRate = 32000; // 轻度压缩
            }
            
            // 确保不超过原始采样率
            targetSampleRate = Math.min(targetSampleRate, audioBuffer.sampleRate);
            
            const ratio = audioBuffer.sampleRate / targetSampleRate;
            
            if (ratio > 1.1) { // 只有在显著降采样时才处理
              const newLength = Math.floor(audioBuffer.length / ratio);
              const newBuffer = audioContext.createBuffer(
                1, // 强制单声道
                newLength,
                targetSampleRate
              );
              
              // 使用更好的重采样算法（线性插值）
              const oldData = audioBuffer.getChannelData(0);
              const newData = newBuffer.getChannelData(0);
              
              for (let i = 0; i < newLength; i++) {
                const sourceIndex = i * ratio;
                const index1 = Math.floor(sourceIndex);
                const index2 = Math.min(index1 + 1, oldData.length - 1);
                const fraction = sourceIndex - index1;
                
                // 线性插值
                newData[i] = oldData[index1] * (1 - fraction) + oldData[index2] * fraction;
              }
              
              // 应用简单的音频增强
              applyAudioEnhancement(newData);
              
              // 转换回Blob
              const optimizedBlob = audioBufferToWav(newBuffer);
              console.log(`优化后音频大小: ${(optimizedBlob.size / 1024).toFixed(2)}KB, 采样率: ${targetSampleRate}Hz`);
              
              // 检查是否达到目标大小
              if (optimizedBlob.size > maxSize) {
                console.warn('音频文件仍然过大，可能需要进一步优化');
              }
              
              resolve(optimizedBlob);
            } else {
              console.log('无需降采样，返回原始音频');
              resolve(audioBlob);
            }
          } catch (error) {
            console.error('音频解码失败:', error);
            // 音频解码失败，使用原始音频
            resolve(audioBlob);
          }
        };
        
        fileReader.onerror = () => {
          console.error('文件读取失败');
          reject(new Error('文件读取失败'));
        };
        
        fileReader.readAsArrayBuffer(audioBlob);
      } catch (error) {
        console.error('音频优化失败:', error);
        reject(error);
      }
    });
  };
  
  // 音频增强处理
  const applyAudioEnhancement = (audioData: Float32Array) => {
    // 应用简单的音量标准化
    let maxAmplitude = 0;
    for (let i = 0; i < audioData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
    }
    
    if (maxAmplitude > 0 && maxAmplitude < 0.8) {
      // 如果音量过小，进行适度放大
      const amplificationFactor = Math.min(0.8 / maxAmplitude, 2.0);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] *= amplificationFactor;
      }
    }
    
    // 应用简单的软限制器防止削波
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) > 0.95) {
        audioData[i] = Math.sign(audioData[i]) * (0.95 + 0.05 * Math.tanh((Math.abs(audioData[i]) - 0.95) * 10));
      }
    }
  };
  
  // 将AudioBuffer转换为WAV格式的Blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV文件头
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // 写入音频数据
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // 降级录音配置（当高质量配置失败时使用）
  const startRecordingWithFallback = async () => {
    if (isRecording) return;
    
    // 清空上次的转录结果，为新录音做准备
    setRealtimeTranscript('');
    setTranscribedText('');
    
    // 检查麦克风权限
    const permission = await checkMicrophonePermission();
    if (!permission.granted) {
      console.error('麦克风权限检查失败:', permission);
      
      // 显示详细的错误信息和解决方案
      const errorTitle = permission.code === 'PERMISSION_DENIED' ? '麦克风权限被拒绝' :
                         permission.code === 'DEVICE_NOT_FOUND' ? '未找到麦克风设备' :
                         permission.code === 'DEVICE_BUSY' ? '麦克风被占用' :
                         permission.code === 'HTTPS_REQUIRED' ? '需要HTTPS环境' :
                         permission.code === 'BROWSER_NOT_SUPPORTED' ? '浏览器不支持' :
                         '录音功能不可用';
      
      // 使用更友好的提示方式
      if (window.confirm(`${errorTitle}\n\n${permission.reason}\n\n点击"确定"查看详细帮助，点击"取消"关闭提示`)) {
        // 可以在这里打开帮助页面或显示更详细的指导
        console.log('用户选择查看帮助');
      }
      
      // 重置录音相关状态
      handleRecordingError(new Error(permission.reason || '麦克风权限检查失败'));
      return;
    }
    
    // 记录成功的权限检查信息
    if (permission.deviceInfo) {
      console.log('麦克风设备信息:', permission.deviceInfo);
    }
    
    try {
      // 基础音频配置
      const basicAudioConstraints = {
        audio: {
          sampleRate: 44100, // 降级到44.1kHz
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(basicAudioConstraints);
      
      // 使用最基础的音频格式
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/wav'
      });
      
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
         if (event.data.size > 0) {
           audioChunks.push(event.data);
         }
       };
 
       mediaRecorder.onstop = async () => {
         const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
         
         // 清理音频流
         stream.getTracks().forEach(track => {
           track.stop();
           track.enabled = false;
         });
         
         if (!isCancellingVoice && audioBlob.size > 0) {
           // 延迟发送，确保语音识别有时间处理最后的结果
           setTimeout(async () => {
             try {
               // 基础压缩（降级模式）
               const optimizedBlob = audioBlob.size > 200 * 1024 ? 
                 await optimizeAudioBlob(audioBlob) : audioBlob;
               sendVoiceMessage(optimizedBlob);
             } catch (error) {
               // 降级音频优化失败，使用原始音频
               sendVoiceMessage(audioBlob);
             }
           }, 200);
         }
         
         // 清理内存
         audioChunks.length = 0;
         setIsCancellingVoice(false);
       };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // 启动实时语音识别
      startRealtimeSpeechRecognition();

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 60) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error('降级录音配置也失败:', error);
      
      let errorMessage = '录音功能完全不可用';
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = '麦克风权限被拒绝。请按以下步骤操作：\n1. 点击地址栏左侧的锁形图标\n2. 将麦克风设置为"允许"\n3. 刷新页面重试';
            break;
          case 'NotFoundError':
            errorMessage = '系统未检测到麦克风设备。请检查：\n1. 麦克风是否正确连接\n2. 系统声音设置中是否启用了麦克风\n3. 重启浏览器后重试';
            break;
          case 'NotReadableError':
            errorMessage = '麦克风被其他程序占用。请：\n1. 关闭所有使用麦克风的应用\n2. 重启浏览器\n3. 重新尝试录音';
            break;
          default:
            errorMessage = `录音功能不可用: ${error.message}\n\n建议：\n1. 使用Chrome或Firefox浏览器\n2. 确保在HTTPS环境下访问\n3. 检查系统麦克风权限设置`;
        }
      } else {
        errorMessage = `录音功能不可用: ${error}\n\n请尝试：\n1. 刷新页面\n2. 重启浏览器\n3. 检查系统音频设置\n4. 使用其他设备测试`;
      }
      
      alert(errorMessage);
      
      // 重置状态
      setIsRecording(false);
      setIsLongPressing(false);
      setLongPressProgress(0);
    }
  };

  // 停止录音
  const stopRecording = () => {
    console.log('停止录音开始');
    
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        console.log('录音器已停止');
      } catch (error) {
        console.error('停止录音器失败:', error);
        handleRecordingError(error);
        return;
      }
      
      // 停止实时语音识别
      try {
        stopRealtimeSpeechRecognition();
        console.log('语音识别已停止');
      } catch (error) {
        console.error('停止语音识别失败:', error);
      }
      
      // 更新基本状态（保留transcript用于发送消息）
      setIsRecording(false);
      setIsLongPressing(false);
      setIsCancellingVoice(false);
      
      // 清理定时器
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // 清理音频上下文
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.error('关闭音频上下文失败:', error);
        }
      }
      audioContextRef.current = null;
      analyserRef.current = null;
      setAudioLevel(0);
      
      console.log('停止录音完成');
    }
  };
  
  // 取消录音
  const cancelRecording = () => {
    console.log('取消录音开始');
    
    if (mediaRecorderRef.current && isRecording) {
      // 设置取消状态
      setIsCancellingVoice(true);
      isCancelledRef.current = true;
      
      // 停止录音器
      try {
        mediaRecorderRef.current.stop();
        console.log('录音器已停止（取消）');
      } catch (error) {
        console.error('停止录音器失败（取消）:', error);
      }
      
      // 停止实时语音识别并清空结果
      try {
        stopRealtimeSpeechRecognition();
        console.log('语音识别已停止（取消）');
      } catch (error) {
        console.error('停止语音识别失败（取消）:', error);
      }
      
      // 清空语音识别结果
      setRealtimeTranscript('');
      setTranscribedText('');
      
      // 重置所有状态
      resetRecordingState();
      
      // 清理所有资源
      cleanupAllResources();
      
      console.log('取消录音完成');
    }
  };
  
  // 处理按下开始
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    // 只在非passive事件中调用preventDefault
    if (e.cancelable) {
      e.preventDefault();
    }
    // 按下开始录音
    
    if ('touches' in e && e.touches.length > 0) {
      startTouchY.current = e.touches[0].clientY;
      currentTouchY.current = e.touches[0].clientY;
    }
    
    setIsPressed(true);
    isPressedRef.current = true;
    
    // 显示录音提示
    setIsLongPressing(true);
    
    // 清除之前的定时器（防止重复触发）
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressProgressRef.current) {
      clearInterval(longPressProgressRef.current);
      longPressProgressRef.current = null;
    }
    
    // 设置200豪秒延迟开始录音
    longPressTimerRef.current = setTimeout(() => {
      if (isPressedRef.current) {
        startRecording();
      }
    }, 200)
  };
  
  // 处理移动
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isRecording) return;
    
    let currentY: number;
    if ('touches' in e && e.touches.length > 0) {
      currentY = e.touches[0].clientY;
      currentTouchY.current = currentY;
    } else {
      currentY = (e as React.MouseEvent).clientY;
    }
    
    const deltaY = startTouchY.current - currentY;
    
    // 向上滑动超过50px时显示取消状态
    if (deltaY > 50) {
      setIsCancellingVoice(true);
    } else {
      setIsCancellingVoice(false);
    }
  };
  
  // 处理松开结束
  const handlePressEnd = () => {
    // 松开按钮
    setIsPressed(false);
    isPressedRef.current = false;
    
    // 清除长按定时器（如果在延迟时间内松开）
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      // 延迟时间内松开，取消录音启动
      setIsLongPressing(false);
      resetRecordingState();
      return;
    }
    
    // 如果正在录音，处理录音结束逻辑
    if (isRecording) {
      const deltaY = startTouchY.current - currentTouchY.current;
      
      // 如果向上滑动超过50px，取消录音
      if (deltaY > 50 || isCancellingVoice) {
        console.log('取消录音 - 上滑距离:', deltaY);
        cancelRecording();
      } else {
        // 否则停止录音并发送
        console.log('完成录音 - 准备发送');
        stopRecording();
      }
    }
    
    // 重置触摸状态
    resetTouchState();
  };
  
  // 重置录音相关状态
  const resetRecordingState = () => {
    setIsRecording(false);
    setIsLongPressing(false);
    setIsCancellingVoice(false);
    setLongPressProgress(0);
    setRecordingTime(0);
    setAudioLevel(0);
    setIsPressed(false);
    isPressedRef.current = false;
  };
  
  // 统一的错误处理函数
  const handleRecordingError = (error: any, customMessage?: string) => {
    console.error('录音错误:', error);
    
    // 重置所有状态
    resetRecordingState();
    
    // 清理所有资源
    cleanupAllResources();
    
    // 显示错误信息
    if (customMessage) {
      alert(customMessage);
    }
  };
  
  // 清理所有录音相关资源
  const cleanupAllResources = () => {
    console.log('开始清理所有录音相关资源...');
    
    // 清理定时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      console.log('长按定时器已清理');
    }
    
    if (longPressProgressRef.current) {
      clearInterval(longPressProgressRef.current);
      longPressProgressRef.current = null;
      console.log('长按进度定时器已清理');
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      console.log('录音计时器已清理');
    }
    
    // 清理媒体录音器
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        // 移除事件监听器
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.onerror = null;
        mediaRecorderRef.current.onstart = null;
        console.log('MediaRecorder已清理');
      } catch (e) {
        console.error('停止录音器失败:', e);
      }
      mediaRecorderRef.current = null;
    }
    
    // 清理音频流
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('音频轨道已停止:', track.label || 'Unknown');
      });
      audioStreamRef.current = null;
    }
    
    // 清理音频上下文
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        console.log('AudioContext已关闭');
      } catch (e) {
        console.error('关闭音频上下文失败:', e);
      }
      audioContextRef.current = null;
    }
    
    // 清理分析器
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
      console.log('音频分析器已清理');
    }
    
    // 清理实时语音识别
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
        // 移除事件监听器
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
        console.log('语音识别已清理');
      } catch (e) {
        console.error('清理语音识别失败:', e);
      }
      recognitionRef.current = null;
    }
    
    // 清理音频数据
    if (audioChunksRef.current.length > 0) {
      console.log(`清理音频数据块: ${audioChunksRef.current.length} 个`);
      audioChunksRef.current = [];
    }
    
    // 重置触摸状态
    resetTouchState();
    
    // 清理可能的内存引用
    if (voiceButtonRef.current) {
      // 移除可能的事件监听器
      const button = voiceButtonRef.current;
      button.onmousedown = null;
      button.onmouseup = null;
      button.onmousemove = null;
      button.onmouseleave = null;
      button.ontouchstart = null;
      button.ontouchend = null;
      button.ontouchmove = null;
    }
    
    console.log('所有录音相关资源清理完成');
  };
  
  // 重置触摸状态
  const resetTouchState = () => {
    startTouchY.current = 0;
    currentTouchY.current = 0;
  };

  // 内存监控功能（开发环境）
  const logMemoryUsage = () => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log('内存使用情况:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        usage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`
      });
    }
  };

  // 定期内存监控（开发环境）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const memoryInterval = setInterval(() => {
        logMemoryUsage();
      }, 30000); // 每30秒检查一次内存使用
      
      return () => clearInterval(memoryInterval);
    }
  }, []);

  // 发送语音消息
  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (audioBlob && audioBlob.size > 0) {
      // 确保最小录音时长显示为1秒
      const displayDuration = Math.max(recordingTime, 1);
      
      // 获取当前录音的转录文本快照，避免状态变化影响
      const currentTranscribedText = transcribedText.trim();
      const currentRealtimeTranscript = realtimeTranscript.trim();
      const finalTranscript = currentTranscribedText || currentRealtimeTranscript;
      const initialContent = finalTranscript || `[语音消息 ${formatRecordingTime(displayDuration)}]`;
      
      console.log('发送语音消息 - 当前转录状态快照:', {
        currentTranscribedText,
        currentRealtimeTranscript,
        finalTranscript,
        initialContent
      });
      
      // 创建语音消息
      const voiceMessage = {
        id: Date.now().toString(),
        username: '我',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=current%20user%20avatar&image_size=square',
        content: initialContent,
        timestamp: Date.now(),
        isVip: false,
        type: 'voice',
        duration: displayDuration,
        audioBlob: audioBlob,
        isTranscribing: false, // 实时转录已完成，不需要显示转换中状态
        transcribedText: finalTranscript, // 保存转录文本
        realtimeTranscript: finalTranscript // 保持一致，确保显示正确
      };
      
      console.log('🎤 创建语音消息对象详细调试:', {
        voiceMessage,
        finalTranscript,
        realtimeTranscript,
        transcribedTextState: transcribedText,
        realtimeTranscriptState: realtimeTranscript,
        hasTranscribedText: !!finalTranscript,
        hasRealtimeTranscript: !!realtimeTranscript.trim(),
        transcribedTextLength: finalTranscript.length,
        realtimeTranscriptLength: realtimeTranscript.trim().length
      });
      
      setChatMessages(prev => [...prev, voiceMessage]);
      
      // 如果实时转录没有获得结果，延迟自动触发转录
      // if (!finalTranscript) {
      //   setTimeout(() => {
      //     transcribeExistingVoiceMessage(voiceMessage.id, audioBlob);
      //   }, 500);
      // }
      
      // 立即清理录音状态和转录状态，防止下次录音时状态污染
      setRecordingTime(0);
      setRealtimeTranscript('');
      setTranscribedText(''); // 立即清理转录文本状态
      
      // 自动滚动到最新消息
      setTimeout(() => {
        if (desktopChatRef.current) {
          desktopChatRef.current.scrollTop = desktopChatRef.current.scrollHeight;
        }
        if (mobileChatRef.current) {
          mobileChatRef.current.scrollTop = mobileChatRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  // 启动实时语音识别
  const startRealtimeSpeechRecognition = () => {
    // 检查浏览器是否支持语音识别
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('浏览器不支持语音识别');
      return;
    }

    // 停止之前的语音识别实例
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
        console.log('停止之前的语音识别实例');
      } catch (error) {
        console.warn('停止语音识别时出错:', error);
      }
      speechRecognitionRef.current = null;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition; // 保存实例引用
      
      // 设置语音识别参数
      recognition.lang = 'zh-CN';
      recognition.continuous = true; // 连续识别
      recognition.interimResults = true; // 显示中间结果
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // 获取所有最终结果和当前的临时结果
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // 更新实时转录结果（包含所有最终结果和当前临时结果）
        const currentTranscript = finalTranscript + interimTranscript;
        console.log('语音识别结果:', currentTranscript);
        
        // 设置完整的转录文本
        setRealtimeTranscript(currentTranscript);
        
        // 如果有最终结果，设置到transcribedText状态（不累加，直接设置完整的最终结果）
        if (finalTranscript.trim()) {
          setTranscribedText(finalTranscript);
          console.log('语音识别onresult更新transcribedText:', finalTranscript);
        }
        
        // 如果没有最终结果但有临时结果，也要确保transcribedText包含之前的最终结果
        if (!finalTranscript.trim() && interimTranscript.trim()) {
          // 这里不更新transcribedText，只是确保realtimeTranscript包含完整内容
          console.log('只有临时结果，保持transcribedText不变');
        }
        // 更新实时语音识别结果
      };
      
      recognition.onerror = (event: any) => {
        console.error('实时语音识别错误:', {
          error: event.error,
          message: event.message,
          isRecording: isRecording,
          timestamp: new Date().toISOString()
        });
        
        // 根据不同错误类型提供不同的处理
        switch (event.error) {
          case 'no-speech':
            console.log('未检测到语音，继续监听...');
            setRealtimeTranscript('[正在监听语音...]');
            break;
          case 'audio-capture':
            console.error('音频捕获失败，可能是麦克风权限问题');
            setRealtimeTranscript('[麦克风权限被拒绝或设备不可用]');
            break;
          case 'not-allowed':
            console.error('语音识别权限被拒绝');
            setRealtimeTranscript('[语音识别权限被拒绝]');
            break;
          case 'network':
            console.error('网络错误，语音识别服务不可用');
            setRealtimeTranscript('[网络错误，语音识别不可用]');
            break;
          case 'aborted':
            console.log('语音识别被中断，这是正常的停止操作');
            // 对于aborted错误，不显示错误信息，因为这通常是正常的停止操作
            break;
          default:
            console.error('未知语音识别错误:', event.error);
            setRealtimeTranscript('[语音识别出现错误]');
        }
        
        // 对于某些错误，尝试重启识别
        if (event.error === 'no-speech' && isRecording) {
          console.log('尝试重启语音识别...');
          setTimeout(() => {
            if (isRecording) {
              startRealtimeSpeechRecognition();
            }
          }, 1000);
        }
        
        // 对于aborted错误，不需要重启，因为这通常是正常的停止操作
        if (event.error === 'aborted') {
          return; // 直接返回，不执行后续的错误处理
        }
      };
      
      recognition.onend = () => {
        console.log('语音识别结束');
        // 语音识别结束时不再累积保存转录文本，避免状态污染
        // 转录文本的最终状态已经在onresult中处理完成
        console.log('语音识别结束，当前转录状态:', {
          transcribedText,
          realtimeTranscript
        });
        // 实时语音识别结束
      };
      
      speechRecognitionRef.current = recognition;
      recognition.start();
      console.log('语音识别已启动');
      // 实时语音识别已启动
      
    } catch (error) {
      // 启动实时语音识别失败
    }
  };

  // 停止实时语音识别
  const stopRealtimeSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      console.log('停止语音识别实例');
      
      // 立即停止语音识别
      try {
        speechRecognitionRef.current.stop();
      } catch (error) {
        console.warn('停止语音识别时出错:', error);
      }
      speechRecognitionRef.current = null;
      // 实时语音识别已停止
    }
  };

  // transcribeAudio函数已删除，现在使用实时语音识别

  // 转录已存在的语音消息
  const transcribeExistingVoiceMessage = async (messageId: string, audioBlob: Blob) => {
    console.log('开始转录已存在的语音消息:', messageId);
    
    // 更新消息状态为转录中
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isTranscribing: true }
        : msg
    ));
    
    try {
      // 检查浏览器是否支持语音识别
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('浏览器不支持语音识别');
        setChatMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isTranscribing: false, transcribedText: '[浏览器不支持语音识别功能]' }
            : msg
        ));
        return;
      }
      
      // 创建音频URL并播放以进行识别
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // 创建语音识别实例
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      let finalTranscript = '';
      let recognitionTimeout: NodeJS.Timeout;
      
      recognition.onresult = (event: any) => {
        let tempFinalTranscript = '';
        let interimTranscript = '';
        
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            tempFinalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (tempFinalTranscript) {
          finalTranscript = tempFinalTranscript;
        }
        
        // 实时更新转录结果
        const currentTranscript = finalTranscript + interimTranscript;
        if (currentTranscript.trim()) {
          setChatMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, realtimeTranscript: currentTranscript }
              : msg
          ));
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        let errorMessage = '[语音识别失败]';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '[未检测到语音内容]';
            break;
          case 'audio-capture':
            errorMessage = '[音频捕获失败]';
            break;
          case 'not-allowed':
            errorMessage = '[语音识别权限被拒绝]';
            break;
          case 'network':
            errorMessage = '[网络错误，语音识别不可用]';
            break;
        }
        
        setChatMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isTranscribing: false, transcribedText: errorMessage }
            : msg
        ));
        
        clearTimeout(recognitionTimeout);
        URL.revokeObjectURL(audioUrl);
      };
      
      recognition.onend = () => {
        console.log('语音识别结束，最终结果:', finalTranscript);
        
        const resultText = finalTranscript.trim() || '[无法识别语音内容]';
        
        setChatMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                isTranscribing: false, 
                transcribedText: resultText,
                realtimeTranscript: resultText
              }
            : msg
        ));
        
        clearTimeout(recognitionTimeout);
        URL.revokeObjectURL(audioUrl);
      };
      
      // 开始识别
      recognition.start();
      
      // 同时播放音频
      audio.play().catch(error => {
        console.error('音频播放失败:', error);
      });
      
      // 设置超时，防止识别过程过长
      recognitionTimeout = setTimeout(() => {
        recognition.stop();
        audio.pause();
        
        if (!finalTranscript.trim()) {
          setChatMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, isTranscribing: false, transcribedText: '[转录超时，请重试]' }
              : msg
          ));
        }
        
        URL.revokeObjectURL(audioUrl);
      }, 30000); // 30秒超时
      
    } catch (error) {
      console.error('转录过程出错:', error);
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isTranscribing: false, transcribedText: '[转录过程出现错误]' }
          : msg
      ));
    }
  };

  // 翻译消息
  const translateMessage = async (text: string, type: 'danmaku' | 'voice', username?: string, avatar?: string) => {
    if (!translationConfig.enabled || isTranslating) return;
    
    setIsTranslating(true);
    
    try {
      const result = await translationService.translateText({
        text,
        sourceLanguage: translationConfig.sourceLanguage,
        targetLanguage: translationConfig.targetLanguage,
        mode: 'fast'
      });
      
      const translatedMessage: TranslatedMessage = {
        id: Date.now().toString(),
        originalText: text,
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        confidence: result.confidence,
        timestamp: Date.now(),
        type,
        username,
        avatar
      };
      
      setTranslatedMessages(prev => [...prev.slice(-19), translatedMessage]);
    } catch (error) {
      // 翻译失败
    } finally {
      setIsTranslating(false);
    }
  };

  // 处理翻译设置变化
  const handleTranslationSettingsChange = (newSettings: TranslationConfig) => {
    setTranslationConfig(newSettings);
  };

  // 模拟语音翻译
  const simulateVoiceTranslation = async () => {
    if (!translationConfig.enabled || !translationConfig.voiceTranslation) return;
    
    const voiceTexts = [
      '欢迎大家来到我的直播间',
      '今天我们来聊聊最新的科技趋势',
      '感谢大家的支持和关注',
      '有什么问题可以在弹幕里提问',
      '我们一起来看看这个有趣的内容'
    ];
    
    const randomText = voiceTexts[Math.floor(Math.random() * voiceTexts.length)];
    await translateMessage(randomText, 'voice', '主播');
  };

  // 定期模拟语音翻译
  useEffect(() => {
    if (translationConfig.enabled && translationConfig.voiceTranslation) {
      const interval = setInterval(simulateVoiceTranslation, 8000);
      return () => clearInterval(interval);
    }
  }, [translationConfig.enabled, translationConfig.voiceTranslation]);

  // 模拟其他用户消息的翻译
  useEffect(() => {
    const translateOtherMessages = async () => {
      if (!translationConfig.enabled || !translationConfig.danmakuTranslation) return;
      
      const otherMessages = [
        { text: 'Hello everyone!', username: 'User123' },
        { text: 'こんにちは', username: 'TokyoFan' },
        { text: '안녕하세요', username: 'SeoulViewer' },
        { text: 'Bonjour!', username: 'ParisLover' }
      ];
      
      const randomMsg = otherMessages[Math.floor(Math.random() * otherMessages.length)];
      await translateMessage(randomMsg.text, 'danmaku', randomMsg.username);
    };
    
    if (translationConfig.enabled && translationConfig.danmakuTranslation) {
      const interval = setInterval(translateOtherMessages, 6000);
      return () => clearInterval(interval);
    }
  }, [translationConfig.enabled, translationConfig.danmakuTranslation]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-600';
      case 'rare': return 'bg-blue-600';
      case 'epic': return 'bg-purple-600';
      case 'legendary': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 弹幕层 */}
      {showDanmaku && danmakuEnabled && (
        <div 
          ref={danmakuRef}
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ opacity: danmakuSettings.opacity }}
        >
          {danmakuMessages.map((msg) => (
            <div
              key={msg.id}
              className="absolute whitespace-nowrap text-white font-medium animate-danmaku"
              style={{
                top: `${msg.position}%`,
                right: '-100%',
                color: msg.color,
                fontSize: `${danmakuSettings.fontSize}px`,
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                animationDuration: `${5 / (msg.speed * danmakuSpeed)}s`,
                animationTimingFunction: 'linear',
                animationFillMode: 'forwards'
              }}
            >
              {msg.content}
            </div>
          ))}
        </div>
      )}

      {/* 礼物特效层 - 移动到聊天框上方区域 */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {giftEffects.map((effect) => (
          <div
            key={effect.id}
            className={`absolute transform -translate-x-1/2 animate-${effect.gift.animation}
                       md:top-24 md:left-1/2
                       max-md:top-16 max-md:left-1/2
                       max-sm:top-12 max-sm:left-1/2`}
          >
            <div className={`${getRarityBg(effect.gift.rarity)} rounded-full p-4 text-white flex flex-col items-center space-y-2 shadow-2xl`}>
              {effect.gift.icon}
              <span className="text-sm font-medium">{effect.gift.name}</span>
              {effect.count > 1 && (
                <span className="text-xs">x{effect.count}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 右侧互动面板 - 桌面版显示，移动端隐藏 */}
      <div className="absolute right-4 w-80 pointer-events-auto z-5
                      top-28 bottom-32
                      md:right-4 md:top-28 md:bottom-32 md:w-80 md:max-h-[calc(100vh-20rem)]
                      lg:top-24 lg:max-h-[calc(100vh-18rem)]
                      max-md:hidden">
        <div className="h-full flex flex-col bg-black bg-opacity-50 rounded-lg overflow-hidden
                        md:h-full md:max-h-[calc(100vh-20rem)]
                        lg:max-h-[calc(100vh-18rem)]
                        max-md:h-[calc(100vh-24rem)] max-md:max-h-[calc(100vh-24rem)]
                        max-sm:h-[calc(100vh-28rem)] max-sm:max-h-[calc(100vh-28rem)]">
          {/* 观看人数和设置 */}
          <div className="p-3 border-b border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{viewerCount.toLocaleString()} 人观看</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDanmaku(!showDanmaku)}
                className={`p-1 rounded transition-colors ${
                  showDanmaku && danmakuEnabled ? 'text-blue-400' : 'text-gray-400'
                }`}
                title={showDanmaku ? '隐藏弹幕' : '显示弹幕'}
                disabled={!danmakuEnabled}
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowTranslationSettings(true)}
                className={`p-1 rounded transition-colors ${
                  translationConfig.enabled ? 'text-green-400' : 'text-gray-400'
                }`}
                title="翻译设置"
              >
                <Languages className="w-4 h-4" />
              </button>
              <button 
                onClick={handleSettingsClick}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="设置"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 连麦用户 */}
          {connectedUsers.length > 0 && (
            <div className="p-3 border-b border-gray-600">
              <h4 className="text-white text-sm font-medium mb-2">连麦中</h4>
              <div className="grid grid-cols-2 gap-2">
                {connectedUsers.map((user) => (
                  <div key={user.id} className="bg-gray-800 rounded p-2 flex items-center space-x-2">
                    <img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-full" />
                    <span className="text-white text-xs flex-1 truncate">{user.username}</span>
                    <div className="flex space-x-1">
                      {user.isMuted ? (
                        <MicOff className="w-3 h-3 text-red-400" />
                      ) : (
                        <Mic className="w-3 h-3 text-green-400" />
                      )}
                      {user.isVideoOn ? (
                        <Video className="w-3 h-3 text-green-400" />
                      ) : (
                        <VideoOff className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 聊天消息 */}
          <div ref={desktopChatRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-2">
                <img src={msg.avatar} alt={msg.username} className="w-6 h-6 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs font-medium ${
                      msg.isVip ? 'text-yellow-400' : 'text-gray-300'
                    }`}>
                      {msg.username}
                    </span>
                    {msg.isVip && <Crown className="w-3 h-3 text-yellow-400" />}
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {msg.type === 'voice' ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 bg-blue-600/20 rounded-lg p-2">
                        <button
                          onClick={() => {
                            if (msg.audioBlob) {
                              const audioUrl = URL.createObjectURL(msg.audioBlob);
                              const audio = new Audio(audioUrl);
                              audio.play().catch(console.error);
                            }
                          }}
                          className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                        <span className="text-blue-200 text-xs">
                          语音消息 {msg.duration ? formatRecordingTime(msg.duration) : ''}
                        </span>
                        {(msg as any).isTranscribing && (
                          <span className="text-yellow-400 text-xs animate-pulse">转换中...</span>
                        )}
                        {/* 转录按钮 - 只在没有转录文本且不在转录中时显示 */}
                        {!((msg as any).transcribedText || (msg as any).realtimeTranscript) && !(msg as any).isTranscribing && msg.audioBlob && (
                          <button
                            onClick={() => transcribeExistingVoiceMessage(msg.id, msg.audioBlob)}
                            className="bg-green-600 text-white p-1.5 rounded-full hover:bg-green-700 transition-colors"
                            title="转录语音为文字"
                          >
                            <FileText className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {((msg as any).transcribedText || (msg as any).realtimeTranscript) && (
                        <div className="bg-gray-700/30 rounded p-2 mt-2">
                          <div className="text-gray-400 text-xs mb-1">语音文本:</div>
                          <p className={`text-white ${getFontSizeClass()} break-words`}>
                            {(msg as any).transcribedText || (msg as any).realtimeTranscript}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className={`text-white ${getFontSizeClass()} break-words`}>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 移除原有的消息输入框 */}
        </div>

      </div>

      {/* 右侧垂直按钮组 - 调整位置避免遮挡底部消息列表和输入框 */}
      <div className="absolute right-4 bottom-52 flex flex-col items-center space-y-3 pointer-events-auto z-45
                      md:right-4 md:bottom-52 md:space-y-3
                      max-md:right-2 max-md:bottom-80 max-md:space-y-2 max-md:scale-90
                      max-sm:right-1 max-sm:bottom-72 max-sm:space-y-2 max-sm:scale-75">
        
        {/* 连线按钮 */}
        <div className="relative">
          <button
            onClick={() => setShowConnectPanel(!showConnectPanel)}
            className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition-colors shadow-lg"
          >
            <Users className="w-6 h-6" />
          </button>
          
          {showConnectPanel && (
            <div className="absolute bottom-16 right-0 bg-black bg-opacity-90 rounded-lg p-4 min-w-48 z-30">
              <h4 className="text-white font-medium mb-3">连麦控制</h4>
              
              {isHost ? (
                <div className="space-y-2">
                  <div className="text-gray-300 text-sm">连麦请求 ({connectRequests.length})</div>
                  {connectRequests.map((user) => (
                    <div key={user.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-full" />
                        <span className="text-white text-sm">{user.username}</span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => onAcceptConnect(user.id)}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          同意
                        </button>
                        <button
                          onClick={() => onRejectConnect(user.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={toggleMic}
                      className={`flex-1 p-2 rounded text-sm transition-colors ${
                        isMicOn ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {isMicOn ? <Mic className="w-4 h-4 mx-auto" /> : <MicOff className="w-4 h-4 mx-auto" />}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className={`flex-1 p-2 rounded text-sm transition-colors ${
                        isVideoOn ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {isVideoOn ? <Video className="w-4 h-4 mx-auto" /> : <VideoOff className="w-4 h-4 mx-auto" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={onRequestConnect}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    申请连麦
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={toggleMic}
                      className={`flex-1 p-2 rounded text-sm transition-colors ${
                        isMicOn ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {isMicOn ? <Mic className="w-4 h-4 mx-auto" /> : <MicOff className="w-4 h-4 mx-auto" />}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className={`flex-1 p-2 rounded text-sm transition-colors ${
                        isVideoOn ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {isVideoOn ? <Video className="w-4 h-4 mx-auto" /> : <VideoOff className="w-4 h-4 mx-auto" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 分享按钮 */}
        <button 
           onClick={() => {
             if (navigator.share) {
               navigator.share({
                 title: '精彩直播',
                 text: '快来看这个精彩的直播！',
                 url: window.location.href
               }).catch(console.error);
             } else {
               // 复制链接到剪贴板
               navigator.clipboard.writeText(window.location.href).then(() => {
                 alert('链接已复制到剪贴板');
               }).catch(() => {
                 alert('分享失败，请手动复制链接');
               });
             }
           }}
           className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
         >
           <Share className="w-6 h-6" />
         </button>

        {/* 礼物按钮 */}
        <div className="relative">
          <button
            onClick={() => setShowGiftPanel(!showGiftPanel)}
            className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 transition-colors shadow-lg"
          >
            <Gift className="w-6 h-6" />
          </button>
          
          {showGiftPanel && (
            <div className="absolute bottom-16 right-0 bg-black bg-opacity-90 rounded-lg p-4 min-w-64 z-30 shadow-2xl border border-gray-600">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-pink-400" />
                送礼物
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {gifts.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => sendGift(gift)}
                    className={`p-3 rounded-lg border transition-all hover:scale-105 hover:shadow-lg ${
                      getRarityBg(gift.rarity)
                    } border-gray-600`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="text-white">{gift.icon}</div>
                      <span className="text-white text-xs">{gift.name}</span>
                      <span className={`text-xs ${getRarityColor(gift.rarity)}`}>
                        {gift.price}币
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 点赞按钮 */}
        <button className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors shadow-lg animate-pulse">
          <Heart className="w-6 h-6" />
        </button>
      </div>

      {/* 底部互动按钮区域已移除，连麦功能已整合到右侧按钮组 */}


      {/* CSS 动画样式 */}
      <style>{`
        @keyframes danmaku {
          from {
            transform: translateX(100vw);
          }
          to {
            transform: translateX(-100%);
          }
        }
        
        .animate-danmaku {
          animation: danmaku linear forwards;
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) scale(1);
          }
          40% {
            transform: translateY(-30px) scale(1.1);
          }
          60% {
            transform: translateY(-15px) scale(1.05);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg) scale(1);
          }
          to {
            transform: rotate(360deg) scale(1.2);
          }
        }
        
        @keyframes zoom {
          0% {
            transform: scale(0) rotate(0deg);
          }
          50% {
            transform: scale(1.3) rotate(180deg);
          }
          100% {
            transform: scale(1) rotate(360deg);
          }
        }
        
        @keyframes explode {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 215, 0, 1);
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            filter: brightness(1);
          }
          25% {
            transform: scale(1.1) rotate(90deg);
            filter: brightness(1.5);
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            filter: brightness(2);
          }
          75% {
            transform: scale(1.1) rotate(270deg);
            filter: brightness(1.5);
          }
        }
        
        @keyframes flame {
          0%, 100% {
            transform: scale(1) translateY(0);
            filter: hue-rotate(0deg);
          }
          25% {
            transform: scale(1.1) translateY(-5px);
            filter: hue-rotate(90deg);
          }
          50% {
            transform: scale(1.2) translateY(-10px);
            filter: hue-rotate(180deg);
          }
          75% {
            transform: scale(1.1) translateY(-5px);
            filter: hue-rotate(270deg);
          }
        }
        
        .animate-bounce { animation: bounce 1s ease-in-out; }
        .animate-float { animation: float 2s ease-in-out; }
        .animate-spin { animation: spin 1s linear; }
        .animate-zoom { animation: zoom 0.8s ease-out; }
        .animate-explode { animation: explode 1.5s ease-out; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 1.5s ease-in-out; }
        .animate-flame { animation: flame 1s ease-in-out; }
      `}</style>
      
      {/* 翻译设置面板 */}
      <TranslationSettings
        isOpen={showTranslationSettings}
        onClose={() => setShowTranslationSettings(false)}
        settings={translationConfig}
        onSettingsChange={handleTranslationSettingsChange}
      />
      
      {/* 翻译显示组件 */}
      <TranslationDisplay
        messages={translatedMessages}
        settings={translationConfig}
        onToggleVisibility={() => setIsTranslationVisible(!isTranslationVisible)}
        isVisible={isTranslationVisible}
      />
      
      {/* 设置面板 */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-medium">聊天设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4" style={{ pointerEvents: 'auto' }}>
              {/* 字体大小设置 */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">字体大小</label>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setFontSize('small')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      fontSize === 'small' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    小
                  </button>
                  <button 
                    onClick={() => setFontSize('medium')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      fontSize === 'medium' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    中
                  </button>
                  <button 
                    onClick={() => setFontSize('large')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      fontSize === 'large' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    大
                  </button>
                </div>
              </div>
              
              {/* 主题设置 */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">主题</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="theme" 
                      value="dark" 
                      checked={theme === 'dark'}
                      onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                      className="text-blue-600" 
                      style={{ pointerEvents: 'auto' }}
                    />
                    <span className="text-white text-sm">深色主题</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="theme" 
                      value="light" 
                      checked={theme === 'light'}
                      onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                      className="text-blue-600" 
                      style={{ pointerEvents: 'auto' }}
                    />
                    <span className="text-white text-sm">浅色主题</span>
                  </label>
                </div>
              </div>
              
              {/* 弹幕设置 */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">弹幕设置</label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-white text-sm">显示弹幕</span>
                    <input 
                      type="checkbox" 
                      checked={showDanmaku} 
                      onChange={(e) => setShowDanmaku(e.target.checked)}
                      className="text-blue-600" 
                      style={{ pointerEvents: 'auto' }}
                    />
                  </label>
                  <div className="space-y-1">
                    <label className="text-white text-xs">弹幕透明度: {Math.round(danmakuSettings.opacity * 100)}%</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={danmakuSettings.opacity}
                      onChange={(e) => setDanmakuSettings(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                      className="w-full"
                      style={{ pointerEvents: 'auto' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white text-xs">弹幕速度: {danmakuSettings.speed}x</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={danmakuSettings.speed}
                      onChange={(e) => setDanmakuSettings(prev => ({ ...prev, speed: Number(e.target.value) }))}
                      className="w-full"
                      style={{ pointerEvents: 'auto' }}
                    />
                  </div>
                </div>
              </div>
              
              {/* 通知设置 */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">通知设置</label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-white text-sm">新消息提醒</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.newMessage}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, newMessage: e.target.checked }))}
                      className="text-blue-600" 
                      style={{ pointerEvents: 'auto' }}
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-white text-sm">礼物提醒</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.gift}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, gift: e.target.checked }))}
                      className="text-blue-600" 
                      style={{ pointerEvents: 'auto' }}
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-white text-sm">关注提醒</span>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.follow}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, follow: e.target.checked }))}
                      className="text-blue-600" 
                      style={{ pointerEvents: 'auto' }}
                    />
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 移动端底部消息列表 - 位于输入框上方 */}
      <div className="absolute bottom-24 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-600 pointer-events-auto z-40
                      md:hidden
                      max-md:block
                      h-72 max-sm:h-56
                      max-h-[calc(100vh-10rem)] max-sm:max-h-[calc(100vh-8rem)]">
        <div className="h-full flex flex-col">
          {/* 观看人数和设置 - 移动端 */}
          <div className="p-2 border-b border-gray-600 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2 text-white">
              <Eye className="w-3 h-3" />
              <span className="text-xs">{viewerCount.toLocaleString()} 人观看</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowDanmaku(!showDanmaku)}
                className={`p-1 rounded transition-colors ${
                  showDanmaku && danmakuEnabled ? 'text-blue-400' : 'text-gray-400'
                }`}
                title={showDanmaku ? '隐藏弹幕' : '显示弹幕'}
                disabled={!danmakuEnabled}
              >
                <MessageCircle className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowTranslationSettings(true)}
                className={`p-1 rounded transition-colors ${
                  translationConfig.enabled ? 'text-green-400' : 'text-gray-400'
                }`}
                title="翻译设置"
              >
                <Languages className="w-3 h-3" />
              </button>
              <button
                onClick={handleSettingsClick}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="设置"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 连麦用户 - 移动端 */}
          {connectedUsers.length > 0 && (
            <div className="p-2 border-b border-gray-600 flex-shrink-0">
              <h4 className="text-white text-xs font-medium mb-1">连麦中</h4>
              <div className="flex flex-wrap gap-1">
                {connectedUsers.map((user) => (
                  <div key={user.id} className="bg-gray-800 rounded px-2 py-1 flex items-center space-x-1">
                    <img src={user.avatar} alt={user.username} className="w-4 h-4 rounded-full" />
                    <span className="text-white text-xs truncate max-w-16">{user.username}</span>
                    <div className="flex space-x-0.5">
                      {user.isMuted ? (
                        <MicOff className="w-2 h-2 text-red-400" />
                      ) : (
                        <Mic className="w-2 h-2 text-green-400" />
                      )}
                      {user.isVideoOn ? (
                        <Video className="w-2 h-2 text-green-400" />
                      ) : (
                        <VideoOff className="w-2 h-2 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 聊天消息 - 移动端 */}
          <div ref={mobileChatRef} className="flex-1 overflow-y-auto p-2 space-y-1.5 overscroll-contain touch-pan-y
                          scrollbar-none">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-2">
                <img src={msg.avatar} alt={msg.username} className="w-5 h-5 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs font-medium ${
                      msg.isVip ? 'text-yellow-400' : 'text-gray-300'
                    }`}>
                      {msg.username}
                    </span>
                    {msg.isVip && <Crown className="w-2.5 h-2.5 text-yellow-400" />}
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {msg.type === 'voice' ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 bg-blue-600/20 rounded-lg p-1.5">
                        <button
                          onClick={() => {
                            if (msg.audioBlob) {
                              const audioUrl = URL.createObjectURL(msg.audioBlob);
                              const audio = new Audio(audioUrl);
                              audio.play().catch(console.error);
                            }
                          }}
                          className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors"
                        >
                          <Play className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-blue-200 text-xs">
                          语音 {msg.duration ? formatRecordingTime(msg.duration) : ''}
                        </span>
                        {(msg as any).isTranscribing && (
                          <span className="text-yellow-400 text-xs animate-pulse">转换中...</span>
                        )}
                        {/* 转录按钮 - 只在没有转录文本且不在转录中时显示 */}
                        {!((msg as any).transcribedText || (msg as any).realtimeTranscript) && !(msg as any).isTranscribing && msg.audioBlob && (
                          <button
                            onClick={() => transcribeExistingVoiceMessage(msg.id, msg.audioBlob)}
                            className="bg-green-600 text-white p-1 rounded-full hover:bg-green-700 transition-colors"
                            title="转录语音为文字"
                          >
                            <FileText className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      {/* 调试信息 - 检查语音消息对象 */}
                      {(() => {
                        const transcribedText = (msg as any).transcribedText;
                        const realtimeTranscript = (msg as any).realtimeTranscript;
                        const displayText = transcribedText || realtimeTranscript;
                        console.log('🎤 语音消息渲染调试:', {
                          msgId: msg.id,
                          msgType: msg.type,
                          transcribedText,
                          realtimeTranscript,
                          displayText,
                          hasTranscribedText: !!transcribedText,
                          hasRealtimeTranscript: !!realtimeTranscript,
                          hasDisplayText: !!displayText,
                          conditionResult: !!displayText,
                          fullMsgObject: msg
                        });
                        return null;
                      })()}
                      {(() => {
                        const transcribedText = (msg as any).transcribedText;
                        const realtimeTranscript = (msg as any).realtimeTranscript;
                        // 优先使用transcribedText，如果为空则使用realtimeTranscript
                        const displayText = transcribedText || realtimeTranscript;
                        
                        // 只有当转录文本存在且不是默认的语音消息格式时才显示
                        if (displayText && displayText.trim() && !displayText.includes('[语音消息')) {
                          return (
                            <div className="bg-gray-700/30 rounded p-1.5 mt-1.5">
                              <div className="text-gray-400 text-xs mb-1">语音文本:</div>
                              <p className={`text-white ${getFontSizeClass()} break-words`}>
                                {displayText.trim()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    <p className={`text-white ${getFontSizeClass()} break-words`}>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部消息输入框 */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-600 pointer-events-auto z-50
                      p-3 pb-safe
                      max-sm:p-2 max-sm:pb-safe
                      md:p-4">

        
        {/* 录音状态指示器 - 增强版 */}
        {isRecording && (
          <div className="mb-2 bg-black/10 backdrop-blur-sm rounded-lg p-2 border border-red-500/30 max-sm:p-1.5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 max-sm:space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse max-sm:w-1.5 max-sm:h-1.5"></div>
                <span className="text-white text-xs max-sm:text-xs">录音中</span>
                {/* 录音质量指示器 */}
                <span className={`text-xs px-1 py-0.5 rounded ${
                  recordingQuality === 'high' ? 'bg-green-600/50 text-green-200' :
                  recordingQuality === 'medium' ? 'bg-yellow-600/50 text-yellow-200' :
                  'bg-red-600/50 text-red-200'
                }`}>
                  {recordingQuality === 'high' ? 'HD' : recordingQuality === 'medium' ? 'SD' : 'LD'}
                </span>
              </div>
              <span className="text-white text-xs font-mono max-sm:text-xs">{formatRecordingTime(recordingTime)}</span>
            </div>
            
            {/* 实时语音识别结果 */}
            {realtimeTranscript && (
              <div className="mt-2 bg-gray-800/50 rounded p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-400 text-xs">实时识别</span>
                </div>
                <p className="text-white text-sm break-words">{realtimeTranscript}</p>
              </div>
            )}
            
            {/* 音量指示器 */}
            <div className="mt-2 flex items-center space-x-2">
              <Volume2 className="w-3 h-3 text-gray-400" />
              <div className="flex-1 bg-gray-600 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${
                    audioLevel > 70 ? 'bg-red-500' :
                    audioLevel > 40 ? 'bg-yellow-500' :
                    audioLevel > 10 ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}
                  style={{ width: `${Math.min(audioLevel, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-400 min-w-[2rem] text-right">{Math.round(audioLevel)}%</span>
            </div>
            
            <div className="mt-1 flex justify-center">
              <span className="text-white text-xs opacity-60">向上滑动取消 • 松开发送</span>
            </div>
            {isCancellingVoice && (
              <div className="absolute inset-0 bg-red-600/80 rounded-lg flex items-center justify-center">
                <span className="text-white font-medium text-sm">松开取消录音</span>
              </div>
            )}
          </div>
        )}

        
        {/* 消息输入区域 */}
        <div className="flex items-center space-x-3 max-sm:space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="说点什么..."
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-full border border-gray-600 focus:border-blue-500 focus:outline-none
                      max-sm:px-3 max-sm:py-2 max-sm:text-sm
                      md:px-5 md:py-4"
            disabled={isRecording}
          />
          
          {/* 语音录制按钮容器 */}
          <div className="relative">
            {/* 录音按钮 */}
            <button
              ref={voiceButtonRef}
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseMove={handleMove}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              onTouchMove={handleMove}
              className={`relative ${
                isRecording 
                  ? 'bg-red-600 scale-110 shadow-lg shadow-red-500/50' 
                  : isPressed 
                    ? 'bg-blue-700 scale-105' 
                    : 'bg-blue-600'
              } text-white p-3 rounded-full hover:bg-blue-700 transition-all duration-200 active:bg-blue-800
                        max-sm:p-2.5
                        md:p-4
                        touch-manipulation overflow-hidden`}
              title={isRecording ? '松开发送，上滑取消' : '按住录音'}
            >
              {/* 录音波纹效果 */}
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
              )}
              
              {/* 麦克风图标 */}
              <Mic className={`relative z-10 w-5 h-5 max-sm:w-4 max-sm:h-4 md:w-6 md:h-6 ${
                isRecording ? 'animate-pulse' : ''
              }`} />
              
              {/* 音量指示器 */}
              {isRecording && audioLevel > 0 && (
                <div className="absolute inset-0 rounded-full border-2 border-white/30" 
                     style={{
                       transform: `scale(${1 + (audioLevel / 100) * 0.3})`,
                       transition: 'transform 0.1s ease-out'
                     }}>
                </div>
              )}
            </button>
            
            {/* 录音时长显示 */}
            {isRecording && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </div>
            )}
            
            {/* 取消录音提示 */}
            {isCancellingVoice && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap animate-bounce">
                松开取消录音
              </div>
            )}
            
            {/* 长按进度指示器 */}
            {isPressed && !isRecording && (
              <div className="absolute inset-0 rounded-full border-2 border-white/50">
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
              </div>
            )}
          </div>
          
          {/* 发送按钮 */}
          <button
            onClick={sendMessage}
            disabled={!message.trim() || isRecording}
            className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                      max-sm:p-2.5
                      md:p-4"
          >
            <Send className="w-5 h-5 max-sm:w-4 max-sm:h-4 md:w-6 md:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveInteraction;