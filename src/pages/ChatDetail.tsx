import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, Languages, MoreHorizontal, Shield, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';
import EnhancedChat from '../components/EnhancedChat';
import EncryptedChat from '../components/EncryptedChat';
import CallInterface from '../components/CallInterface';
import callService, { CallUser } from '../services/callService';
import { useNavigate, useParams } from 'react-router-dom';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'voice' | 'image';
  isTranslated?: boolean;
  originalText?: string;
  translatedText?: string;
  targetLanguage?: string;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  language: string;
}

const ChatDetail: React.FC = () => {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  
  // 设置聊天状态，隐藏导航菜单
  useEffect(() => {
    localStorage.setItem('chat_active', 'true');
    
    return () => {
      localStorage.removeItem('chat_active');
    };
  }, []);
  const [chatMembers, setChatMembers] = useState([
    {
      id: '1',
      name: '张小美',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20asian%20girl%20avatar%20profile%20picture&image_size=square',
      role: 'admin' as const,
      isOnline: true
    },
    {
      id: '2', 
      name: '李明',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=handsome%20asian%20man%20avatar%20profile%20picture&image_size=square',
      role: 'member' as const,
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000)
    }
  ]);

  // 模拟用户数据
  const currentUser: User = {
    id: 'current-user',
    name: '我',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=current%20user%20avatar&image_size=square',
    isOnline: true,
    language: 'zh-CN'
  };

  const otherUser: User = {
    id: chatId || '1',
    name: chatId === '1' ? '小明' : chatId === '2' ? '美食达人' : '旅行摄影师',
    avatar: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${chatId === '1' ? 'young%20man' : chatId === '2' ? 'chef' : 'photographer'}%20avatar&image_size=square`,
    isOnline: true,
    language: 'en'
  };

  // 支持的语言
  const languages = [
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  // 翻译相关状态
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('zh-CN');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isEncryptedMode, setIsEncryptedMode] = useState(false);
  const [showEncryptionMenu, setShowEncryptionMenu] = useState(false);
  
  // 语音转文本事件监听
  useEffect(() => {
    const handleVoiceTranscription = (event: CustomEvent) => {
      const { audioUrl, transcription } = event.detail;
      
      setMessages(prev => prev.map(msg => {
        if (msg.audioUrl === audioUrl || msg.fileUrl === audioUrl) {
          return {
            ...msg,
            transcription,
            isTranscribing: false,
            isTranslating: true
          };
        }
        return msg;
      }));
    };
    
    // 监听语音翻译完成事件
    const handleVoiceTranslation = (event: CustomEvent) => {
      const { audioUrl, translatedText } = event.detail;
      setMessages(prev => prev.map(msg => {
        if (msg.audioUrl === audioUrl || msg.fileUrl === audioUrl) {
          return {
            ...msg,
            translatedText,
            isTranslating: false
          };
        }
        return msg;
      }));
    };
    
    // 监听转录状态更新事件
    const handleTranscribingUpdate = (event: CustomEvent) => {
      const { audioUrl, isTranscribing } = event.detail;
      setMessages(prev => prev.map(msg => {
        if (msg.audioUrl === audioUrl || msg.fileUrl === audioUrl) {
          return {
            ...msg,
            isTranscribing
          };
        }
        return msg;
      }));
    };
    
    // 监听实时转录文本更新事件
    const handleRealtimeTranscript = (event: CustomEvent) => {
      const { audioUrl, realtimeTranscript } = event.detail;
      setMessages(prev => prev.map(msg => {
        if (msg.audioUrl === audioUrl || msg.fileUrl === audioUrl) {
          return {
            ...msg,
            realtimeTranscript
          };
        }
        return msg;
      }));
    };
    
    window.addEventListener('voiceTranscriptionComplete', handleVoiceTranscription as EventListener);
    window.addEventListener('voiceTranslationComplete', handleVoiceTranslation as EventListener);
    window.addEventListener('updateMessageTranscribing', handleTranscribingUpdate as EventListener);
    window.addEventListener('updateMessageRealtimeTranscript', handleRealtimeTranscript as EventListener);
    
    return () => {
      window.removeEventListener('voiceTranscriptionComplete', handleVoiceTranscription as EventListener);
      window.removeEventListener('voiceTranslationComplete', handleVoiceTranslation as EventListener);
      window.removeEventListener('updateMessageTranscribing', handleTranscribingUpdate as EventListener);
      window.removeEventListener('updateMessageRealtimeTranscript', handleRealtimeTranscript as EventListener);
    };
  }, []);

  const [messages, setMessages] = useState<any[]>([
    {
      id: '1',
      senderId: 'user1',
      senderName: '张小美',
      senderAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20asian%20girl%20avatar%20profile%20picture&image_size=square',
      content: '你好！今天过得怎么样？',
      type: 'text',
      timestamp: new Date(Date.now() - 3600000),
      status: 'read',
      isEncrypted: true
    },
    {
      id: '2',
      senderId: 'current',
      senderName: '我',
      senderAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20profile%20picture&image_size=square',
      content: '还不错，刚看了一个很有趣的视频',
      type: 'text',
      timestamp: new Date(Date.now() - 3000000),
      status: 'read',
      isEncrypted: true
    },
    {
      id: '3',
      senderId: 'user1',
      senderName: '张小美',
      senderAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20asian%20girl%20avatar%20profile%20picture&image_size=square',
      content: '什么视频？分享一下呗',
      type: 'text',
      timestamp: new Date(Date.now() - 2400000),
      status: 'read',
      isEncrypted: true
    },
    {
      id: '4',
      senderId: 'current',
      senderName: '我',
      senderAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20profile%20picture&image_size=square',
      content: '是一个关于AI技术的科普视频，很有意思',
      type: 'text',
      timestamp: new Date(Date.now() - 1800000),
      status: 'delivered',
      isEncrypted: true
    }
  ]);

  const handleSendMessage = (content: string, type: 'text' | 'voice' | 'image', file?: File, transcription?: string) => {
    const newMessage: any = {
      id: Date.now().toString(),
      senderId: 'current',
      senderName: '我',
      senderAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20profile%20picture&image_size=square',
      content,
      type: type,
      timestamp: new Date(),
      status: 'sending',
      isEncrypted: true
    };
    
    // 处理语音消息的特殊属性
    if (type === 'voice' && file) {
      const extendedFile = file as any;
      newMessage.audioUrl = extendedFile.audioUrl || extendedFile.fileUrl;
      newMessage.fileUrl = extendedFile.audioUrl || extendedFile.fileUrl;
      newMessage.duration = extendedFile.duration || 0;
      newMessage.fileName = file.name;
      newMessage.fileSize = file.size;
      newMessage.isTranscribing = extendedFile.isTranscribing || false;
      newMessage.isTranslating = false;
      
      // 如果有转录文本，直接设置到消息中
      if (transcription) {
        newMessage.transcription = transcription;
        newMessage.isTranscribing = false;
      }
      
      console.log('处理语音消息:', {
        audioUrl: newMessage.audioUrl,
        duration: newMessage.duration,
        fileSize: newMessage.fileSize,
        isTranscribing: newMessage.isTranscribing,
        transcription: newMessage.transcription
      });
    }
    
    // 处理其他文件类型
    if (file && type !== 'voice') {
      newMessage.fileUrl = URL.createObjectURL(file);
      newMessage.fileName = file.name;
      newMessage.fileSize = file.size;
    }
    
    setMessages(prev => [...prev, newMessage]);
    
    // 模拟发送状态更新
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'delivered' as const }
          : msg
      ));
    }, 1000);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleSearchMessages = (query: string) => {
    console.log('搜索消息:', query);
    // 实现消息搜索逻辑
  };

  const handleAddMember = (userId: string) => {
    console.log('添加成员:', userId);
    // 实现添加成员逻辑
  };

  const handleRemoveMember = (userId: string) => {
    setChatMembers(prev => prev.filter(member => member.id !== userId));
  };

  const handleLeaveGroup = () => {
    console.log('退出群聊');
    navigate('/messages');
  };

  const toggleTranslation = (messageId: string) => {
    console.log('切换翻译:', messageId);
    // 实现翻译切换逻辑
    toast.success('翻译已切换');
  };

  // 通话相关状态
  const [showCallInterface, setShowCallInterface] = useState(false);

  // 新增事件处理函数
  const handlePhoneCall = async () => {
    try {
      const remoteUser: CallUser = {
        id: otherUser.id,
        name: otherUser.name,
        avatar: otherUser.avatar
      };
      
      setShowCallInterface(true);
      await callService.initiateCall(remoteUser, 'voice');
    } catch (error) {
      console.error('发起语音通话失败:', error);
      toast.error('发起语音通话失败');
      setShowCallInterface(false);
    }
  };

  const handleVideoCall = async () => {
    try {
      const remoteUser: CallUser = {
        id: otherUser.id,
        name: otherUser.name,
        avatar: otherUser.avatar
      };
      
      setShowCallInterface(true);
      await callService.initiateCall(remoteUser, 'video');
    } catch (error) {
      console.error('发起视频通话失败:', error);
      toast.error('发起视频通话失败');
      setShowCallInterface(false);
    }
  };

  // 关闭通话界面
  const handleCloseCall = () => {
    setShowCallInterface(false);
  };

  const handleMoreOptions = () => {
    toast.success('打开更多选项');
  };



  const renderMessage = (message: Message) => {
    const isCurrentUser = message.senderId === currentUser.id;
    const user = isCurrentUser ? currentUser : otherUser;

    return (
      <div key={message.id} className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        {!isCurrentUser && (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
          />
        )}
        
        <div className={`max-w-[70%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
          <div
            className={`px-4 py-2 rounded-2xl ${isCurrentUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-200 text-gray-800 rounded-bl-md'
            }`}
          >
            <p className="text-sm">{message.content}</p>
            
            {/* 翻译功能 */}
            {message.isTranslated && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs opacity-75 flex items-center gap-1">
                    <Languages size={12} />
                    翻译
                  </span>
                  <button
                    onClick={() => toggleTranslation(message.id)}
                    className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                  >
                    显示原文
                  </button>
                </div>
                <p className="text-xs opacity-90">
                  {message.translatedText || message.originalText}
                </p>
              </div>
            )}
          </div>
          
          <div className={`flex items-center mt-1 text-xs text-gray-500 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <span>{new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
            {message.isTranslated && (
              <Languages className="w-3 h-3 ml-1 text-blue-500" />
            )}
          </div>
        </div>
        
        {isCurrentUser && (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover ml-2 flex-shrink-0"
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex items-center gap-1">
              <div className="relative">
                <img
                  src={otherUser.avatar}
                  alt={otherUser.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                {otherUser.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div>
                <h2 className="font-medium text-gray-800 text-sm">{otherUser.name}</h2>
                <p className="text-xs text-gray-500">
                  {otherUser.isOnline ? '在线' : '离线'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 翻译设置 */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className={`p-1.5 rounded-full transition-colors ${
                  autoTranslate ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="翻译设置"
              >
                <Languages size={18} />
              </button>
              
              {showLanguageMenu && (
                <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border p-3 w-64 z-10">
                  <div className="mb-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={autoTranslate}
                        onChange={(e) => setAutoTranslate(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">自动翻译</span>
                    </label>
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      翻译目标语言
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setTargetLanguage(lang.code);
                            setShowLanguageMenu(false);
                          }}
                          className={`p-2 text-sm rounded border transition-colors ${
                            targetLanguage === lang.code
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {lang.flag} {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 加密聊天切换 */}
            <div className="relative">
              <button
                onClick={() => setShowEncryptionMenu(!showEncryptionMenu)}
                className={`p-1.5 rounded-full transition-colors ${
                  isEncryptedMode ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="加密聊天"
              >
                {isEncryptedMode ? <ShieldCheck size={18} /> : <Shield size={18} />}
              </button>
              
              {showEncryptionMenu && (
                <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border p-3 w-64 z-10">
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Lock size={16} />
                      端到端加密
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      启用后，您的消息将使用端到端加密保护，只有您和对方能够阅读。
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setIsEncryptedMode(true);
                        setShowEncryptionMenu(false);
                      }}
                      className={`w-full p-2 text-sm rounded border transition-colors ${
                        isEncryptedMode
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-green-50'
                      }`}
                    >
                      🔒 启用加密聊天
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsEncryptedMode(false);
                        setShowEncryptionMenu(false);
                      }}
                      className={`w-full p-2 text-sm rounded border transition-colors ${
                        !isEncryptedMode
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-blue-50'
                      }`}
                    >
                      💬 普通聊天
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={handlePhoneCall}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Phone size={18} className="text-gray-600" />
            </button>
            
            <button 
              onClick={handleVideoCall}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Video size={18} className="text-gray-600" />
            </button>
            
            <button 
              onClick={handleMoreOptions}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal size={18} className="text-gray-600" />
            </button>
            

          </div>
        </div>
      </div>

      {/* Chat Component */}
      <div className="flex-1 overflow-hidden">
        {isEncryptedMode ? (
          <EncryptedChat
            currentUserId="current"
            targetUserId={otherUser.id}
            targetUserName={otherUser.name}
            targetUserAvatar={otherUser.avatar}
            onClose={() => setIsEncryptedMode(false)}
          />
        ) : (
          <EnhancedChat
            chatId="chat1"
            chatName="张小美"
            isGroup={false}
            members={chatMembers}
            currentUserId="current"
            messages={messages}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onSearchMessages={handleSearchMessages}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onLeaveGroup={handleLeaveGroup}
          />
        )}
      </div>
      
      {/* 通话界面 */}
      {showCallInterface && (
        <CallInterface onClose={handleCloseCall} />
      )}
    </div>
  );
};

export default ChatDetail;