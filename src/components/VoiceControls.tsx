import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Square, Volume2, VolumeX, List, Settings, Trash2 } from 'lucide-react';
import { ttsService, TTSQueueItem } from '../utils/ttsService';
import VoiceSettings from './VoiceSettings';

interface VoiceControlsProps {
  className?: string;
  position?: 'fixed' | 'relative';
  size?: 'small' | 'medium' | 'large';
  showQueue?: boolean;
  onToggle?: (enabled: boolean) => void;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  className = '',
  position = 'fixed',
  size = 'medium',
  showQueue = true,
  onToggle
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentItem, setCurrentItem] = useState<TTSQueueItem | null>(null);
  const [queue, setQueue] = useState<TTSQueueItem[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState({
    totalPlayed: 0,
    queueLength: 0
  });

  // 初始化TTS事件监听
  useEffect(() => {
    const handlePlaybackStarted = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    const handlePlaybackEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentItem(null);
    };

    const handleItemStarted = (item: TTSQueueItem) => {
      setCurrentItem(item);
      setIsPlaying(true);
      setIsPaused(false);
    };

    const handleItemEnded = (item: TTSQueueItem) => {
      setCurrentItem(null);
      setStats(prev => ({
        ...prev,
        totalPlayed: prev.totalPlayed + 1
      }));
    };

    const handlePaused = () => {
      setIsPaused(true);
    };

    const handleResumed = () => {
      setIsPaused(false);
    };

    const handleStopped = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentItem(null);
    };

    const handleQueueUpdated = (ttsQueue: TTSQueueItem[]) => {
      setQueue([...ttsQueue]);
      setStats(prev => ({
        ...prev,
        queueLength: ttsQueue.length
      }));
    };

    const handleQueueCleared = () => {
      setQueue([]);
      setCurrentItem(null);
      setStats(prev => ({
        ...prev,
        queueLength: 0
      }));
    };

    // 注册事件监听
    ttsService.on('playbackStarted', handlePlaybackStarted);
    ttsService.on('playbackEnded', handlePlaybackEnded);
    ttsService.on('itemStarted', handleItemStarted);
    ttsService.on('itemEnded', handleItemEnded);
    ttsService.on('paused', handlePaused);
    ttsService.on('resumed', handleResumed);
    ttsService.on('stopped', handleStopped);
    ttsService.on('queueUpdated', handleQueueUpdated);
    ttsService.on('queueCleared', handleQueueCleared);

    // 初始化状态
    const status = ttsService.getQueueStatus();
    setQueue(status.queue);
    setIsPlaying(status.isPlaying);
    setCurrentItem(status.currentItem);

    return () => {
      ttsService.off('playbackStarted', handlePlaybackStarted);
      ttsService.off('playbackEnded', handlePlaybackEnded);
      ttsService.off('itemStarted', handleItemStarted);
      ttsService.off('itemEnded', handleItemEnded);
      ttsService.off('paused', handlePaused);
      ttsService.off('resumed', handleResumed);
      ttsService.off('stopped', handleStopped);
      ttsService.off('queueUpdated', handleQueueUpdated);
      ttsService.off('queueCleared', handleQueueCleared);
    };
  }, []);

  // 播放/暂停控制
  const togglePlayback = () => {
    if (!isEnabled) return;
    
    if (isPlaying && !isPaused) {
      ttsService.pause();
    } else if (isPaused) {
      ttsService.resume();
    } else if (queue.length > 0) {
      // 如果有队列但没有播放，重新开始播放
      const firstItem = queue[0];
      ttsService.speak(firstItem.text, firstItem.config, firstItem.priority);
    }
  };

  // 停止播放
  const stopPlayback = () => {
    ttsService.stop();
  };

  // 跳过当前项
  const skipCurrent = () => {
    if (isPlaying) {
      ttsService.stop();
    }
  };

  // 清空队列
  const clearQueue = () => {
    ttsService.clearQueue();
    stopPlayback();
  };

  // 切换启用状态
  const toggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onToggle?.(newEnabled);
    
    if (!newEnabled) {
      stopPlayback();
      clearQueue();
    }
  };

  // 音量控制
  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    
    const config = ttsService.getConfig();
    ttsService.setConfig({ ...config, volume: clampedVolume });
    
    setIsMuted(clampedVolume === 0);
  };

  // 静音切换
  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume > 0 ? volume : 0.8);
    } else {
      handleVolumeChange(0);
    }
  };

  // 移除队列项
  const removeQueueItem = (itemId: string) => {
    ttsService.removeFromQueue(itemId);
  };

  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-2',
          button: 'p-1.5',
          icon: 'w-4 h-4',
          text: 'text-xs'
        };
      case 'large':
        return {
          container: 'p-4',
          button: 'p-3',
          icon: 'w-6 h-6',
          text: 'text-base'
        };
      default:
        return {
          container: 'p-3',
          button: 'p-2',
          icon: 'w-5 h-5',
          text: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const positionClasses = position === 'fixed' ? 'fixed bottom-4 right-4 z-50' : 'relative';

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'subtitle':
        return '📺';
      case 'comment':
        return '💬';
      case 'chat':
        return '💭';
      case 'system':
        return '🔔';
      default:
        return '🔊';
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!ttsService.isSupported()) {
    return (
      <div className={`bg-gray-900 rounded-lg border border-gray-700 ${sizeClasses.container} ${positionClasses} ${className}`}>
        <div className="text-center text-gray-400">
          <Volume2 className={`${sizeClasses.icon} mx-auto mb-2`} />
          <p className={sizeClasses.text}>浏览器不支持语音合成</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700 ${sizeClasses.container} ${positionClasses} ${className}`}>
        {/* 主控制区 */}
        <div className="flex items-center gap-2 mb-2">
          {/* 启用/禁用按钮 */}
          <button
            onClick={toggleEnabled}
            className={`${sizeClasses.button} rounded transition-colors ${
              isEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {isEnabled ? <Volume2 className={sizeClasses.icon} /> : <VolumeX className={sizeClasses.icon} />}
          </button>

          {/* 播放控制 */}
          {isEnabled && (
            <>
              <button
                onClick={togglePlayback}
                disabled={!currentItem && queue.length === 0}
                className={`${sizeClasses.button} rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {isPlaying && !isPaused ? (
                  <Pause className={sizeClasses.icon} />
                ) : (
                  <Play className={sizeClasses.icon} />
                )}
              </button>

              <button
                onClick={skipCurrent}
                disabled={!isPlaying}
                className={`${sizeClasses.button} rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                <SkipForward className={sizeClasses.icon} />
              </button>

              <button
                onClick={stopPlayback}
                disabled={!isPlaying && !isPaused}
                className={`${sizeClasses.button} rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                <Square className={sizeClasses.icon} />
              </button>
            </>
          )}

          {/* 音量控制 */}
          {isEnabled && (
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className={`${sizeClasses.button} rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors`}
              >
                {isMuted ? <VolumeX className={sizeClasses.icon} /> : <Volume2 className={sizeClasses.icon} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* 队列和设置 */}
          {isEnabled && (
            <>
              {showQueue && (
                <button
                  onClick={() => setShowQueuePanel(!showQueuePanel)}
                  className={`${sizeClasses.button} rounded transition-colors ${
                    showQueuePanel ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  <List className={sizeClasses.icon} />
                </button>
              )}

              <button
                onClick={() => setShowSettings(true)}
                className={`${sizeClasses.button} rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors`}
              >
                <Settings className={sizeClasses.icon} />
              </button>
            </>
          )}
        </div>

        {/* 当前播放信息 */}
        {isEnabled && currentItem && (
          <div className="bg-gray-800/50 rounded p-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getTypeIcon('message')}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-white truncate ${sizeClasses.text}`}>
                  {currentItem.text}
                </p>
                <p className="text-xs text-gray-400">
                  {isPaused ? '已暂停' : '播放中'} • {currentItem.priority}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 统计信息 */}
        {isEnabled && (
          <div className={`text-gray-400 ${sizeClasses.text} flex justify-between`}>
            <span>已播放: {stats.totalPlayed}</span>
            <span>队列: {stats.queueLength}</span>
          </div>
        )}
      </div>

      {/* 队列面板 */}
      {isEnabled && showQueue && showQueuePanel && (
        <div className={`${position === 'fixed' ? 'fixed bottom-20 right-4' : 'absolute top-full mt-2'} w-80 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700 p-3 z-50`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">播放队列</h3>
            <div className="flex gap-1">
              <button
                onClick={clearQueue}
                className="p-1 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowQueuePanel(false)}
                className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {queue.length === 0 ? (
              <p className="text-gray-400 text-center py-4">队列为空</p>
            ) : (
              queue.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 p-2 bg-gray-800/50 rounded hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm">{getTypeIcon('message')}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <button
                        onClick={() => removeQueueItem(item.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 语音设置弹窗 */}
      <VoiceSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onConfigChange={(config) => {
          setVolume(config.volume);
          setIsMuted(config.volume === 0);
        }}
      />
    </>
  );
};

export default VoiceControls;