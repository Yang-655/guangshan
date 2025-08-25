import { useState, useEffect } from 'react';
import { 
  Scissors, 
  Music, 
  Type, 
  Sparkles, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Check,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoEditorProps {
  videoUrl?: string;
  onSave: (editedVideo: any) => void;
  onCancel: () => void;
}

export default function VideoEditor({ videoUrl, onSave, onCancel }: VideoEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'trim' | 'music' | 'text' | 'effects' | 'voice'>('trim');
  const [voiceToText, setVoiceToText] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 添加全局鼠标事件监听器
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // 查找时间轴元素
      const timelineElement = document.querySelector('[data-timeline]') as HTMLElement;
      if (!timelineElement) return;
      
      const rect = timelineElement.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, moveX / rect.width));
      const newTime = percentage * duration;
      setCurrentTime(newTime);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, duration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleVoiceRecognition = () => {
    setIsRecognizing(!isRecognizing);
    if (!isRecognizing) {
      // 模拟语音识别
      setTimeout(() => {
        setRecognizedText('这是通过AI语音识别生成的字幕文本...');
        setIsRecognizing(false);
      }, 3000);
    }
  };

  const handleResetFilters = () => {
    toast.success('滤镜已重置');
  };

  const handleApplyFilters = () => {
    toast.success('滤镜已应用');
  };

  const handleSelectMusic = (genre: string) => {
    toast.success(`已选择${genre}音乐`);
  };

  const handleSelectFont = () => {
    toast.success('字体选择器已打开');
  };

  const handleSelectColor = () => {
    toast.success('颜色选择器已打开');
  };

  const handleAddText = () => {
    toast.success('文字已添加到视频');
  };

  const handleSelectEffect = (effect: string) => {
    toast.success(`已应用${effect}特效`);
  };

  const handleEditSubtitle = (index: number) => {
    toast.success(`正在编辑第${index + 1}条字幕`);
  };

  const handleApplySubtitles = () => {
    toast.success('字幕已应用到视频');
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = Math.max(0, Math.min(duration, percentage * duration));
    setCurrentTime(newTime);
    toast.success(`跳转到 ${Math.floor(newTime)}s`);
  };

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };



  const handleSave = () => {
    const editedVideo = {
      url: videoUrl,
      duration,
      volume,
      subtitles: recognizedText,
      effects: [],
      music: null
    };
    onSave(editedVideo);
  };

  const tools = [
    { id: 'trim', icon: Scissors, label: '剪辑' },
    { id: 'music', icon: Music, label: '音乐' },
    { id: 'text', icon: Type, label: '文字' },
    { id: 'effects', icon: Sparkles, label: '特效' },
    { id: 'voice', icon: Mic, label: '语音' }
  ];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center p-4 bg-black/80 backdrop-blur-sm">
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-gray-800 text-white"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-white text-lg font-semibold">视频编辑</h2>
        
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium"
        >
          保存
        </button>
      </div>

      {/* 视频预览区域 */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
        <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-lg overflow-hidden">
          {videoUrl ? (
            <video 
              className="w-full h-full object-cover"
              src={videoUrl}
              muted={isMuted}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <Play className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">视频预览</p>
              </div>
            </div>
          )}
          
          {/* 播放控制覆盖层 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={handlePlayPause}
              className="p-4 rounded-full bg-black/50 backdrop-blur-sm"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          {/* 音量控制 */}
          <div className="absolute top-4 right-4">
            <button
              onClick={handleVolumeToggle}
              className="p-2 rounded-full bg-black/50 backdrop-blur-sm"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* 字幕显示 */}
          {recognizedText && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white text-sm text-center">{recognizedText}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 时间轴 */}
      <div className="p-4 bg-gray-800">
        <div className="relative">
          <div 
            className="w-full h-4 bg-gray-600 rounded-full overflow-hidden cursor-pointer relative"
            data-timeline
            onClick={handleTimelineClick}
            onMouseDown={handleTimelineMouseDown}
          >
            <div 
              className={`h-full bg-blue-500 ${isDragging ? '' : 'transition-all duration-300'}`}
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
            {/* 拖动手柄 */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-grab active:cursor-grabbing"
              style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{Math.floor(currentTime)}s</span>
            <span>{duration}s</span>
          </div>
        </div>
      </div>

      {/* 编辑工具栏 */}
      <div className="bg-gray-900 p-4">
        {/* 工具选择 */}
        <div className="flex justify-center space-x-6 mb-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id as any)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  activeTab === tool.id ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* 工具面板 */}
        <div className="min-h-[120px]">
          {activeTab === 'trim' && (
            <div className="text-center text-white">
              <p className="text-sm mb-4">拖动时间轴两端来裁剪视频</p>
              <div className="flex justify-center space-x-4">
                <button 
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              重置
            </button>
            <button 
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-500 rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              应用
            </button>
              </div>
            </div>
          )}

          {activeTab === 'music' && (
            <div className="text-center text-white">
              <p className="text-sm mb-4">选择背景音乐</p>
              <div className="grid grid-cols-3 gap-2">
                {['流行', '摇滚', '古典'].map((genre) => (
                 <button 
                   key={genre} 
                   onClick={() => handleSelectMusic(genre)}
                   className="p-3 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                 >
                   {genre}
                 </button>
               ))}
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="text-white">
              <p className="text-sm mb-4 text-center">添加文字</p>
              <input
                type="text"
                placeholder="输入文字内容..."
                className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 mb-3"
              />
              <div className="flex justify-center space-x-2">
                <button 
              onClick={handleSelectFont}
              className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              字体
            </button>
            <button 
              onClick={handleSelectColor}
              className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              颜色
            </button>
            <button 
              onClick={handleAddText}
              className="px-4 py-2 bg-blue-500 rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              添加
            </button>
              </div>
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="text-center text-white">
              <p className="text-sm mb-4">选择特效</p>
              <div className="grid grid-cols-4 gap-2">
                {['美颜', '滤镜', '动画', '转场'].map((effect) => (
                  <button 
                    key={effect} 
                    onClick={() => handleSelectEffect(effect)}
                    className="p-3 bg-gray-700 rounded-lg text-xs hover:bg-gray-600 transition-colors"
                  >
                    {effect}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="text-center text-white">
              <p className="text-sm mb-4">AI语音转文字</p>
              <div className="space-y-3">
                <button
                  onClick={handleVoiceRecognition}
                  className={`flex items-center justify-center space-x-2 mx-auto px-6 py-3 rounded-lg transition-colors ${
                    isRecognizing ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isRecognizing ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      <span>识别中...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>开始识别</span>
                    </>
                  )}
                </button>
                
                {recognizedText && (
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <p className="text-sm">{recognizedText}</p>
                    <div className="flex justify-center space-x-2 mt-2">
                      <button 
                  onClick={() => handleEditSubtitle(0)}
                  className="px-3 py-1 bg-gray-600 rounded text-xs hover:bg-gray-500 transition-colors"
                >
                  编辑
                </button>
                <button 
                  onClick={handleApplySubtitles}
                  className="px-3 py-1 bg-blue-500 rounded text-xs hover:bg-blue-600 transition-colors"
                >
                  应用字幕
                </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}