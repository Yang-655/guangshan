import React, { useState, useRef, useEffect } from 'react';
import { Send, Shield, ShieldCheck, Key, Lock, Unlock, Eye, EyeOff, Globe, Settings, AlertTriangle, CheckCircle, Mic, MicOff, Play, Pause, Square, Volume2, FileText } from 'lucide-react';
import { EncryptedChatManager, EncryptedMessage, DecryptedMessage } from '../services/encryptionService';
import { TranslationService } from '../services/translationService';

interface EncryptedChatProps {
  currentUserId: string;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  originalContent?: string; // 翻译前的原文
  timestamp: Date;
  isEncrypted: boolean;
  isVerified: boolean;
  isTranslated?: boolean;
  detectedLanguage?: string;
  type?: 'text' | 'voice';
  audioBlob?: Blob;
  audioUrl?: string;
  duration?: number;
  transcription?: string;
  isTranscribing?: boolean;
}

const EncryptedChat: React.FC<EncryptedChatProps> = ({
  currentUserId,
  targetUserId,
  targetUserName,
  targetUserAvatar,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(true);
  const [encryptionStatus, setEncryptionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [showEncryptionDetails, setShowEncryptionDetails] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('zh-CN');
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [realtimeTranscription, setRealtimeTranscription] = useState('');
  const [finalTranscription, setFinalTranscription] = useState(''); // 累积的最终转录结果
  const [isRealtimeRecognitionActive, setIsRealtimeRecognitionActive] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [currentTouchY, setCurrentTouchY] = useState<number | null>(null);
  const [isCancellingVoice, setIsCancellingVoice] = useState(false);
  
  const chatManagerRef = useRef<EncryptedChatManager | null>(null);
  const translationServiceRef = useRef<TranslationService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatIdRef = useRef<string | null>(null);
  
  // Voice recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const supportedLanguages = [
    { code: 'zh-CN', name: '中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ru', name: 'Русский' }
  ];

  useEffect(() => {
    initializeChat();
    return () => {
      if (chatManagerRef.current) {
        chatManagerRef.current.endEncryptedChat();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // 初始化加密聊天管理器
      chatManagerRef.current = new EncryptedChatManager();
      chatIdRef.current = chatManagerRef.current.startEncryptedChat(currentUserId, targetUserId);
      
      // 初始化翻译服务
      translationServiceRef.current = new TranslationService();
      // 翻译服务不需要初始化方法
      
      setEncryptionStatus('connected');
      
      // 添加系统消息
      addSystemMessage('🔒 端到端加密已启用，您的消息受到保护');
      
      // 模拟接收一些历史消息
      setTimeout(() => {
        simulateIncomingMessage('你好！这是一条加密消息。', 'zh-CN');
      }, 1000);
      
      setTimeout(() => {
        simulateIncomingMessage('Hello! This is an encrypted message.', 'en');
      }, 2000);
      
    } catch (error) {
      console.error('初始化加密聊天失败:', error);
      setEncryptionStatus('error');
      addSystemMessage('❌ 加密初始化失败，请重试');
    }
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId: 'system',
      senderName: '系统',
      content,
      timestamp: new Date(),
      isEncrypted: false,
      isVerified: true
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const simulateIncomingMessage = async (content: string, language: string) => {
    if (!chatManagerRef.current) return;
    
    try {
      // 模拟接收加密消息
      const encryptedMessage = chatManagerRef.current.sendEncryptedMessage(
        content,
        targetUserId,
        currentUserId
      );
      
      // 解密消息
      const decryptedMessage = chatManagerRef.current.receiveEncryptedMessage(encryptedMessage);
      
      let finalContent = decryptedMessage.content;
      let translatedContent = '';
      let detectedLanguage = language;
      
      // 如果启用了自动翻译且检测到的语言不是目标语言
      if (autoTranslate && translationServiceRef.current && language !== targetLanguage) {
        try {
          const translationResult = await translationServiceRef.current.translateText(
            decryptedMessage.content,
            language,
            targetLanguage
          );
          translatedContent = translationResult.translatedText;
          finalContent = translatedContent;
        } catch (error) {
          console.error('翻译失败:', error);
        }
      }
      
      const chatMessage: ChatMessage = {
        id: decryptedMessage.id,
        senderId: decryptedMessage.senderId,
        senderName: targetUserName,
        content: finalContent,
        originalContent: translatedContent ? decryptedMessage.content : undefined,
        timestamp: new Date(decryptedMessage.timestamp),
        isEncrypted: true,
        isVerified: decryptedMessage.isVerified,
        isTranslated: !!translatedContent,
        detectedLanguage
      };
      
      setMessages(prev => [...prev, chatMessage]);
    } catch (error) {
      console.error('处理接收消息失败:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatManagerRef.current) return;
    
    try {
      let messageToSend = newMessage;
      let originalMessage = newMessage;
      let detectedLanguage = 'zh-CN';
      
      // 如果启用了翻译服务，检测语言
      if (translationServiceRef.current) {
        try {
          const detection = await translationServiceRef.current.detectLanguage(newMessage);
          detectedLanguage = detection.language;
        } catch (error) {
          console.error('语言检测失败:', error);
        }
      }
      
      // 发送加密消息
      const encryptedMessage = chatManagerRef.current.sendEncryptedMessage(
        messageToSend,
        currentUserId,
        targetUserId
      );
      
      // 创建聊天消息
      const chatMessage: ChatMessage = {
        id: encryptedMessage.id,
        senderId: currentUserId,
        senderName: '我',
        content: messageToSend,
        originalContent: messageToSend !== originalMessage ? originalMessage : undefined,
        timestamp: new Date(encryptedMessage.timestamp),
        isEncrypted: true,
        isVerified: true,
        detectedLanguage
      };
      
      setMessages(prev => [...prev, chatMessage]);
      setNewMessage('');
      
      // 模拟对方回复
      setTimeout(() => {
        const responses = [
          { text: '收到你的消息了！', lang: 'zh-CN' },
          { text: 'Got your message!', lang: 'en' },
          { text: 'メッセージを受け取りました！', lang: 'ja' }
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        simulateIncomingMessage(randomResponse.text, randomResponse.lang);
      }, 1000 + Math.random() * 2000);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      addSystemMessage('❌ 消息发送失败，请重试');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleTranslation = async (messageId: string) => {
    if (!translationServiceRef.current) return;
    
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.originalContent) {
        return {
          ...msg,
          content: msg.isTranslated ? msg.originalContent : msg.content,
          isTranslated: !msg.isTranslated
        };
      }
      return msg;
    }));
  };

  // Voice recording functions
  const checkAudioPermission = async () => {
    try {
      // 检查浏览器是否支持MediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('浏览器不支持MediaDevices API');
        addSystemMessage('❌ 浏览器不支持录音功能，请使用现代浏览器');
        setAudioPermission(false);
        return false;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setAudioPermission(true);
      console.log('麦克风权限检查通过');
      return true;
    } catch (error) {
      console.error('麦克风权限检查失败:', error);
      setAudioPermission(false);
      
      let errorMessage = '无法访问麦克风';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = '麦克风权限被拒绝，请点击地址栏的麦克风图标允许访问';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '未找到麦克风设备，请检查设备是否正确连接';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '麦克风被其他应用占用，请关闭其他使用麦克风的程序';
        } else {
          errorMessage = `麦克风访问失败: ${error.message}`;
        }
      }
      
      addSystemMessage(`❌ ${errorMessage}`);
      return false;
    }
  };

  const startRealtimeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      setRealtimeTranscription('浏览器不支持语音识别');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // 优化语音识别配置
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
    recognition.maxAlternatives = 1;
    
    // 移除grammars设置以避免兼容性问题
    
    console.log('语音识别配置:', {
      continuous: recognition.continuous,
      interimResults: recognition.interimResults,
      lang: recognition.lang,
      maxAlternatives: recognition.maxAlternatives
    });
    
    recognition.onstart = () => {
      setIsRealtimeRecognitionActive(true);
      // 只有在成功启动时才清除网络错误状态
      if (networkError) {
        setNetworkError(false);
        console.log('网络连接已恢复，语音识别正常');
      }
      console.log('实时语音识别已启动');
    };
    
    recognition.onresult = (event: any) => {
      let newFinalTranscript = '';
      let interimTranscript = '';
      
      // 处理新的最终结果
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // 更新累积的最终转录结果并同时更新显示
      if (newFinalTranscript) {
        setFinalTranscription(prev => {
          const updated = prev + newFinalTranscript;
          console.log('累积最终转录:', updated);
          
          // 同时更新实时显示
          const displayText = updated + interimTranscript;
          setRealtimeTranscription(displayText);
          
          console.log('语音识别结果:', {
            resultIndex: event.resultIndex,
            resultsLength: event.results.length,
            newFinalTranscript,
            interimTranscript,
            currentFinal: updated,
            displayText,
            confidence: event.results[event.results.length - 1]?.[0]?.confidence
          });
          
          return updated;
        });
      } else {
        // 只有临时结果时，显示累积的最终结果 + 临时结果
        const displayText = finalTranscription + interimTranscript;
        setRealtimeTranscription(displayText);
        
        console.log('语音识别临时结果:', {
          resultIndex: event.resultIndex,
          resultsLength: event.results.length,
          interimTranscript,
          currentFinal: finalTranscription,
          displayText,
          confidence: event.results[event.results.length - 1]?.[0]?.confidence
        });
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      // 根据错误类型提供不同的处理
      switch (event.error) {
        case 'no-speech':
          console.log('未检测到语音，继续监听...');
          // 不设置错误信息，继续录音
          break;
        case 'audio-capture':
          setRealtimeTranscription('麦克风权限被拒绝');
          break;
        case 'not-allowed':
          setRealtimeTranscription('语音识别权限被拒绝');
          break;
        case 'aborted':
          console.log('语音识别被中断，这是正常的停止操作');
          // 对于aborted错误，不显示错误信息，因为这通常是正常的停止操作
          return; // 直接返回，不执行后续的错误处理
        case 'network':
          console.warn('网络错误，尝试重连:', event.error);
          // 只有在重试次数较少时才显示网络错误状态
           if (retryCount < 2) {
             setNetworkError(true);
             setRetryCount(prev => prev + 1);
             // 网络错误时尝试重连
             if (isRecording) {
               setTimeout(() => {
                 if (isRecording) {
                   console.log(`第${retryCount + 1}次重试语音识别...`);
                   startRealtimeSpeechRecognition();
                 }
               }, 1000 * (retryCount + 1)); // 减少延迟时间
             }
             // 5秒后自动隐藏网络重试状态
             setTimeout(() => {
               setNetworkError(false);
             }, 5000);
           } else {
             // 重试次数过多时，停止显示网络错误状态
             setNetworkError(false);
             console.log('网络重试次数过多，停止重试');
           }
          break;
        case 'service-not-allowed':
          console.warn('语音识别服务暂时不可用，继续录音');
          break;
        default:
          console.error('语音识别错误:', event.error);
          // 其他错误也不中断录音
      }
    };
    
    recognition.onend = () => {
      setIsRealtimeRecognitionActive(false);
      console.log('实时语音识别结束');
      // 如果还在录音中，重启识别
      if (isRecording) {
        console.log('录音中，重启语音识别...');
        setTimeout(() => {
          if (isRecording) {
            try {
              console.log('尝试重启语音识别...');
              startRealtimeSpeechRecognition();
            } catch (error) {
              console.error('重启语音识别失败:', error);
              // 延迟更长时间后再次尝试
              setTimeout(() => {
                if (isRecording) {
                  console.log('延迟重试语音识别...');
                  startRealtimeSpeechRecognition();
                }
              }, 1000);
            }
          }
        }, 100);
      }
    };
    
    speechRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      console.error('启动语音识别失败:', error);
      setRealtimeTranscription('启动语音识别失败');
    }
  };

  const stopRealtimeSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
    setIsRealtimeRecognitionActive(false);
  };



  const startRecording = async () => {
    const hasPermission = await checkAudioPermission();
    if (!hasPermission) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Setup audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // 检查支持的音频格式
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn('不支持 audio/webm;codecs=opus，尝试其他格式');
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        } else {
          console.error('浏览器不支持任何音频录制格式');
          throw new Error('浏览器不支持音频录制');
        }
      }
      
      console.log('使用音频格式:', mimeType);
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        console.log('录音完成:', {
          blobSize: audioBlob.size,
          mimeType: mimeType,
          duration: recordingTime
        });
        
        // Create voice message
         // 使用最终累积的转录结果，如果为空则使用实时转录结果
         const finalText = finalTranscription.trim();
         const realtimeText = realtimeTranscription.trim();
         const transcriptionText = finalText || realtimeText;
         
         console.log('创建语音消息:', {
           finalTranscription: finalText,
           realtimeTranscription: realtimeText,
           transcriptionText
         });
         const voiceMessage: ChatMessage = {
           id: Date.now().toString(),
           senderId: currentUserId,
           senderName: '我',
           content: transcriptionText || '语音消息', // 用于加密传输的内容
           timestamp: new Date(),
           isEncrypted: true,
           isVerified: true,
           type: 'voice',
           audioBlob,
           audioUrl,
           duration: recordingTime,
           transcription: transcriptionText, // 用于显示的转录内容
           isTranscribing: false
         };
         
         // Encrypt and send the voice message
         if (chatManagerRef.current) {
           try {
             const encryptedMessage = chatManagerRef.current.sendEncryptedMessage(
               voiceMessage.content,
               currentUserId,
               targetUserId
             );
             
             // Update message with encrypted message ID
             voiceMessage.id = encryptedMessage.id;
             voiceMessage.timestamp = new Date(encryptedMessage.timestamp);
             
             setMessages(prev => [...prev, voiceMessage]);
             
             // Simulate response
             setTimeout(() => {
               simulateIncomingMessage(voiceMessage.content, 'zh-CN');
             }, 1000);
           } catch (error) {
             console.error('Failed to encrypt voice message:', error);
             addSystemMessage('❌ 语音消息发送失败，请重试');
           }
         }
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRealtimeTranscription('');
      setFinalTranscription(''); // 重置累积的最终转录结果
      
      // Start realtime speech recognition
      startRealtimeSpeechRecognition();
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('录音启动失败:', error);
      setAudioPermission(false);
      
      // 提供更详细的错误信息
      let errorMessage = '录音功能启动失败';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = '麦克风权限被拒绝，请允许网站访问麦克风';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '未找到麦克风设备，请检查设备连接';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = '浏览器不支持录音功能，请使用现代浏览器';
        } else if (error.message.includes('音频录制')) {
          errorMessage = error.message;
        } else {
          errorMessage = `录音失败: ${error.message}`;
        }
      }
      
      addSystemMessage(`❌ ${errorMessage}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('开始停止录音流程');
      
      // 先停止MediaRecorder，这会触发onstop事件
      mediaRecorderRef.current.stop();
      
      // 立即设置录音状态为false，防止重复调用
      setIsRecording(false);
      
      // 清除录音计时器
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // 停止实时语音识别
      stopRealtimeSpeechRecognition();
      
      // 清除网络错误状态和转录状态
      setNetworkError(false);
      setRetryCount(0);
      
      console.log('停止录音，最终转录结果:', {
        finalTranscription,
        realtimeTranscription
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isRecording || encryptionStatus !== 'connected') return;
    
    // 记录触摸起始位置
    if ('touches' in e && e.touches.length > 0) {
      setTouchStartY(e.touches[0].clientY);
      setCurrentTouchY(e.touches[0].clientY);
    }
    
    setIsPressing(true);
    setPressStartTime(Date.now());
    setIsCancellingVoice(false);
    
    // 设置0.2秒延迟开始录音
    pressTimerRef.current = setTimeout(() => {
      // 检查是否仍在按住状态（通过检查计时器是否被清除）
      if (pressTimerRef.current) {
        startRecording();
      }
    }, 200);
  };

  const handlePressEnd = () => {
    setIsPressing(false);
    setPressStartTime(null);
    
    // 清除延迟计时器
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
      // 延迟时间内松开，取消录音启动
      resetTouchState();
      return;
    }
    
    // 如果正在录音，检查是否需要取消
    if (isRecording) {
      const deltaY = touchStartY && currentTouchY ? touchStartY - currentTouchY : 0;
      
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
  
  const resetTouchState = () => {
    setTouchStartY(null);
    setCurrentTouchY(null);
    setIsCancellingVoice(false);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPressing || !touchStartY || e.touches.length === 0) return;
    
    const currentY = e.touches[0].clientY;
    setCurrentTouchY(currentY);
    
    const deltaY = touchStartY - currentY;
    
    // 如果向上滑动超过50px，标记为取消状态
    if (deltaY > 50) {
      setIsCancellingVoice(true);
    } else {
      setIsCancellingVoice(false);
    }
  };
  
  const cancelRecording = () => {
    console.log('开始取消录音流程');
    
    if (isRecording) {
      // 停止录音但不发送消息
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        // 临时保存onstop处理函数
        const originalOnStop = mediaRecorderRef.current.onstop;
        
        // 重写onstop函数，取消时不发送消息
        mediaRecorderRef.current.onstop = () => {
          console.log('录音取消 - 清理资源但不发送消息');
          
          // 清理媒体流
          if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
          
          // 清理音频上下文
          if (audioContextRef.current) {
            audioContextRef.current.close();
          }
          
          // 清空音频数据
          audioChunksRef.current = [];
        };
        
        mediaRecorderRef.current.stop();
      }
      
      // 停止语音识别
      stopRealtimeSpeechRecognition();
      
      // 清理录音状态
      setIsRecording(false);
      setRecordingTime(0);
      setRealtimeTranscription('');
      setFinalTranscription('');
      setIsRealtimeRecognitionActive(false);
      
      // 清除计时器
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // 清除网络错误状态
      setNetworkError(false);
      setRetryCount(0);
      
      console.log('录音已取消');
      addSystemMessage('🚫 录音已取消');
    }
  };

  // 转录已存在的语音消息
  const transcribeExistingVoiceMessage = async (message: ChatMessage) => {
    console.log('开始转录已存在的语音消息:', message.id);
    
    // 更新消息状态为转录中
    setMessages(prev => prev.map(msg => 
      msg.id === message.id 
        ? { ...msg, isTranscribing: true }
        : msg
    ));
    
    try {
      // 检查浏览器是否支持语音识别
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('浏览器不支持语音识别');
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, isTranscribing: false, transcription: '[浏览器不支持语音识别功能]' }
            : msg
        ));
        return;
      }
      
      // 创建音频URL并播放以进行识别
      const audioUrl = message.audioUrl!;
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
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        recognition.stop();
        audio.pause();
      }, 30000); // 30秒超时

      recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // 更新实时转录结果
        const currentTranscript = finalTranscript + interimTranscript;
        if (currentTranscript.trim()) {
          setMessages(prev => prev.map(msg => 
            msg.id === message.id 
              ? { ...msg, transcription: currentTranscript }
              : msg
          ));
        }
      };

      recognition.onend = () => {
        clearTimeout(timeoutId);
        audio.pause();
        
        // 更新最终转录结果
        if (finalTranscript.trim()) {
          setMessages(prev => prev.map(msg => 
            msg.id === message.id 
              ? { ...msg, isTranscribing: false, transcription: finalTranscript.trim() }
              : msg
          ));
        } else {
          setMessages(prev => prev.map(msg => 
            msg.id === message.id 
              ? { ...msg, isTranscribing: false, transcription: '无法识别语音内容' }
              : msg
          ));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        clearTimeout(timeoutId);
        audio.pause();
        
        let errorMessage = '语音识别失败';
        switch (event.error) {
          case 'no-speech':
            errorMessage = '未检测到语音内容';
            break;
          case 'audio-capture':
            errorMessage = '音频捕获失败';
            break;
          case 'not-allowed':
            errorMessage = '语音识别权限被拒绝';
            break;
          case 'network':
            errorMessage = '网络错误，语音识别不可用';
            break;
          case 'aborted':
            console.log('语音识别被中断，这是正常的停止操作');
            return; // 不显示错误信息
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, isTranscribing: false, transcription: `[${errorMessage}]` }
            : msg
        ));
      };
      
      // 开始播放音频和识别
      audio.play();
      recognition.start();
      
    } catch (error) {
      console.error('语音转文本失败:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, isTranscribing: false, transcription: '语音处理异常' }
          : msg
      ));
    }
  };

  const playAudio = (messageId: string, audioUrl: string) => {
    if (currentPlayingId === messageId) {
      // Stop current audio
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      setCurrentPlayingId(null);
    } else {
      // Play new audio
      const audio = new Audio(audioUrl);
      audio.onended = () => setCurrentPlayingId(null);
      audio.play();
      setCurrentPlayingId(messageId);
    }
  };

  const getEncryptionStatusIcon = () => {
    switch (encryptionStatus) {
      case 'connecting':
        return <Key className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'connected':
        return <ShieldCheck className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEncryptionStatusText = () => {
    switch (encryptionStatus) {
      case 'connecting':
        return '正在建立加密连接...';
      case 'connected':
        return '端到端加密已启用';
      case 'error':
        return '加密连接失败';
      default:
        return '未知状态';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <img
            src={targetUserAvatar}
            alt={targetUserName}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{targetUserName}</h3>
            <div className="flex items-center space-x-2 text-sm">
              {getEncryptionStatusIcon()}
              <span className={`${
                encryptionStatus === 'connected' ? 'text-green-600' :
                encryptionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {getEncryptionStatusText()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTranslationSettings(!showTranslationSettings)}
            className={`p-2 rounded-lg transition-colors ${
              autoTranslate ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            } hover:bg-blue-200`}
            title="翻译设置"
          >
            <Globe className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowEncryptionDetails(!showEncryptionDetails)}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="加密详情"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 翻译设置面板 */}
      {showTranslationSettings && (
        <div className="p-3 bg-blue-50 border-b border-blue-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-900">实时翻译设置</h4>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-blue-800">启用自动翻译</span>
            </label>
          </div>
          
          {autoTranslate && (
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                翻译目标语言:
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {supportedLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* 加密详情面板 */}
      {showEncryptionDetails && (
        <div className="p-3 bg-green-50 border-b border-green-200 flex-shrink-0">
          <h4 className="font-medium text-green-900 mb-3">加密详情</h4>
          <div className="space-y-2 text-sm text-green-800">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>使用 AES-256 加密算法</span>
            </div>
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>端到端加密，服务器无法读取消息内容</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>消息完整性验证已启用</span>
            </div>
            {chatIdRef.current && (
              <div className="mt-2 p-2 bg-green-100 rounded text-xs font-mono">
                聊天ID: {chatIdRef.current}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === 'system'
                  ? 'bg-yellow-100 text-yellow-800 text-center text-sm'
                  : message.senderId === currentUserId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {message.senderId !== 'system' && (
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs opacity-75">{message.senderName}</span>
                  {message.isEncrypted && (
                    <div className="flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      {message.isVerified ? (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  )}
                  {message.isTranslated && (
                    <Globe className="w-3 h-3 text-blue-400" />
                  )}
                </div>
              )}
              
              {message.type === 'voice' ? (
                 <div className="space-y-2">
                   <div className="flex items-center space-x-2">
                     <button
                       onClick={() => playAudio(message.id, message.audioUrl!)}
                       className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                     >
                       {currentPlayingId === message.id ? (
                         <Pause className="w-4 h-4" />
                       ) : (
                         <Play className="w-4 h-4" />
                       )}
                       <Volume2 className="w-4 h-4" />
                     </button>
                     {message.duration && (
                       <span className="text-xs opacity-75">
                         {formatTime(message.duration)}
                       </span>
                     )}
                   </div>
                   <div className="text-sm opacity-90">
                     {message.transcription && message.transcription.trim() ? message.transcription : '点击播放语音消息'}
                   </div>
                   
                   {/* 转录按钮 */}
                   {!message.transcription && !message.isTranscribing && (
                     <button
                       onClick={() => transcribeExistingVoiceMessage(message)}
                       className="mt-2 p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                       title="转录语音为文字"
                     >
                       <FileText className="w-4 h-4" />
                     </button>
                   )}
                   
                   {/* 转录中状态 */}
                   {message.isTranscribing && (
                     <div className="mt-2 text-xs opacity-75 italic flex items-center gap-1">
                       <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                       转换中...
                     </div>
                   )}
                 </div>
               ) : (
                  <div>{message.content}</div>
                )}
              
              {message.originalContent && (
                <button
                  onClick={() => toggleTranslation(message.id)}
                  className="mt-1 text-xs opacity-75 hover:opacity-100 flex items-center space-x-1"
                >
                  {message.isTranslated ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{message.isTranslated ? '显示原文' : '显示翻译'}</span>
                </button>
              )}
              
              <div className="text-xs opacity-50 mt-1">
                {message.timestamp.toLocaleTimeString()}
                {message.detectedLanguage && (
                  <span className="ml-2">({message.detectedLanguage})</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 语音录制状态显示 */}
      {isRecording && (
        <div className={`p-3 border-t border-l-4 flex-shrink-0 transition-colors ${
          isCancellingVoice 
            ? 'bg-yellow-50 border-yellow-200 border-l-yellow-500' 
            : 'bg-red-50 border-red-200 border-l-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                isCancellingVoice ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className={`font-medium ${
                isCancellingVoice ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {isCancellingVoice 
                  ? '松开取消录音' 
                  : '录音中...'
                }
              </span>
              {!isCancellingVoice && (
                <span className="text-red-600">{formatTime(recordingTime)}</span>
              )}
              {networkError && (
                <span className="text-xs text-orange-600 ml-2">
                  网络重连中...
                </span>
              )}
            </div>
            <button
              onClick={stopRecording}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                isCancellingVoice 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
          {isCancellingVoice && (
            <div className="mt-2 p-2 bg-yellow-100 rounded border text-sm text-yellow-700">
              <span className="font-medium">👆 向上滑动取消录音</span>
            </div>
          )}
          {realtimeTranscription && !isCancellingVoice && (
            <div className="mt-2 p-2 bg-white rounded border text-sm text-gray-700">
              <span className="text-gray-500">识别中: </span>
              {realtimeTranscription}
            </div>
          )}
        </div>
      )}

      {/* 消息输入 */}
      <div className="p-3 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入加密消息..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={encryptionStatus !== 'connected' || isRecording}
            />
            {isEncryptionEnabled && (
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
          </div>
          
          {/* 语音录制按钮 */}
            <button
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              onTouchMove={handleTouchMove}
              disabled={encryptionStatus !== 'connected'}
              className={`p-3 rounded-lg transition-colors select-none ${
                isRecording 
                  ? isCancellingVoice
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                  : isPressing
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              title={
                isPressing 
                  ? isRecording 
                    ? isCancellingVoice 
                      ? '向上滑动取消录音'
                      : '录音中... 松开发送，向上滑动取消'
                    : '准备录音...'
                  : '按住录音'
              }
            >
              {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || encryptionStatus !== 'connected' || isRecording}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
          <Shield className="w-3 h-3" />
          <span>消息已端到端加密</span>
          {autoTranslate && (
            <>
              <span>•</span>
              <Globe className="w-3 h-3" />
              <span>自动翻译已启用</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EncryptedChat;