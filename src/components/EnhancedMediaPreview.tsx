import React, { useState, useRef, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Play, Pause, Volume2, VolumeX, FileText, Eye, ExternalLink } from 'lucide-react';

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'document';
  name?: string;
}

interface EnhancedMediaPreviewProps {
  files: MediaFile[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onDownload?: (file: MediaFile) => void;
}

const EnhancedMediaPreview: React.FC<EnhancedMediaPreviewProps> = ({
  files,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onDownload
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const currentFile = files[currentIndex];

  // 重置状态当文件改变时
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    
    // 为文档生成预览URL
    if (currentFile?.type === 'document') {
      generateDocumentPreview(currentFile);
    }
  }, [currentIndex, currentFile]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 键盘事件处理
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case ' ':
          e.preventDefault();
          if (currentFile?.type === 'video') {
            togglePlay();
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleRotate();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentFile, onClose, onNext, onPrevious, togglePlay]);

  // 自动隐藏控制栏
  useEffect(() => {
    if (!isOpen) return;

    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => {
      resetControlsTimeout();
    };

    document.addEventListener('mousemove', handleMouseMove);
    resetControlsTimeout();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const generateDocumentPreview = async (file: MediaFile) => {
    // 这里可以集成文档预览服务，如 Google Docs Viewer 或 Microsoft Office Online
    // 暂时使用占位符
    const fileName = file.file.name.toLowerCase();
    if (fileName.endsWith('.pdf')) {
      // 对于PDF，可以使用 PDF.js 或其他PDF查看器
      setDocumentPreviewUrl(file.url);
    } else {
      // 对于其他文档类型，可以使用在线预览服务
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`;
      setDocumentPreviewUrl(googleViewerUrl);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (onDownload && currentFile) {
      onDownload(currentFile);
    } else {
      // 默认下载行为
      const link = document.createElement('a');
      link.href = currentFile.url;
      link.download = currentFile.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderImagePreview = () => (
    <div className="flex items-center justify-center h-full">
      <img
        ref={imageRef}
        src={currentFile.url}
        alt={currentFile.file.name}
        className="max-w-full max-h-full object-contain transition-transform duration-200"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          cursor: zoom > 1 ? 'grab' : 'default'
        }}
        draggable={false}
      />
    </div>
  );

  const renderVideoPreview = () => (
    <div className="flex items-center justify-center h-full relative">
      <video
        ref={videoRef}
        src={currentFile.url}
        className="max-w-full max-h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />
      
      {/* 视频控制栏 */}
      <div className={`absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 rounded-lg p-3 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlay}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <span className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          
          <button
            onClick={toggleMute}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );

  const renderDocumentPreview = () => {
    const fileName = currentFile.file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf');
    
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        {isPdf ? (
          <iframe
            src={currentFile.url}
            className="w-full h-full border-0"
            title={currentFile.file.name}
          />
        ) : (
          <div className="text-center p-8">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{currentFile.file.name}</h3>
            <p className="text-gray-600 mb-4">无法预览此文档类型</p>
            <div className="space-y-2">
              <button
                onClick={handleDownload}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                下载文件
              </button>
              {documentPreviewUrl && (
                <button
                  onClick={() => window.open(documentPreviewUrl, '_blank')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ml-2"
                >
                  <ExternalLink className="w-4 h-4 inline mr-2" />
                  在线预览
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen || !currentFile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* 顶部控制栏 */}
      <div className={`absolute top-0 left-0 right-0 bg-black bg-opacity-75 p-4 z-10 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-white font-medium">{currentFile.file.name}</h3>
            <span className="text-gray-300 text-sm">
              {currentIndex + 1} / {files.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentFile.type === 'image' && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="text-white hover:text-gray-300 p-2 rounded transition-colors"
                  title="缩小 (-)"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-white text-sm min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="text-white hover:text-gray-300 p-2 rounded transition-colors"
                  title="放大 (+)"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRotate}
                  className="text-white hover:text-gray-300 p-2 rounded transition-colors"
                  title="旋转 (R)"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </>
            )}
            
            <button
              onClick={handleDownload}
              className="text-white hover:text-gray-300 p-2 rounded transition-colors"
              title="下载"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 p-2 rounded transition-colors"
              title="关闭 (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div ref={containerRef} className="flex-1 relative">
        {currentFile.type === 'image' && renderImagePreview()}
        {currentFile.type === 'video' && renderVideoPreview()}
        {currentFile.type === 'document' && renderDocumentPreview()}
        
        {/* 导航按钮 */}
        {files.length > 1 && (
          <>
            <button
              onClick={onPrevious}
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
              title="上一个 (←)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={onNext}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
              title="下一个 (→)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* 底部缩略图 */}
      {files.length > 1 && (
        <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {files.map((file, index) => (
              <button
                key={file.id}
                onClick={() => {
                  // 这里需要父组件提供切换到指定索引的方法
                  // 暂时使用 onNext/onPrevious 的组合
                  const diff = index - currentIndex;
                  if (diff > 0) {
                    for (let i = 0; i < diff; i++) onNext();
                  } else if (diff < 0) {
                    for (let i = 0; i < Math.abs(diff); i++) onPrevious();
                  }
                }}
                className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                  index === currentIndex
                    ? 'border-white'
                    : 'border-transparent hover:border-gray-400'
                }`}
              >
                {file.type === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : file.type === 'video' ? (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMediaPreview;