import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Play, Pause, Volume2, VolumeX, MoreHorizontal, Edit, Star, Download, Link, EyeOff, Flag, Trash2, Pin, BarChart3, TrendingUp, Share, Forward, Shield } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import LazyImageWithFallback from '../components/LazyImageWithFallback';
import VideoInfoPanel from '../components/VideoInfoPanel';
import CommentSystem from '../components/CommentSystem';
import { useToast } from '../components/Toast';
import { databaseRecommendationService, type VideoContent } from '../services/databaseRecommendationService';

interface VideoDetailData {
  id: string;
  videoUrl: string;
  thumbnail: string;
  title: string;
  description: string;
  user: {
    id: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  duration: string;
  uploadDate: string;
  isLiked: boolean;
  tags: string[];
}

export default function VideoDetail() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { success, info, warning } = useToast();
  
  const [video, setVideo] = useState<VideoDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  
  // 更多菜单状态
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [moreMenuVideoId, setMoreMenuVideoId] = useState<string | null>(null);
  
  // 视频信息面板状态
  const [showVideoInfo, setShowVideoInfo] = useState(false);
  
  // 评论系统状态
  const [showCommentSystem, setShowCommentSystem] = useState(false);

  // 获取视频数据
  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      
      try {
        console.log('VideoDetail: 开始获取视频数据, videoId:', videoId);
        
        // 从databaseRecommendationService获取视频数据
        const videoContent = await databaseRecommendationService.getVideoById(videoId || '');
        console.log('VideoDetail: 从databaseRecommendationService获取的原始视频数据:', videoContent);
        
        if (videoContent) {
          // 详细检查视频数据
          console.log('VideoDetail: 视频详细信息:');
          console.log('- ID:', videoContent.id);
          console.log('- 标题:', videoContent.title);
          console.log('- 描述:', videoContent.description);
          console.log('- 创作者ID:', videoContent.creatorId);
          console.log('- 视频URL存在:', !!videoContent.videoUrl);
          
          if (videoContent.videoUrl) {
            console.log('- 视频URL类型:', videoContent.videoUrl.startsWith('data:') ? 'base64' : videoContent.videoUrl.startsWith('blob:') ? 'blob' : 'http');
            console.log('- 视频URL长度:', videoContent.videoUrl.length);
            console.log('- 视频URL前100字符:', videoContent.videoUrl.substring(0, 100));
          } else {
            console.warn('VideoDetail: 警告 - 视频没有videoUrl，将使用默认视频');
          }
          
          console.log('- 时长:', videoContent.duration);
          console.log('- 上传时间:', new Date(videoContent.uploadTime).toLocaleString());
          console.log('- 统计数据:', videoContent.stats);
          
          // 安全处理上传时间
          const getValidUploadDate = (uploadTime: any): string => {
            try {
              // 检查uploadTime是否为有效值
              if (!uploadTime) {
                console.warn('VideoDetail: uploadTime为空，使用当前时间');
                return new Date().toISOString();
              }
              
              // 如果是数字，检查是否为有效时间戳
              if (typeof uploadTime === 'number') {
                // 检查时间戳是否在合理范围内（1970年到2100年）
                if (uploadTime < 0 || uploadTime > 4102444800000) {
                  console.warn('VideoDetail: 时间戳超出合理范围:', uploadTime);
                  return new Date().toISOString();
                }
                
                const date = new Date(uploadTime);
                if (isNaN(date.getTime())) {
                  console.warn('VideoDetail: 无效的时间戳:', uploadTime);
                  return new Date().toISOString();
                }
                return date.toISOString();
              }
              
              // 如果是字符串，尝试解析
              if (typeof uploadTime === 'string') {
                const date = new Date(uploadTime);
                if (isNaN(date.getTime())) {
                  console.warn('VideoDetail: 无效的日期字符串:', uploadTime);
                  return new Date().toISOString();
                }
                return date.toISOString();
              }
              
              // 其他情况，使用当前时间
              console.warn('VideoDetail: 未知的uploadTime类型:', typeof uploadTime, uploadTime);
              return new Date().toISOString();
            } catch (error) {
              console.error('VideoDetail: 处理uploadTime时出错:', error, 'uploadTime:', uploadTime);
              return new Date().toISOString();
            }
          };
          
          // 转换为VideoDetailData格式
          const videoDetailData: VideoDetailData = {
            id: videoContent.id,
            videoUrl: videoContent.videoUrl || `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`, // 使用实际视频URL，如果没有则使用示例URL
            thumbnail: '', // 将通过LazyImageWithFallback组件处理
            title: videoContent.title,
            description: videoContent.description,
            user: {
              id: videoContent.creatorId,
              username: videoContent.creatorId === 'user_demo_001' ? '创作者昵称' : 'creator_user',
              avatar: '', // 将通过LazyImageWithFallback组件处理
              isVerified: true
            },
            stats: {
              likes: videoContent.stats.likes,
              comments: videoContent.stats.comments,
              shares: videoContent.stats.shares,
              views: videoContent.stats.views
            },
            duration: formatDuration(videoContent.duration),
            uploadDate: getValidUploadDate(videoContent.uploadTime),
            isLiked: false,
            tags: videoContent.tags
          };
          
          console.log('VideoDetail: 转换后的视频详情数据:', videoDetailData);
          console.log('VideoDetail: 最终使用的视频URL:', videoDetailData.videoUrl);
          
          setVideo(videoDetailData);
          setIsLiked(videoDetailData.isLiked);
        } else {
          console.warn('VideoDetail: 视频不存在, videoId:', videoId);
          // 视频不存在
          setVideo(null);
        }
      } catch (error) {
        console.error('VideoDetail: 加载视频失败:', error);
        setVideo(null);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideoData();
    }
  }, [videoId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (video) {
      setVideo({
        ...video,
        stats: {
          ...video.stats,
          likes: isLiked ? video.stats.likes - 1 : video.stats.likes + 1
        }
      });
    }
    success(isLiked ? '已取消点赞' : '已点赞');
  };

  const handleComment = () => {
    if (video) {
      setShowCommentSystem(true);
    }
  };

  const handleEdit = () => {
    // 检查是否是当前用户的视频
    if (video?.user.id === 'user_demo_001') {
      info('编辑功能开发中，敬请期待！');
    } else {
      info('只能编辑自己的作品');
    }
  };

  // 处理更多按钮点击
  const handleMoreClick = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (video) {
      setMoreMenuVideoId(video.id);
      setShowMoreMenu(true);
    }
  }, [video]);
  
  // 处理更多菜单选项
  const handleMoreMenuOption = useCallback(async (option: string) => {
    if (!video) return;
    
    setShowMoreMenu(false);
    setMoreMenuVideoId(null);
    
    switch (option) {
      case 'edit':
        // 检查是否是当前用户的视频
        if (video.user.id === 'user_demo_001') {
          info('编辑功能开发中，敬请期待！');
        } else {
          warning('只能编辑自己的作品');
        }
        break;
      case 'delete':
        // 检查是否是当前用户的视频
        if (video.user.id === 'user_demo_001') {
          if (window.confirm('确定要删除这个作品吗？此操作不可撤销。')) {
            try {
              info('正在删除作品...');
              
              // 从databaseRecommendationService中删除视频
              await databaseRecommendationService.deleteVideo(video.id, video.user.id);
              
              success('作品已成功删除！');
              
              // 删除成功后返回上一页或首页
              navigate(-1);
            } catch (error) {
              warning('删除失败，请重试');
              console.error('删除视频失败:', error);
            }
          }
        } else {
          warning('只能删除自己的作品');
        }
        break;
      case 'pin':
        if (video.user.id === 'user_demo_001') {
          success('作品已置顶！');
        } else {
          warning('只能置顶自己的作品');
        }
        break;
      case 'analytics':
        if (video.user.id === 'user_demo_001') {
          navigate('/analytics');
          info('正在跳转到数据分析页面...');
        } else {
          warning('只能查看自己作品的数据分析');
        }
        break;
      case 'recommend':
        if (video.user.id === 'user_demo_001') {
          success('作品已推荐！');
        } else {
          warning('只能推荐自己的作品');
        }
        break;
      case 'share':
        // 分享作品链接
        const shareUrl = window.location.href;
        if (navigator.share) {
          navigator.share({
            title: video.title,
            text: `分享一个精彩视频：${video.title}`,
            url: shareUrl
          }).catch(() => {
            navigator.clipboard.writeText(shareUrl);
            success('作品链接已复制到剪贴板！');
          });
        } else {
          navigator.clipboard.writeText(shareUrl);
          success('作品链接已复制到剪贴板！');
        }
        break;
      case 'forward':
        // 转发到消息页面
        navigate('/messages', { state: { forwardVideo: video } });
        info('正在打开转发页面...');
        break;
      case 'permissions':
        if (video.user.id === 'user_demo_001') {
          info('权限设置功能开发中，敬请期待！');
        } else {
          warning('只能设置自己作品的权限');
        }
        break;
      case 'info':
        setShowVideoInfo(true);
        info('正在加载视频技术信息...');
        break;
      default:
        break;
    }
  }, [video, success, warning, info, navigate]);
  
  // 关闭更多菜单
  const handleCloseMoreMenu = useCallback(() => {
    setShowMoreMenu(false);
    setMoreMenuVideoId(null);
  }, []);

  const handleFollow = () => {
    success('关注功能开发中，敬请期待！');
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>正在加载视频...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="mb-4">视频不存在或已被删除</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 顶部导航栏 */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
          <button 
            onClick={handleMoreClick}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 视频播放器 */}
      <div className="relative h-screen">
        <VideoPlayer
          src={video.videoUrl}
          poster={video.thumbnail}
          autoPlay={true}
          loop={true}
          muted={isMuted}
          className="w-full h-full object-cover"
          onTimeUpdate={(currentTime, duration) => {
            // Handle time updates
          }}
          onEnded={() => {
            setIsPlaying(false);
          }}
        />
        
        {/* 播放/暂停按钮覆盖层 */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {!isPlaying && (
            <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          )}
        </div>
      </div>

      {/* 右侧操作栏 */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center space-y-6 z-40">
        {/* 用户头像 */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <LazyImageWithFallback
              src={video.user.avatar}
              alt={video.user.username}
              className="w-12 h-12 rounded-full border-2 border-white"
              useImageService={true}
              prompt="user avatar profile picture"
              imageSize="square"
              fallbackSrc="/images/default-avatar.svg"
            />
            {video.user.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          <button
            onClick={handleFollow}
            className="mt-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-lg font-bold hover:bg-red-600 transition-colors"
          >
            +
          </button>
        </div>

        {/* 点赞 */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleLike}
            className={`p-3 rounded-full transition-colors ${
              isLiked ? 'text-red-500' : 'text-white hover:bg-white/10'
            }`}
          >
            <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <span className="text-white text-xs mt-1">{formatNumber(video.stats.likes)}</span>
        </div>

        {/* 评论 */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleComment}
            className="p-3 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <MessageCircle className="w-7 h-7" />
          </button>
          <span className="text-white text-xs mt-1">{formatNumber(video.stats.comments)}</span>
        </div>

        {/* 编辑 (仅显示给作品所有者) */}
        {video.user.id === 'user_demo_001' && (
          <div className="flex flex-col items-center">
            <button
              onClick={handleEdit}
              className="p-3 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <Edit className="w-7 h-7" />
            </button>
            <span className="text-white text-xs mt-1">编辑</span>
          </div>
        )}
      </div>

      {/* 底部信息区域 */}
      <div className="absolute bottom-32 left-4 right-20 z-40">
        {/* 用户信息 */}
        <div className="flex items-center mb-3">
          <span className="text-white font-semibold mr-2">@{video.user.username}</span>
          {video.user.isVerified && (
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        {/* 视频标题和描述 */}
        <h1 className="text-white text-lg font-semibold mb-2">{video.title}</h1>
        <p className="text-white text-sm mb-3 leading-relaxed opacity-90">
          {video.description}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {video.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white/20 text-white text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* 视频统计信息 */}
        <div className="flex items-center space-x-4 text-white text-xs opacity-70">
          <span>{formatNumber(video.stats.views)} 观看</span>
          <span>{video.duration}</span>
          <span>{new Date(video.uploadDate).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>

      {/* 更多选项菜单 */}
      {showMoreMenu && moreMenuVideoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[1000]" onClick={handleCloseMoreMenu}>
          <div className="bg-white rounded-t-2xl w-full max-w-md mx-4 mb-0 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">更多选项</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleMoreMenuOption('edit')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="text-gray-900">编辑</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('delete')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-500 mr-3" />
                  <span className="text-gray-900">删除</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('pin')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Pin className="w-5 h-5 text-orange-500 mr-3" />
                  <span className="text-gray-900">置顶</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('analytics')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-5 h-5 text-purple-500 mr-3" />
                  <span className="text-gray-900">数据分析</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('recommend')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <TrendingUp className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-900">推荐</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('share')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Share className="w-5 h-5 text-blue-400 mr-3" />
                  <span className="text-gray-900">分享</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('forward')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Forward className="w-5 h-5 text-indigo-500 mr-3" />
                  <span className="text-gray-900">转发</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('permissions')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Shield className="w-5 h-5 text-yellow-500 mr-3" />
                  <span className="text-gray-900">权限设置</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('info')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-5 h-5 text-cyan-500 mr-3" />
                  <span className="text-gray-900">视频信息</span>
                </button>
              </div>
              
              <button
                onClick={handleCloseMoreMenu}
                className="w-full mt-4 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 视频信息面板 */}
      <VideoInfoPanel
        videoUrl={video.videoUrl}
        videoTitle={video.title}
        isOpen={showVideoInfo}
        onClose={() => setShowVideoInfo(false)}
      />
      
      {/* 评论系统 - z-index: 1100 */}
      {showCommentSystem && video && (
        <CommentSystem
          videoId={video.id}
          onClose={() => setShowCommentSystem(false)}
        />
      )}
    </div>
  );
}