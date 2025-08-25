import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, Settings, Mic, MessageSquare } from 'lucide-react';
import { ttsService, TTSConfig, TTSQueueItem } from '../utils/ttsService';
import { ttsUtils } from '../utils/ttsService';
import VoiceSettings from './VoiceSettings';

interface VoiceGeneratorProps {
  // 是否启用语音生成
  enabled?: boolean;
  // 语音生成模式
  mode?: 'subtitle' | 'comment' | 'chat' | 'all';
  // 自动播放新内容
  autoPlay?: boolean;
  // 最大队列长度
  maxQueueLength?: number;
  // 样式类名
  className?: string;
  // 事件回调
  onVoiceStart?: (text: string) => void;
  onVoiceEnd?: (text: string) => void;
  onError?: (error: string) => void;
}

interface VoiceItem {
  id: string;
  text: string;
  type: 'subtitle' | 'comment' | 'chat' | 'system';
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
}

export interface VoiceGeneratorRef {
  addToQueue: (text: string, type: 'subtitle' | 'comment' | 'chat' | 'system', priority?: 'high' | 'medium' | 'low') => void;
  addSubtitle: (text: string) => void;
  addComment: (text: string) => void;
  addChat: (text: string) => void;
  addSystem: (text: string) => void;
  togglePlayback: () => void;
  stopPlayback: () => void;
  clearQueue: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  clear: () => void;
  setEnabled: (enabled: boolean) => void;
  getStats: () => { totalPlayed: number; totalDuration: number; queueLength: number; };
  isPlaying: boolean;
}

const VoiceGenerator = forwardRef<VoiceGeneratorRef, VoiceGeneratorProps>((props, ref) => {
  const {
    enabled = true,
    mode = 'all',
    autoPlay = true,
    maxQueueLength = 10,
    className = '',
    onVoiceStart,
    onVoiceEnd,
    onError
  } = props;
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentItem, setCurrentItem] = useState<VoiceItem | null>(null);
  const [queue, setQueue] = useState<VoiceItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<TTSConfig>(ttsService.getConfig());
  const [stats, setStats] = useState({
    totalPlayed: 0,
    totalDuration: 0,
    queueLength: 0
  });
  
  const queueRef = useRef<VoiceItem[]>([]);
  const processingRef = useRef(false);

  // 初始化TTS事件监听
  useEffect(() => {
    const handleItemStarted = (item: TTSQueueItem) => {
      setIsPlaying(true);
      const voiceItem = queueRef.current.find(v => v.text === item.text);
      if (voiceItem) {
        setCurrentItem(voiceItem);
        onVoiceStart?.(item.text);
      }
    };

    const handleItemEnded = (item: TTSQueueItem) => {
      setIsPlaying(false);
      setCurrentItem(null);
      onVoiceEnd?.(item.text);
      
      // 更新统计
      setStats(prev => ({
        ...prev,
        totalPlayed: prev.totalPlayed + 1
      }));
      
      // 从队列中移除已播放的项
      const updatedQueue = queueRef.current.filter(v => v.text !== item.text);
      queueRef.current = updatedQueue;
      setQueue([...updatedQueue]);
    };

    const handleItemError = ({ item, error }: { item: TTSQueueItem; error: any }) => {
      setIsPlaying(false);
      setCurrentItem(null);
      onError?.(`语音播放错误: ${error}`);
    };

    const handleQueueUpdated = (ttsQueue: TTSQueueItem[]) => {
      setStats(prev => ({
        ...prev,
        queueLength: ttsQueue.length
      }));
    };

    // 注册事件监听
    ttsService.on('itemStarted', handleItemStarted);
    ttsService.on('itemEnded', handleItemEnded);
    ttsService.on('itemError', handleItemError);
    ttsService.on('queueUpdated', handleQueueUpdated);

    return () => {
      ttsService.off('itemStarted', handleItemStarted);
      ttsService.off('itemEnded', handleItemEnded);
      ttsService.off('itemError', handleItemError);
      ttsService.off('queueUpdated', handleQueueUpdated);
    };
  }, [onVoiceStart, onVoiceEnd, onError]);

  // 添加语音项到队列
  const addToQueue = (text: string, type: VoiceItem['type'], priority: 'high' | 'medium' | 'low' = 'medium') => {
    if (!isEnabled || !text.trim()) return;

    // 检查模式过滤
    if (mode !== 'all') {
      if (mode === 'subtitle' && type !== 'subtitle') return;
      if (mode === 'comment' && type !== 'comment') return;
      if (mode === 'chat' && type !== 'chat') return;
    }

    // 清理和处理文本
    const cleanedText = ttsUtils.cleanText(text);
    if (!cleanedText) return;

    // 检测语言并分割长文本
    const detectedLang = ttsUtils.detectLanguage(cleanedText);
    const textChunks = ttsUtils.splitLongText(cleanedText, 200);

    textChunks.forEach((chunk, index) => {
      const voiceItem: VoiceItem = {
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
        text: chunk,
        type,
        timestamp: Date.now(),
        priority
      };

      // 添加到内部队列
      queueRef.current.push(voiceItem);
      
      // 限制队列长度
      if (queueRef.current.length > maxQueueLength) {
        queueRef.current.shift();
      }
      
      setQueue([...queueRef.current]);

      // 添加到TTS服务队列
      if (autoPlay) {
        const voiceConfig = detectedLang !== config.lang ? 
          { ...config, lang: detectedLang } : config;
        
        ttsService.speak(chunk, voiceConfig, priority);
      }
    });
  };

  // 播放指定项
  const playItem = (item: VoiceItem) => {
    if (!isEnabled) return;
    
    const detectedLang = ttsUtils.detectLanguage(item.text);
    const voiceConfig = detectedLang !== config.lang ? 
      { ...config, lang: detectedLang } : config;
    
    ttsService.speak(item.text, voiceConfig, item.priority);
  };

  // 播放/暂停控制
  const togglePlayback = () => {
    if (isPlaying) {
      ttsService.pause();
    } else {
      ttsService.resume();
    }
  };

  // 停止播放
  const stopPlayback = () => {
    ttsService.stop();
    setIsPlaying(false);
    setCurrentItem(null);
  };

  // 跳过当前项
  const skipCurrent = () => {
    ttsService.stop();
  };

  // 清空队列
  const clearQueue = () => {
    ttsService.clearQueue();
    queueRef.current = [];
    setQueue([]);
    setCurrentItem(null);
  };

  // 切换启用状态
  const toggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    
    if (!newEnabled) {
      stopPlayback();
      clearQueue();
    }
  };

  // 配置更新处理
  const handleConfigChange = (newConfig: TTSConfig) => {
    setConfig(newConfig);
  };

  // 获取类型图标
  const getTypeIcon = (type: VoiceItem['type']) => {
    switch (type) {
      case 'subtitle':
        return <Mic className="w-3 h-3" />;
      case 'comment':
      case 'chat':
        return <MessageSquare className="w-3 h-3" />;
      default:
        return <Volume2 className="w-3 h-3" />;
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
    }
  };

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    addToQueue,
    addSubtitle: (text: string) => addToQueue(text, 'subtitle', 'high'),
    addComment: (text: string) => addToQueue(text, 'comment', 'medium'),
    addChat: (text: string) => addToQueue(text, 'chat', 'medium'),
    addSystem: (text: string) => addToQueue(text, 'system', 'low'),
    togglePlayback,
    stopPlayback,
    clearQueue,
    play: () => ttsService.resume(),
    pause: () => ttsService.pause(),
    stop: stopPlayback,
    clear: clearQueue,
    setEnabled: setIsEnabled,
    getStats: () => stats,
    isPlaying
  }));

  return (
    <div className={`bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700 ${className}`}>
      {/* 控制栏 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleEnabled}
            className={`p-1.5 rounded transition-colors ${
              isEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {isEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <div className="text-sm text-gray-300">
            语音播放 {isEnabled ? '已启用' : '已禁用'}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* 播放控制 */}
          {isEnabled && (
            <>
              <button
                onClick={togglePlayback}
                disabled={!currentItem && queue.length === 0}
                className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              <button
                onClick={skipCurrent}
                disabled={!isPlaying}
                className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </>
          )}
          
          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 当前播放项 */}
      {isEnabled && currentItem && (
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-start gap-2">
            <div className={`mt-1 ${getPriorityColor(currentItem.priority)}`}>
              {getTypeIcon(currentItem.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">
                {currentItem.text}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                正在播放 • {currentItem.type}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 队列列表 */}
      {isEnabled && queue.length > 0 && (
        <div className="max-h-32 overflow-y-auto">
          {queue.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 hover:bg-gray-800/50 cursor-pointer transition-colors"
              onClick={() => playItem(item)}
            >
              <div className={`mt-1 ${getPriorityColor(item.priority)}`}>
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-300 truncate">
                  {item.text}
                </div>
                <div className="text-xs text-gray-500">
                  {item.type} • {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {queue.length > 5 && (
            <div className="p-2 text-center text-xs text-gray-500">
              还有 {queue.length - 5} 项...
            </div>
          )}
        </div>
      )}

      {/* 统计信息 */}
      {isEnabled && (
        <div className="p-2 border-t border-gray-700 text-xs text-gray-500">
          已播放: {stats.totalPlayed} | 队列: {stats.queueLength}
        </div>
      )}

      {/* 语音设置弹窗 */}
      <VoiceSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
});

VoiceGenerator.displayName = 'VoiceGenerator';

export default VoiceGenerator;