import React, { useState, useEffect } from 'react';
import { Info, X, Play, Download, Share2, Eye, Clock, Monitor, HardDrive, Zap } from 'lucide-react';
import VideoThumbnailGenerator, { VideoInfo } from '../utils/videoThumbnailGenerator';

interface VideoInfoPanelProps {
  videoUrl: string;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const VideoInfoPanel: React.FC<VideoInfoPanelProps> = ({
  videoUrl,
  videoTitle,
  isOpen,
  onClose,
  className = ''
}) => {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  // 获取视频信息
  useEffect(() => {
    if (isOpen && videoUrl) {
      loadVideoInfo();
    }
  }, [isOpen, videoUrl]);

  const loadVideoInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('开始获取视频信息:', videoUrl.substring(0, 100));
      
      // 获取视频基本信息
      const info = await VideoThumbnailGenerator.getVideoInfo(videoUrl);
      setVideoInfo(info);
      
      // 生成多个缩略图
      const thumbs = await VideoThumbnailGenerator.generateMultipleThumbnails(videoUrl, 4, 160, 120);
      setThumbnails(thumbs);
      
      console.log('视频信息获取成功:', info);
    } catch (err) {
      console.error('获取视频信息失败:', err);
      setError('无法获取视频信息');
    } finally {
      setLoading(false);
    }
  };

  const getVideoUrlType = (url: string): string => {
    if (url.startsWith('data:video/')) return 'Base64 编码';
    if (url.startsWith('blob:')) return 'Blob 对象';
    if (url.startsWith('http')) return 'HTTP 链接';
    return '未知类型';
  };

  const getQualityLevel = (width: number, height: number): string => {
    if (width >= 3840 && height >= 2160) return '4K 超高清';
    if (width >= 2560 && height >= 1440) return '2K 高清';
    if (width >= 1920 && height >= 1080) return '1080p 全高清';
    if (width >= 1280 && height >= 720) return '720p 高清';
    if (width >= 854 && height >= 480) return '480p 标清';
    return '低清晰度';
  };

  const getAspectRatio = (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    const ratioW = width / divisor;
    const ratioH = height / divisor;
    
    // 常见比例
    if (ratioW === 16 && ratioH === 9) return '16:9 (宽屏)';
    if (ratioW === 4 && ratioH === 3) return '4:3 (标准)';
    if (ratioW === 1 && ratioH === 1) return '1:1 (正方形)';
    if (ratioW === 9 && ratioH === 16) return '9:16 (竖屏)';
    
    return `${ratioW}:${ratioH}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 这里可以添加toast提示
      console.log(`${label} 已复制到剪贴板`);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Info className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">视频详细信息</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">正在分析视频...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadVideoInfo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                重新获取
              </button>
            </div>
          )}

          {videoInfo && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Play className="w-5 h-5 mr-2 text-blue-600" />
                  基本信息
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">视频标题:</span>
                      <span className="font-medium text-gray-800 truncate ml-2" title={videoTitle}>
                        {videoTitle}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        时长:
                      </span>
                      <span className="font-medium text-gray-800">
                        {VideoThumbnailGenerator.formatDuration(videoInfo.duration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">格式:</span>
                      <span className="font-medium text-gray-800">{videoInfo.format}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">来源类型:</span>
                      <span className="font-medium text-gray-800">{getVideoUrlType(videoUrl)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 技术规格 */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Monitor className="w-5 h-5 mr-2 text-green-600" />
                  技术规格
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">分辨率:</span>
                      <span className="font-medium text-gray-800">
                        {VideoThumbnailGenerator.formatResolution(videoInfo.width, videoInfo.height)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">尺寸:</span>
                      <span className="font-medium text-gray-800">
                        {videoInfo.width} × {videoInfo.height}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">宽高比:</span>
                      <span className="font-medium text-gray-800">
                        {getAspectRatio(videoInfo.width, videoInfo.height)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">质量等级:</span>
                      <span className="font-medium text-gray-800">
                        {getQualityLevel(videoInfo.width, videoInfo.height)}
                      </span>
                    </div>
                    {videoInfo.size > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <HardDrive className="w-4 h-4 mr-1" />
                          文件大小:
                        </span>
                        <span className="font-medium text-gray-800">
                          {VideoThumbnailGenerator.formatFileSize(videoInfo.size)}
                        </span>
                      </div>
                    )}
                    {videoInfo.bitrate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Zap className="w-4 h-4 mr-1" />
                          比特率:
                        </span>
                        <span className="font-medium text-gray-800">
                          {Math.round(videoInfo.bitrate / 1000)} kbps
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 缩略图预览 */}
              {thumbnails.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-purple-600" />
                    视频预览
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {thumbnails.map((thumbnail, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={thumbnail}
                          alt={`预览 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:border-blue-400 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                          <button
                            onClick={() => copyToClipboard(thumbnail, '缩略图')}
                            className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition-all"
                            title="复制缩略图"
                          >
                            <Download className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                          {Math.round((videoInfo.duration / (thumbnails.length + 1)) * (index + 1))}s
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <button
                  onClick={() => copyToClipboard(videoUrl, '视频URL')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>复制视频链接</span>
                </button>
                
                <button
                  onClick={() => {
                    const info = {
                      title: videoTitle,
                      duration: VideoThumbnailGenerator.formatDuration(videoInfo.duration),
                      resolution: VideoThumbnailGenerator.formatResolution(videoInfo.width, videoInfo.height),
                      format: videoInfo.format,
                      size: videoInfo.size > 0 ? VideoThumbnailGenerator.formatFileSize(videoInfo.size) : '未知',
                      aspectRatio: getAspectRatio(videoInfo.width, videoInfo.height)
                    };
                    const infoText = Object.entries(info).map(([key, value]) => `${key}: ${value}`).join('\n');
                    copyToClipboard(infoText, '视频信息');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Info className="w-4 h-4" />
                  <span>复制详细信息</span>
                </button>
                
                <button
                  onClick={loadVideoInfo}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>重新分析</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoInfoPanel;