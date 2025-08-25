import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Search, Clock, Shield, Users, UserPlus, Settings, Download, Eye, EyeOff, Reply, Copy, Trash2, Image, Video, FileText, Play, Pause, Forward, Heart, CheckSquare, Mic, MicOff, Volume2 } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file' | 'voice';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isEncrypted: boolean;
  expiresAt?: Date;
  replyTo?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead?: boolean; // 消息是否已读
  isFavorited?: boolean; // 是否已收藏
  isSelected?: boolean; // 是否被选中（多选模式）
  // 语音消息相关字段
  voiceUrl?: string; // 语音文件URL
  voiceDuration?: number; // 语音时长（秒）
  transcription?: string; // 转录文本
  isTranscribing?: boolean; // 是否正在转录
  audioBlob?: Blob; // 音频数据
  transcribedText?: string; // 转录后的文本
}

interface ChatMember {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member';
  isOnline: boolean;
  lastSeen?: Date;
}

interface EnhancedChatProps {
  chatId: string;
  chatName: string;
  isGroup: boolean;
  members?: ChatMember[];
  currentUserId: string;
  messages: Message[];
  onSendMessage: (content: string, type: Message['type'], file?: File) => void;
  onDeleteMessage: (messageId: string) => void;
  onSearchMessages: (query: string) => void;
  onAddMember?: (userId: string) => void;
  onRemoveMember?: (userId: string) => void;
  onLeaveGroup?: () => void;
  onToggleFavorite?: (messageId: string) => void;
  onForwardMessages?: (messageIds: string[], targetChatId: string) => void;
}



const EnhancedChat: React.FC<EnhancedChatProps> = ({
  chatId,
  chatName,
  isGroup,
  members = [],
  currentUserId,
  messages,
  onSendMessage,
  onDeleteMessage,
  onSearchMessages,
  onAddMember,
  onRemoveMember,
  onLeaveGroup,
  onToggleFavorite,
  onForwardMessages
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [burnTimer, setBurnTimer] = useState(24); // hours
  const [messageLongPressTimer, setMessageLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isMessageLongPressing, setIsMessageLongPressing] = useState(false);
  
  // 多选模式状态
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  
  // 转发对话框状态
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardingMessages, setForwardingMessages] = useState<Message[]>([]);
  
  // 语音录制相关状态 - 从LiveInteraction完整复制
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'];
  const burnTimerOptions = [1, 6, 12, 24, 48, 168]; // hours

  // 消息长按处理函数
  const handleMessagePressStart = (messageId: string) => {
    setIsMessageLongPressing(true);
    const timer = setTimeout(() => {
      setSelectedMessage(selectedMessage === messageId ? null : messageId);
      setIsMessageLongPressing(false);
    }, 500); // 0.5秒
    setMessageLongPressTimer(timer);
  };

  const handleMessagePressEnd = () => {
    if (messageLongPressTimer) {
      clearTimeout(messageLongPressTimer);
      setMessageLongPressTimer(null);
    }
    setIsMessageLongPressing(false);
  };

  const handleMessagePressCancel = () => {
    if (messageLongPressTimer) {
      clearTimeout(messageLongPressTimer);
      setMessageLongPressTimer(null);
    }
    setIsMessageLongPressing(false);
  };
  // 标记消息为已读
  const markAsRead = (messageId: string) => {
    setLocalMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 添加本地消息状态管理
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  
  // 同步外部messages到本地状态，保留本地语音消息的audioBlob
  useEffect(() => {
    setLocalMessages(prevLocal => {
      // 创建一个映射来保存本地消息中的audioBlob数据
      const localAudioBlobMap = new Map<string, Blob>();
      prevLocal.forEach(msg => {
        if (msg.type === 'voice' && msg.audioBlob) {
          localAudioBlobMap.set(msg.id, msg.audioBlob);
        }
      });
      
      // 检查是否有新消息需要添加（避免重复）
      const existingIds = new Set(prevLocal.map(msg => msg.id));
      const newMessages = messages.filter(msg => !existingIds.has(msg.id));
      
      // 如果没有新消息，保持原有状态
      if (newMessages.length === 0) {
        return prevLocal;
      }
      
      // 合并外部消息和本地audioBlob数据
      return messages.map(msg => {
        if (msg.type === 'voice' && localAudioBlobMap.has(msg.id)) {
          return { ...msg, audioBlob: localAudioBlobMap.get(msg.id) };
        }
        return msg;
      });
    });
  }, [messages]);
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (messageLongPressTimer) {
        clearTimeout(messageLongPressTimer);
      }
    };
  }, [messageLongPressTimer]);



  // 转录已存在的语音消息 - 从LiveInteraction完整复制
  const transcribeExistingVoiceMessage = async (messageId: string) => {
    console.log('开始转录已存在的语音消息:', messageId);
    
    // 更新消息状态为转录中
    setLocalMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isTranscribing: true }
        : msg
    ));
    
    try {
      // 检查浏览器是否支持语音识别
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('浏览器不支持语音识别');
        setLocalMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isTranscribing: false, transcribedText: '[浏览器不支持语音识别功能]' }
            : msg
        ));
        return;
      }
      
      // 找到对应的消息和音频数据
      const message = localMessages.find(msg => msg.id === messageId);
      if (!message || !message.audioBlob) {
        console.error('未找到消息或音频数据');
        setLocalMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isTranscribing: false, transcribedText: '[未找到音频数据]' }
            : msg
        ));
        return;
      }
      
      // 创建音频URL并播放以进行识别
      const audioUrl = URL.createObjectURL(message.audioBlob);
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
          setLocalMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, transcription: currentTranscript }
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
        
        setLocalMessages(prev => prev.map(msg => 
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
        
        setLocalMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                isTranscribing: false, 
                transcribedText: resultText,
                transcription: resultText
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
          setLocalMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, isTranscribing: false, transcribedText: '[识别超时，未获取到语音内容]' }
              : msg
          ));
        }
        
        URL.revokeObjectURL(audioUrl);
      }, 15000); // 15秒超时
      
    } catch (error) {
      console.error('转录过程出错:', error);
      setLocalMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isTranscribing: false, transcribedText: '[转录过程出错]' }
          : msg
      ));
    }
  };

  // 开始录音 - 从LiveInteraction完整复制
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

  // 智能音频优化函数 - 从LiveInteraction完整复制
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
  
  // 音频增强处理 - 从LiveInteraction完整复制
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
  
  // 将AudioBuffer转换为WAV格式的Blob - 从LiveInteraction完整复制
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

  // 降级录音配置（当高质量配置失败时使用） - 从LiveInteraction完整复制
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

  // 停止录音 - 从LiveInteraction完整复制
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
  
  // 取消录音 - 从LiveInteraction完整复制
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
  
  // 处理按下开始 - 从LiveInteraction完整复制
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    // 只在非passive事件中调用preventDefault
    if (e.cancelable) {
      e.preventDefault();
    }
    
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
  
  // 处理移动 - 从LiveInteraction完整复制
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
  
  // 处理松开结束 - 从LiveInteraction完整复制
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
  
  // 重置录音相关状态 - 从LiveInteraction完整复制
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
  
  // 统一的错误处理函数 - 从LiveInteraction完整复制
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
  
  // 清理所有录音相关资源 - 从LiveInteraction完整复制
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
  
  // 重置触摸状态 - 从LiveInteraction完整复制
  const resetTouchState = () => {
    startTouchY.current = 0;
    currentTouchY.current = 0;
  };

  // 发送语音消息 - 从LiveInteraction完整复制
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
      const voiceMessage: Message = {
        id: Date.now().toString(),
        senderId: currentUserId,
        senderName: 'You',
        senderAvatar: '/default-avatar.png',
        content: initialContent,
        timestamp: new Date(),
        type: 'voice',
        status: 'sending',
        isEncrypted: false,
        audioBlob: audioBlob,
        voiceDuration: displayDuration,
        transcribedText: finalTranscript
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
      
      // 添加到本地消息列表
      setLocalMessages(prev => [...prev, voiceMessage]);
      // 同时调用外部回调通知父组件
      onSendMessage?.(initialContent, 'voice');
      
      // 立即清理录音状态和转录状态，防止下次录音时状态污染
      setRecordingTime(0);
      setRealtimeTranscript('');
      setTranscribedText(''); // 立即清理转录文本状态
      
      // 自动滚动到最新消息
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  };

  // 启动实时语音识别 - 从LiveInteraction完整复制
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
        
        // 如果有最终结果，累积到transcribedText状态
        if (finalTranscript.trim()) {
          setTranscribedText(prev => {
            const newText = prev + finalTranscript;
            console.log('语音识别onresult累积transcribedText:', newText);
            return newText;
          });
        }
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
      };
      
      speechRecognitionRef.current = recognition;
      recognition.start();
      console.log('语音识别已启动');
      
    } catch (error) {
      console.error('启动实时语音识别失败:', error);
    }
  };

  // 停止实时语音识别 - 从LiveInteraction完整复制
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
    }
  };

  // 格式化录音时间
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 增强的麦克风权限检查 - 从LiveInteraction完整复制
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage, 'text');
      setNewMessage('');
      setReplyToMessage(null);
    }
  };

  const handleFileUpload = (type: 'image' | 'video' | 'file') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : '*/*';
      fileInputRef.current.click();
    }
    setShowFileMenu(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : 'file';
      onSendMessage(file.name, type as Message['type'], file);
    }
  };

  // 检查网络状态
  const checkNetworkStatus = () => {
    if (!navigator.onLine) {
      return { isOnline: false, message: '网络连接已断开，请检查网络设置' };
    }
    return { isOnline: true, message: null };
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  // 切换收藏状态
  const toggleFavorite = (messageId: string) => {
    if (onToggleFavorite) {
      onToggleFavorite(messageId);
    } else {
      // 如果没有提供回调，则在本地模拟切换状态
      console.log('切换收藏状态:', messageId);
      // 触发自定义事件来更新消息状态（用于演示）
      const event = new CustomEvent('toggleMessageFavorite', {
        detail: { messageId }
      });
      window.dispatchEvent(event);
    }
  };

  // 进入多选模式
  const enterMultiSelectMode = (messageId: string) => {
    setIsMultiSelectMode(true);
    const newSelected = new Set([messageId]);
    setSelectedMessages(newSelected);
  };

  // 切换消息选中状态
  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
    
    // 如果没有选中的消息，退出多选模式
    if (newSelected.size === 0) {
      setIsMultiSelectMode(false);
    }
  };

  // 退出多选模式
  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedMessages(new Set());
  };

  // 批量转发选中的消息
  const forwardSelectedMessages = () => {
    const messagesToForward = messages.filter(msg => selectedMessages.has(msg.id));
    setForwardingMessages(messagesToForward);
    setShowForwardDialog(true);
  };

  const handleMessageAction = (action: string, messageId: string) => {
    switch (action) {
      case 'reply':
        const message = messages.find(m => m.id === messageId);
        if (message) setReplyToMessage(message);
        break;
      case 'copy':
        const msg = messages.find(m => m.id === messageId);
        if (msg) navigator.clipboard.writeText(msg.content);
        break;
      case 'forward':
        const forwardMsg = messages.find(m => m.id === messageId);
        if (forwardMsg) {
          setForwardingMessages([forwardMsg]);
          setShowForwardDialog(true);
        }
        break;
      case 'favorite':
        toggleFavorite(messageId);
        break;
      case 'select':
        enterMultiSelectMode(messageId);
        break;
      case 'delete':
        onDeleteMessage(messageId);
        break;
    }
    setSelectedMessage(null);
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.senderId === currentUserId;
    const isExpired = message.expiresAt && new Date() > message.expiresAt;
    
    if (isExpired) {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <div className="bg-gray-600 text-gray-300 px-3 py-1 rounded-full text-xs">
            🔥 消息已销毁
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 relative`}>
        {/* 多选模式下的选择框 */}
        {isMultiSelectMode && (
          <div className="absolute left-0 top-0 z-10">
            <button
              onClick={() => toggleMessageSelection(message.id)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedMessages.has(message.id)
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-400 bg-transparent'
              }`}
            >
              {selectedMessages.has(message.id) && <CheckSquare className="w-4 h-4" />}
            </button>
          </div>
        )}
        
        {!isOwn && (
          <img 
            src={message.senderAvatar} 
            alt={message.senderName}
            className={`w-8 h-8 rounded-full mr-2 mt-1 ${isMultiSelectMode ? 'ml-8' : ''}`}
          />
        )}
        
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'} ${isMultiSelectMode && isOwn ? 'mr-8' : ''}`}>
          {!isOwn && isGroup && (
            <div className="text-xs text-gray-400 mb-1">{message.senderName}</div>
          )}
          
          {message.replyTo && (
            <div className="bg-gray-700 border-l-2 border-blue-500 pl-2 py-1 mb-1 text-xs">
              <div className="text-gray-400">回复消息</div>
              <div className="text-gray-300 truncate">
                {messages.find(m => m.id === message.replyTo)?.content}
              </div>
            </div>
          )}
          
          <div 
            className={`relative px-4 py-2 rounded-lg ${
              isOwn 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700 text-white'
            } ${
              selectedMessages.has(message.id) 
                ? 'ring-2 ring-blue-400 ring-opacity-75' 
                : ''
            }`}
            data-message-content
            onMouseDown={() => handleMessagePressStart(message.id)}
            onMouseUp={handleMessagePressEnd}
            onMouseLeave={handleMessagePressCancel}
            onTouchStart={() => handleMessagePressStart(message.id)}
            onTouchEnd={handleMessagePressEnd}
            onTouchCancel={handleMessagePressCancel}
          >
            {message.isEncrypted && (
              <Shield className="w-3 h-3 absolute top-1 right-1 text-green-400" />
            )}
            
            {/* 收藏状态指示器 */}
            {message.isFavorited && (
              <Heart className="w-3 h-3 absolute top-1 left-1 text-red-400 fill-current" />
            )}
            

            
            {message.type === 'image' && (
              <div>
                <img 
                  src={message.fileUrl} 
                  alt="图片" 
                  className="max-w-full rounded mb-1"
                />
                {message.content && <div className="text-sm">{message.content}</div>}
              </div>
            )}
            
            {message.type === 'video' && (
              <div>
                <video 
                  src={message.fileUrl} 
                  controls 
                  className="max-w-full rounded mb-1"
                />
                {message.content && <div className="text-sm">{message.content}</div>}
              </div>
            )}
            
            {message.type === 'file' && (
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6" />
                <div>
                  <div className="font-medium">{message.fileName}</div>
                  <div className="text-xs opacity-75">
                    {message.fileSize && `${(message.fileSize / 1024 / 1024).toFixed(1)} MB`}
                  </div>
                </div>
                <Download className="w-4 h-4 cursor-pointer hover:text-blue-300" />
              </div>
            )}
            
            {message.type === 'voice' ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 bg-blue-600/20 rounded-lg p-2">
                  <button
                    onClick={() => {
                      if (message.audioBlob) {
                        const audioUrl = URL.createObjectURL(message.audioBlob);
                        const audio = new Audio(audioUrl);
                        audio.play().catch(console.error);
                      }
                    }}
                    className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                  <span className="text-blue-200 text-xs">
                    语音消息 {message.voiceDuration ? formatRecordingTime(message.voiceDuration) : ''}
                  </span>
                  {message.isTranscribing && (
                    <span className="text-yellow-400 text-xs animate-pulse">转换中...</span>
                  )}
                  {/* 转录按钮 - 只在没有转录文本且不在转录中时显示 */}
                  {!(message.transcribedText || message.transcription) && !message.isTranscribing && message.audioBlob && (
                    <button
                      onClick={() => transcribeExistingVoiceMessage(message.id)}
                      className="bg-green-600 text-white p-1.5 rounded-full hover:bg-green-700 transition-colors"
                      title="转录语音为文字"
                    >
                      <FileText className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {(() => {
                  const transcribedText = message.transcribedText;
                  const transcription = message.transcription;
                  // 优先使用transcribedText，如果为空则使用transcription
                  const displayText = transcribedText || transcription;
                  
                  // 只有当转录文本存在且不是默认的语音消息格式时才显示
                  if (displayText && displayText.trim() && !displayText.includes('[语音消息')) {
                    return (
                      <div className="bg-gray-700/30 rounded p-2 mt-2">
                        <div className="text-gray-400 text-xs mb-1">语音文本:</div>
                        <p className="text-white text-sm break-words">
                          {displayText.trim()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <p className="text-white text-sm break-words">
                {message.content}
              </p>
            )}
            <div className="flex items-center justify-between mt-1">
              {isOwn && (
                <div className="text-xs opacity-75">
                  {getStatusIcon(message.status)}
                </div>
              )}
              {message.expiresAt && (
                <div className="text-xs opacity-75 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.ceil((message.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))}h
                </div>
              )}
            </div>
          </div>
          
          {selectedMessage === message.id && (
            <div className="absolute bg-gray-800 rounded-lg shadow-lg p-2 mt-1 z-10" data-message-menu>
              <button 
                onClick={() => handleMessageAction('reply', message.id)}
                className="flex items-center space-x-2 w-full px-2 py-1 hover:bg-gray-700 rounded text-sm"
              >
                <Reply className="w-4 h-4" />
                <span>回复</span>
              </button>
              <button 
                onClick={() => handleMessageAction('copy', message.id)}
                className="flex items-center space-x-2 w-full px-2 py-1 hover:bg-gray-700 rounded text-sm"
              >
                <Copy className="w-4 h-4" />
                <span>复制</span>
              </button>
              <button 
                onClick={() => handleMessageAction('forward', message.id)}
                className="flex items-center space-x-2 w-full px-2 py-1 hover:bg-gray-700 rounded text-sm"
              >
                <Forward className="w-4 h-4" />
                <span>转发</span>
              </button>
              <button 
                onClick={() => handleMessageAction('favorite', message.id)}
                className="flex items-center space-x-2 w-full px-2 py-1 hover:bg-gray-700 rounded text-sm"
              >
                <Heart className="w-4 h-4" />
                <span>收藏</span>
              </button>
              <button 
                onClick={() => handleMessageAction('select', message.id)}
                className="flex items-center space-x-2 w-full px-2 py-1 hover:bg-gray-700 rounded text-sm"
              >
                <CheckSquare className="w-4 h-4" />
                <span>多选</span>
              </button>
              {isOwn && (
                <button 
                  onClick={() => handleMessageAction('delete', message.id)}
                  className="flex items-center space-x-2 w-full px-2 py-1 hover:bg-gray-700 rounded text-sm text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 overflow-hidden">
      {/* Chat Header */}
      <div className="w-full flex items-center justify-between px-3 py-3 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-white font-semibold">{chatName}</h2>
            {isGroup && (
              <div className="text-sm text-gray-400">
                {members.filter(m => m.isOnline).length} 在线 · {members.length} 成员
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          
          {isGroup && (
            <button 
              onClick={() => setShowChatSettings(!showChatSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          
          <button 
            onClick={() => setShowChatSettings(!showChatSettings)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="w-full px-3 py-3 border-b border-gray-700 flex-shrink-0">
          <input
            type="text"
            placeholder="搜索消息..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearchMessages(e.target.value);
            }}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Multi-Select Toolbar */}
      {isMultiSelectMode && (
        <div className="w-full px-3 py-3 border-b border-gray-700 flex-shrink-0 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-white text-sm">
                已选择 {selectedMessages.size} 条消息
              </span>
              <button
                onClick={() => {
                  const allMessageIds = new Set(localMessages.map(msg => msg.id));
                  setSelectedMessages(allMessageIds);
                }}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                全选
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={forwardSelectedMessages}
                disabled={selectedMessages.size === 0}
                className="p-2 text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                title="转发"
              >
                <Forward className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => {
                  // TODO: 批量删除选中的消息
                  console.log('批量删除:', Array.from(selectedMessages));
                }}
                disabled={selectedMessages.size === 0}
                className="p-2 text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                title="删除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={exitMultiSelectMode}
                className="p-2 text-gray-400 hover:text-white"
                title="取消"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        className="flex-1 w-full overflow-y-auto px-3 py-3 space-y-3 min-h-0"
        onClick={(e) => {
          // 点击空白区域收起消息菜单
          // 检查点击的元素是否是消息内容或消息菜单
          const target = e.target as HTMLElement;
          const isMessageContent = target.closest('[data-message-content]');
          const isMessageMenu = target.closest('[data-message-menu]');
          
          // 如果不是点击消息内容或菜单，则收起菜单
          if (!isMessageContent && !isMessageMenu) {
            setSelectedMessage(null);
          }
        }}
      >
        {localMessages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyToMessage && (
        <div className="w-full px-3 py-2 bg-gray-800 border-t border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-xs text-gray-400">回复 {replyToMessage.senderName}</div>
                <div className="text-sm text-gray-300 truncate max-w-xs">
                  {replyToMessage.content}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setReplyToMessage(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 录音状态指示器 - 增强版 */}
      {isRecording && (
        <div className="w-full px-3 py-2 border-t border-gray-700 flex-shrink-0">
          <div className="bg-black/10 backdrop-blur-sm rounded-lg p-2 border border-red-500/30 max-sm:p-1.5 relative">
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
        </div>
      )}

      {/* Message Input */}
      <div className="w-full px-3 py-3 border-t border-gray-700 flex-shrink-0">
        {/* Burn After Reading Toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setBurnAfterReading(!burnAfterReading)}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                burnAfterReading ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {burnAfterReading ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>阅后即焚</span>
            </button>
            
            {burnAfterReading && (
              <select
                value={burnTimer}
                onChange={(e) => setBurnTimer(Number(e.target.value))}
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
              >
                {burnTimerOptions.map(hours => (
                  <option key={hours} value={hours}>
                    {hours < 24 ? `${hours}小时` : `${hours / 24}天`}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="flex items-end space-x-2">
          {/* File Upload */}
          <div className="relative">
            <button
              onClick={() => setShowFileMenu(!showFileMenu)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            {showFileMenu && (
              <div className="absolute bottom-12 left-0 bg-gray-800 rounded-lg shadow-lg p-2 min-w-32">
                <button
                  onClick={() => handleFileUpload('image')}
                  className="flex items-center space-x-2 w-full px-2 py-1 hover:bg-gray-700 rounded text-sm"
                >
                  <Image className="w-4 h-4" />
                  <span>图片</span>
                </button>
                <button
                  onClick={() => handleFileUpload('video')}
                  className="flex items-center space-x-2 w-full px-2 py-1 hover:bg-gray-700 rounded text-sm"
                >
                  <Video className="w-4 h-4" />
                  <span>视频</span>
                </button>
                <button
                  onClick={() => handleFileUpload('file')}
                  className="flex items-center space-x-2 w-full px-2 py-1 hover:bg-gray-700 rounded text-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>文件</span>
                </button>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="说点什么..."
              className="w-full bg-gray-800 text-white px-4 py-3 pr-10 rounded-full border border-gray-600 focus:border-blue-500 focus:outline-none
                        max-sm:px-3 max-sm:py-2 max-sm:text-sm
                        md:px-5 md:py-4"
              disabled={isRecording}
            />
            
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-gray-800 rounded-lg shadow-lg p-3 grid grid-cols-8 gap-1">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-lg hover:bg-gray-700 rounded p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

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

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isRecording}
            className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                      max-sm:p-2.5
                      md:p-4"
          >
            <Send className="w-5 h-5 max-sm:w-4 max-sm:h-4 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Group Settings Modal */}
      {showChatSettings && isGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">群聊设置</h3>
              <button 
                onClick={() => setShowChatSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">成员 ({members.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={member.avatar} 
                          alt={member.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="text-white text-sm">{member.name}</div>
                          <div className="text-gray-400 text-xs">
                            {member.role === 'admin' ? '管理员' : '成员'}
                          </div>
                        </div>
                      </div>
                      
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => onRemoveMember?.(member.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          移除
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onAddMember?.('')}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  添加成员
                </button>
                <button
                  onClick={onLeaveGroup}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  退出群聊
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forward Dialog */}
      {showForwardDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">转发消息</h3>
              <button 
                onClick={() => setShowForwardDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="max-h-40 overflow-y-auto bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-300 mb-2">要转发的消息：</div>
                {forwardingMessages.map((msg, index) => (
                  <div key={msg.id} className="text-sm text-white mb-2 p-2 bg-gray-600 rounded">
                    <div className="font-medium">{msg.senderName}:</div>
                    <div className="truncate">{msg.content}</div>
                  </div>
                ))}
              </div>
              
              <div>
                <div className="text-sm text-gray-300 mb-2">选择转发到：</div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {/* 这里应该显示可转发的聊天列表 */}
                  <div className="text-sm text-gray-400 text-center py-4">
                    暂无可转发的聊天
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowForwardDialog(false)}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (onForwardMessages && forwardingMessages.length > 0) {
                      const messageIds = forwardingMessages.map(msg => msg.id);
                      // 这里应该有一个目标聊天选择，暂时使用当前聊天ID作为示例
                      onForwardMessages(messageIds, chatId);
                    } else {
                      // 如果没有提供回调，则在控制台输出
                      console.log('转发消息:', forwardingMessages.map(msg => msg.id));
                    }
                    
                    // 关闭对话框并清理状态
                    setShowForwardDialog(false);
                    setForwardingMessages([]);
                    
                    // 如果是从多选模式转发，退出多选模式
                    if (isMultiSelectMode) {
                      exitMultiSelectMode();
                    }
                  }}
                  disabled={forwardingMessages.length === 0}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  转发
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChat;