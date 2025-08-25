import React, { useState, useEffect } from 'react';
import { Languages, Volume2, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { TranslationConfig } from './TranslationSettings';

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

interface TranslationDisplayProps {
  messages: TranslatedMessage[];
  settings: TranslationConfig;
  onToggleVisibility: () => void;
  isVisible: boolean;
}

const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  messages,
  settings,
  onToggleVisibility,
  isVisible
}) => {
  const [filteredMessages, setFilteredMessages] = useState<TranslatedMessage[]>([]);

  useEffect(() => {
    // 根据设置过滤消息
    const filtered = messages.filter(msg => {
      if (!settings.enabled) return false;
      if (msg.type === 'danmaku' && !settings.danmakuTranslation) return false;
      if (msg.type === 'voice' && !settings.voiceTranslation) return false;
      return true;
    });
    
    // 只保留最近的20条消息
    setFilteredMessages(filtered.slice(-20));
  }, [messages, settings]);

  const getLanguageFlag = (langCode: string) => {
    const flags: { [key: string]: string } = {
      'zh': '🇨🇳',
      'en': '🇺🇸',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'ru': '🇷🇺',
      'ar': '🇸🇦',
      'th': '🇹🇭',
      'vi': '🇻🇳'
    };
    return flags[langCode] || '🌐';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!settings.enabled || !isVisible) return null;

  const renderOverlayMode = () => (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* 弹幕翻译覆盖层 */}
      {filteredMessages
        .filter(msg => msg.type === 'danmaku')
        .slice(-5)
        .map((msg, index) => (
          <div
            key={msg.id}
            className="absolute animate-fade-in"
            style={{
              top: `${20 + index * 8}%`,
              right: '10px',
              maxWidth: '40%'
            }}
          >
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-blue-400">
                  {getLanguageFlag(msg.sourceLanguage)} → {getLanguageFlag(msg.targetLanguage)}
                </span>
                <MessageCircle className="w-3 h-3 text-blue-400" />
                {msg.username && (
                  <span className="text-xs text-gray-300">{msg.username}</span>
                )}
              </div>
              
              {settings.showOriginal && (
                <p className="text-xs text-gray-400 mb-1">{msg.originalText}</p>
              )}
              
              <p className="text-sm text-white font-medium">{msg.translatedText}</p>
              
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${getConfidenceColor(msg.confidence)}`}>
                  {Math.round(msg.confidence * 100)}%
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))
      }

      {/* 语音翻译字幕 */}
      {filteredMessages
        .filter(msg => msg.type === 'voice')
        .slice(-1)
        .map((msg) => (
          <div
            key={msg.id}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-fade-in"
          >
            <div className="bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-green-500/30 max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400">
                  {getLanguageFlag(msg.sourceLanguage)} → {getLanguageFlag(msg.targetLanguage)}
                </span>
                <span className="text-xs text-gray-400">语音翻译</span>
              </div>
              
              {settings.showOriginal && (
                <p className="text-sm text-gray-400 mb-2">{msg.originalText}</p>
              )}
              
              <p className="text-lg text-white font-medium text-center">{msg.translatedText}</p>
              
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className={`text-xs ${getConfidenceColor(msg.confidence)}`}>
                  准确度: {Math.round(msg.confidence * 100)}%
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );

  const renderSideMode = () => (
    <div className="absolute left-4 top-20 bottom-20 w-80 pointer-events-auto z-30">
      <div className="h-full bg-black/80 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        {/* 头部 */}
        <div className="p-3 border-b border-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-blue-400" />
            <span className="text-white text-sm font-medium">实时翻译</span>
          </div>
          <button
            onClick={onToggleVisibility}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* 翻译消息列表 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {filteredMessages.map((msg) => (
            <div key={msg.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                {msg.type === 'danmaku' ? (
                  <MessageCircle className="w-3 h-3 text-blue-400" />
                ) : (
                  <Volume2 className="w-3 h-3 text-green-400" />
                )}
                <span className="text-xs text-gray-400">
                  {getLanguageFlag(msg.sourceLanguage)} → {getLanguageFlag(msg.targetLanguage)}
                </span>
                {msg.username && (
                  <span className="text-xs text-gray-300">{msg.username}</span>
                )}
                <span className="text-xs text-gray-500 ml-auto">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              
              {settings.showOriginal && (
                <p className="text-xs text-gray-400 mb-2 p-2 bg-gray-700/50 rounded">
                  {msg.originalText}
                </p>
              )}
              
              <p className="text-sm text-white">{msg.translatedText}</p>
              
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${getConfidenceColor(msg.confidence)}`}>
                  准确度: {Math.round(msg.confidence * 100)}%
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  msg.type === 'danmaku' ? 'bg-blue-600/20 text-blue-400' : 'bg-green-600/20 text-green-400'
                }`}>
                  {msg.type === 'danmaku' ? '弹幕' : '语音'}
                </span>
              </div>
            </div>
          ))}
          
          {filteredMessages.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无翻译内容</p>
              <p className="text-xs mt-1">开始聊天或语音即可看到翻译</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBottomMode = () => (
    <div className="absolute bottom-4 left-4 right-4 pointer-events-auto z-30">
      <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-blue-400" />
            <span className="text-white text-sm font-medium">实时翻译</span>
          </div>
          <button
            onClick={onToggleVisibility}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="max-h-32 overflow-y-auto space-y-2">
          {filteredMessages.slice(-3).map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 p-2 bg-gray-800/50 rounded">
              <div className="flex-shrink-0">
                {msg.type === 'danmaku' ? (
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-green-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">
                    {getLanguageFlag(msg.sourceLanguage)} → {getLanguageFlag(msg.targetLanguage)}
                  </span>
                  {msg.username && (
                    <span className="text-xs text-gray-300">{msg.username}</span>
                  )}
                  <span className={`text-xs ${getConfidenceColor(msg.confidence)}`}>
                    {Math.round(msg.confidence * 100)}%
                  </span>
                </div>
                
                {settings.showOriginal && (
                  <p className="text-xs text-gray-400 mb-1">{msg.originalText}</p>
                )}
                
                <p className="text-sm text-white">{msg.translatedText}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 根据显示模式渲染不同的UI
  switch (settings.displayMode) {
    case 'overlay':
      return renderOverlayMode();
    case 'side':
      return renderSideMode();
    case 'bottom':
      return renderBottomMode();
    default:
      return renderOverlayMode();
  }
};

export default TranslationDisplay;