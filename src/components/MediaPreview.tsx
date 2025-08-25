import React, { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Download } from 'lucide-react';
import { MediaFile } from './MediaUpload';

interface MediaPreviewProps {
  files: MediaFile[];
  initialIndex?: number;
  onClose: () => void;
  showDownload?: boolean;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  files,
  initialIndex = 0,
  onClose,
  showDownload = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const currentFile = files[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : files.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < files.length - 1 ? prev + 1 : 0));
  };

  const handlePlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef) {
      videoRef.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen && videoRef) {
      if (videoRef.requestFullscreen) {
        videoRef.requestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    if (currentFile) {
      const link = document.createElement('a');
      link.href = currentFile.url;
      link.download = currentFile.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case ' ':
        e.preventDefault();
        if (currentFile.type === 'video') {
          handlePlayPause();
        }
        break;
    }
  };

  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  React.useEffect(() => {
    // 重置视频状态当切换文件时
    setIsPlaying(false);
    setIsMuted(false);
  }, [currentIndex]);

  if (!currentFile) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 文件计数 */}
        {files.length > 1 && (
          <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {files.length}
          </div>
        )}

        {/* 上一个按钮 */}
        {files.length > 1 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 下一个按钮 */}
        {files.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* 媒体内容 */}
        <div className="relative max-w-full max-h-full">
          {currentFile.type === 'image' ? (
            <img
              src={currentFile.url}
              alt={currentFile.file.name}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="relative">
              <video
                ref={setVideoRef}
                src={currentFile.url}
                className="max-w-full max-h-full object-contain"
                controls={false}
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              
              {/* 视频控制栏 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 bg-black bg-opacity-50 rounded-full px-4 py-2">
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={handleMuteToggle}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={handleFullscreen}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部信息栏 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full flex items-center space-x-4">
          <span className="text-sm truncate max-w-xs">{currentFile.file.name}</span>
          <span className="text-xs text-gray-300">
            {(currentFile.file.size / 1024 / 1024).toFixed(1)}MB
          </span>
          {showDownload && (
            <button
              onClick={handleDownload}
              className="text-white hover:text-gray-300 transition-colors"
              title="下载文件"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 缩略图导航 */}
        {files.length > 1 && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto px-4">
            {files.map((file, index) => (
              <button
                key={file.id}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentIndex ? 'border-white' : 'border-transparent'
                }`}
              >
                {file.type === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPreview;