import { Settings, Share, Heart, MessageCircle, Play, Subtitles, Radio, Wallet, ShoppingBag, Megaphone, TrendingUp, Eye, ThumbsUp, Star, Award, Gift, Bell, Filter, Search, Download, BarChart3, X, Camera, MoreHorizontal, Edit, Trash2, Forward, Link, Pin, Shield, Users, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { databaseRecommendationService, type VideoContent } from '../services/databaseRecommendationService';
import VideoThumbnailGenerator from '../utils/videoThumbnailGenerator';
import LazyImageWithFallback from '../components/LazyImageWithFallback';
import SocialInteractionSystem from '../components/SocialInteractionSystem';
import DraftStatusIndicator from '../components/DraftStatusIndicator';

interface VideoItem {
  id: string;
  thumbnail: string;
  viewCount: string;
  duration: string;
  category: string;
  title: string;
  views: number;
  likes: number;
  uploadDate: string;
  hasSubtitles: boolean;
  isPrivate: boolean;
  engagement: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { success, info, warning } = useToast();
  const [activeTab, setActiveTab] = useState<'videos' | 'drafts' | 'likes'>('videos');
  const [showStats, setShowStats] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showInteractionPanel, setShowInteractionPanel] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [moreMenuVideoId, setMoreMenuVideoId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editForm, setEditForm] = useState({ title: '', category: '', isPrivate: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // 社交互动系统状态
  const [showSocialInteraction, setShowSocialInteraction] = useState(false);
  const [currentInteractionUserId, setCurrentInteractionUserId] = useState<string | null>(null);

  const userStats = {
    followers: 128000,
    following: 256,
    likes: 425000,
    videos: 4,
    views: 156789,
    shares: 2345,
    comments: 6789,
    avgWatchTime: '2:34',
    engagement: 8.5,
    growth: {
      followers: '+12.5%',
      views: '+23.1%',
      likes: '+18.7%'
    }
  };

  const [userVideos, setUserVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 格式化数字显示
   const formatNumber = (num: number): string => {
     if (num >= 1000000) {
       return (num / 1000000).toFixed(1) + 'M';
     } else if (num >= 1000) {
       return (num / 1000).toFixed(1) + 'K';
     }
     return num.toString();
   };

   // 格式化时长
   const formatDuration = (seconds: number): string => {
     const minutes = Math.floor(seconds / 60);
     const remainingSeconds = seconds % 60;
     return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
   };

   // 获取降级缩略图 - 不使用AI生成图片
   const getFallbackThumbnail = (video: VideoContent): string => {
     // 不返回AI生成图片，返回空字符串让组件处理
     console.log(`视频 ${video.id} 使用空缩略图（不显示AI生成图片）`);
     return '';
   };

   // 获取用户发布的视频
   const loadUserVideos = async () => {
     try {
       setLoading(true);
       console.log('开始加载用户视频...');
       
       // 显示加载提示
       success('正在加载视频数据...');
       
       const userPublishedVideos = await databaseRecommendationService.getUserVideos('user_demo_001');
    console.log('从databaseRecommendationService获取的原始视频数据:', userPublishedVideos);
       
       // 详细检查每个视频的数据
       userPublishedVideos.forEach((video: VideoContent, index: number) => {
         console.log(`视频 ${index + 1} 详细信息:`);
         console.log('- ID:', video.id);
         console.log('- 标题:', video.title);
         console.log('- 描述:', video.description);
         console.log('- 视频URL类型:', video.videoUrl ? (video.videoUrl.startsWith('data:') ? 'base64' : video.videoUrl.startsWith('blob:') ? 'blob' : 'http') : '无');
         console.log('- 视频URL长度:', video.videoUrl ? video.videoUrl.length : 0);
         console.log('- 视频URL前100字符:', video.videoUrl ? video.videoUrl.substring(0, 100) : '无');
         console.log('- 时长:', video.duration);
         console.log('- 上传时间:', new Date(video.uploadTime).toLocaleString());
         console.log('- 统计数据:', video.stats);
         console.log('---');
       });
       
       // 转换为VideoItem格式并生成缩略图
       const convertedVideos: VideoItem[] = await Promise.all(
         userPublishedVideos.map(async (video: VideoContent) => {
           console.log('转换视频:', video.id, video.title, '视频URL存在:', !!video.videoUrl);
           
           let thumbnail = '';
           
           // 优先使用数据库中保存的缩略图
           if (video.thumbnailUrl) {
             console.log(`视频 ${video.id} 使用数据库中的缩略图`);
             thumbnail = video.thumbnailUrl;
           } else {
             console.log(`视频 ${video.id} 数据库中没有缩略图，尝试生成`);
             
             let thumbnailGenerationAttempts = 0;
             const maxRetries = 2;
             
             // 为有效的视频URL生成缩略图（带重试机制和多种降级方案）
             if (video.videoUrl && (video.videoUrl.startsWith('data:video/') || video.videoUrl.startsWith('blob:') || video.videoUrl.startsWith('http'))) {
               while (thumbnailGenerationAttempts <= maxRetries && !thumbnail) {
                 try {
                   thumbnailGenerationAttempts++;
                   console.log(`开始为视频 ${video.id} 生成缩略图... (尝试 ${thumbnailGenerationAttempts}/${maxRetries + 1})`);
                   
                   // 根据尝试次数调整参数
                   const timeOffset = thumbnailGenerationAttempts === 1 ? 1 : thumbnailGenerationAttempts === 2 ? 0.5 : 2;
                   
                   // 添加超时控制
                   const thumbnailPromise = VideoThumbnailGenerator.generateThumbnail(video.videoUrl, timeOffset, 320, 240);
                   const timeoutPromise = new Promise((_, reject) => 
                     setTimeout(() => reject(new Error('缩略图生成超时')), 10000)
                   );
                   
                   thumbnail = await Promise.race([thumbnailPromise, timeoutPromise]) as string;
                   
                   console.log(`视频 ${video.id} 缩略图生成成功 (尝试 ${thumbnailGenerationAttempts})`);
                   break;
                 } catch (error) {
                   console.error(`视频 ${video.id} 缩略图生成失败 (尝试 ${thumbnailGenerationAttempts}):`, error);
                   
                   if (thumbnailGenerationAttempts > maxRetries) {
                     console.log(`视频 ${video.id} 缩略图生成最终失败，使用降级方案`);
                     // 多种降级方案
                     thumbnail = getFallbackThumbnail(video);
                   } else {
                     // 短暂延迟后重试
                     await new Promise(resolve => setTimeout(resolve, 500));
                   }
                 }
               }
             } else {
               console.log(`视频 ${video.id} 没有有效的视频URL，使用降级方案`);
               thumbnail = getFallbackThumbnail(video);
             }
           }
           
           // 安全处理时间和数值字段
           const safeDuration = typeof video.duration === 'number' && !isNaN(video.duration) ? video.duration : 0;
           const safeUploadTime = video.uploadTime && !isNaN(new Date(video.uploadTime).getTime()) 
             ? new Date(video.uploadTime).toISOString().split('T')[0]
             : new Date().toISOString().split('T')[0]; // 使用当前日期作为默认值
           
           return {
             id: video.id,
             thumbnail,
             viewCount: formatNumber(video.stats?.views || 0),
             duration: formatDuration(safeDuration),
             category: video.category || 'other',
             title: video.title || '未命名视频',
             views: video.stats?.views || 0,
             likes: video.stats?.likes || 0,
             uploadDate: safeUploadTime,
             hasSubtitles: false,
             isPrivate: video.isPrivate || false,
             engagement: video.qualityScore || 0
           };
         })
       );
       
       setUserVideos(convertedVideos);
       console.log('已加载用户视频:', convertedVideos.length, '个');
       console.log('转换后的视频列表:', convertedVideos);
       
       // 显示加载完成提示
       if (convertedVideos.length > 0) {
         success(`成功加载 ${convertedVideos.length} 个视频`);
       } else {
         warning('暂无视频内容，快去拍摄第一个视频吧！');
       }
     } catch (error) {
       console.error('Failed to load user videos:', error);
       warning('加载视频失败，请检查网络连接后重试');
       
       // 提供重试选项
       setTimeout(() => {
         if (confirm('视频加载失败，是否重试？')) {
           loadUserVideos();
         }
       }, 2000);
     } finally {
       setLoading(false);
     }
   };

   // 初始加载数据
   useEffect(() => {
     loadUserVideos();
   }, []);

   // 监听页面可见性变化，但添加防抖机制
   useEffect(() => {
     let timeoutId: NodeJS.Timeout;
     
     const handleVisibilityChange = () => {
       if (!document.hidden) {
         // 清除之前的定时器
         if (timeoutId) {
           clearTimeout(timeoutId);
         }
         // 延迟500ms后再加载数据，避免频繁请求
         timeoutId = setTimeout(() => {
           loadUserVideos();
         }, 500);
       }
     };

     document.addEventListener('visibilitychange', handleVisibilityChange);

     return () => {
       document.removeEventListener('visibilitychange', handleVisibilityChange);
       if (timeoutId) {
         clearTimeout(timeoutId);
       }
     };
   }, []);

  // 初始化编辑表单
  useEffect(() => {
    if (editingVideo) {
      setEditForm({
        title: editingVideo.title,
        category: editingVideo.category,
        isPrivate: editingVideo.isPrivate
      });
    }
  }, [editingVideo]);

  const likedVideos: VideoItem[] = [
    {
      id: '7',
      thumbnail: '', // 将通过LazyImageWithFallback组件处理
      viewCount: '25.8K',
      duration: '0:30',
      category: 'entertainment',
      title: '搞笑视频',
      views: 25800,
      likes: 1890,
      uploadDate: '2024-01-05',
      hasSubtitles: false,
      isPrivate: false,
      engagement: 7.3
    },
    {
      id: '8',
      thumbnail: '', // 将通过LazyImageWithFallback组件处理
      viewCount: '18.9K',
      duration: '3:45',
      category: 'tech',
      title: '学习教程',
      views: 18900,
      likes: 1234,
      uploadDate: '2024-01-03',
      hasSubtitles: true,
      isPrivate: false,
      engagement: 6.5
    }
  ];



  // 编辑资料相关状态
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState({
    nickname: '创作者昵称',
    bio: '这是一个简短的个人简介，介绍自己的兴趣爱好和创作方向。',
    avatar: '', // 将通过LazyImageWithFallback组件处理
    location: '北京',
    website: '',
    birthday: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 处理编辑资料按钮点击
  const handleEditProfile = () => {
    setShowProfileEditModal(true);
  };

  // 处理表单输入变化
  const handleFormChange = (field: string, value: string) => {
    setProfileEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 处理头像上传
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditForm(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 保存编辑资料
  const handleSaveProfile = async () => {
    if (!profileEditForm.nickname.trim()) {
      warning('昵称不能为空');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 模拟保存过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      success('资料更新成功！');
      setShowProfileEditModal(false);
    } catch (error) {
      warning('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setShowProfileEditModal(false);
    // 重置表单
    setProfileEditForm({
      nickname: '创作者昵称',
      bio: '这是一个简短的个人简介，介绍自己的兴趣爱好和创作方向。',
      avatar: '', // 将通过LazyImageWithFallback组件处理
      location: '北京',
      website: '',
      birthday: ''
    });
  };

  // 处理分享用户资料按钮点击
  const handleShareProfile = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `创作者昵称的个人主页`,
          text: `来看看创作者昵称的精彩内容！`,
          url: window.location.href
        });
        success('个人主页分享成功！');
      } else {
        // 复制链接到剪贴板
        await navigator.clipboard.writeText(window.location.href);
        success('个人主页链接已复制到剪贴板！');
      }
    } catch (error) {
      warning('分享失败，请重试');
    }
    console.log('分享用户资料');
  };

  // 处理粉丝互动按钮点击
  const handleInteractionClick = (type: string) => {
    console.log(`粉丝互动: ${type}`);
    
    // 打开社交互动系统
    setCurrentInteractionUserId('user_demo_001'); // 当前用户ID
    setShowSocialInteraction(true);
  };

  // 处理视频点击
  const handleVideoClick = async (video: VideoItem) => {
    console.log('点击视频:', video.id);
    console.log('视频详细信息:', video);
    
    // 从databaseRecommendationService获取完整的视频数据进行验证
      const fullVideoData = await databaseRecommendationService.getVideoById(video.id);
      console.log('从databaseRecommendationService获取的完整视频数据:', fullVideoData);
    
    if (fullVideoData && fullVideoData.videoUrl) {
      console.log('视频URL类型:', fullVideoData.videoUrl.startsWith('data:') ? 'base64' : fullVideoData.videoUrl.startsWith('blob:') ? 'blob' : 'http');
      console.log('视频URL长度:', fullVideoData.videoUrl.length);
      console.log('视频URL前100字符:', fullVideoData.videoUrl.substring(0, 100));
    } else {
      console.warn('警告: 视频数据不完整或缺少videoUrl');
    }
    
    // 导航到视频详情页面
    navigate(`/video/${video.id}`);
  };

  // 真实删除视频功能
  const handleDeleteVideo = async (videoId: string) => {
    try {
      info('正在删除作品...');
      
      // 获取视频详情以确认创建者
      const videoData = await databaseRecommendationService.getVideoById(videoId);
      if (!videoData) {
        warning('视频不存在');
        return;
      }
      
      // 使用视频的实际创建者ID进行删除
      const creatorId = videoData.creatorId || 'user_demo_001';
      console.log('删除视频:', videoId, '创建者:', creatorId);
      
      // 调用API删除视频
      await databaseRecommendationService.deleteVideo(videoId, creatorId);
      
      // 更新本地状态
      setUserVideos(prev => prev.filter(v => v.id !== videoId));
      
      success('作品已成功删除！');
    } catch (error) {
      warning('删除失败，请重试');
      console.error('删除视频失败:', error);
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (deletingVideoId) {
      await handleDeleteVideo(deletingVideoId);
      setShowDeleteConfirm(false);
      setDeletingVideoId(null);
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingVideoId(null);
  };

  // 保存编辑的视频
  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    
    try {
      info('正在保存修改...');
      
      // 模拟API调用更新视频信息
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新本地状态
      setUserVideos(prev => prev.map(video => 
        video.id === editingVideo.id 
          ? { ...video, title: editForm.title, category: editForm.category, isPrivate: editForm.isPrivate }
          : video
      ));
      
      // 更新databaseRecommendationService中的视频信息
      await databaseRecommendationService.updateVideo(editingVideo.id, {
        title: editForm.title,
        category: editForm.category,
        isPrivate: editForm.isPrivate
      });
      
      setShowEditModal(false);
      setEditingVideo(null);
      success('作品信息已更新！');
    } catch (error) {
      warning('保存失败，请重试');
      console.error('保存编辑失败:', error);
    }
  };

  // 处理个人作品更多按钮点击
  const handleMoreClick = (e: React.MouseEvent, videoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMoreMenuVideoId(videoId);
    setShowMoreMenu(true);
  };

  // 处理个人作品更多菜单选项
  const handleMoreMenuOption = (option: string) => {
    const video = userVideos.find(v => v.id === moreMenuVideoId);
    if (!video) return;
    
    setShowMoreMenu(false);
    setMoreMenuVideoId(null);
    
    switch (option) {
      case 'edit':
        // 实现真实的视频编辑功能
        setEditingVideo(video);
        setShowEditModal(true);
        info('正在打开编辑界面...');
        break;
      case 'delete':
        setDeletingVideoId(video.id);
        setShowDeleteConfirm(true);
        break;
      case 'share':
        // 分享作品链接
        const shareUrl = `${window.location.origin}/video/${video.id}`;
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
      case 'copyLink':
        // 复制视频链接
        const videoUrl = `${window.location.origin}/video/${video.id}`;
        navigator.clipboard.writeText(videoUrl);
        success('链接已复制到剪贴板！');
        break;
      case 'download':
        // 模拟视频下载
        info('开始下载视频...');
        setTimeout(() => {
          // 创建一个虚拟的下载链接
          const link = document.createElement('a');
          link.href = video.thumbnail; // 实际应该是视频文件URL
          link.download = `${video.title}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          success('视频下载完成！');
        }, 1000);
        break;
      case 'pin':
        // 置顶作品
        info('作品已置顶！');
        success('该作品将在个人主页优先展示');
        break;
      case 'analytics':
        // 数据分析
        info('正在打开数据分析页面...');
        navigate('/analytics', { state: { videoId: video.id } });
        break;
      case 'recommend':
        // 推荐设置
        info('正在优化推荐算法...');
        success('该作品已加入推荐池，将获得更多曝光机会！');
        break;
      case 'permissions':
        // 权限设置
        info('正在打开权限设置...');
        // 这里可以打开权限设置模态框
        break;
      default:
        break;
    }
  };

  // 关闭个人作品更多菜单
  const handleCloseMoreMenu = () => {
    setShowMoreMenu(false);
    setMoreMenuVideoId(null);
  };

  // 重置所有视频数据
  const handleResetAllVideos = async () => {
    try {
      setIsResetting(true);
      info('正在重置所有视频数据...');
      
      console.log('🚨 开始重置所有视频数据');
      console.log('👤 用户ID: user_demo_001');
      
      const result = await databaseRecommendationService.resetAllVideos('user_demo_001');
      
      console.log('📊 重置结果:', result);
      
      if (result.success) {
        // 清空本地视频列表
        setUserVideos([]);
        
        // 显示成功消息
        success(`成功重置所有视频数据！删除了 ${result.deletedCount} 个视频`);
        
        // 如果有错误信息（如离线模式），也显示出来
        if (result.error) {
          warning(result.error);
        }
      } else {
        console.error('❌ 重置失败:', result.error);
        warning(result.error || '重置失败，请重试');
      }
    } catch (error) {
      console.error('重置视频数据失败:', error);
      warning('重置失败，请检查网络连接后重试');
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  // 取消重置
  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  const getFilteredVideos = () => {
    let filtered = userVideos;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(video => video.category === filterType);
    }
    
    switch (sortBy) {
      case 'newest':
        return filtered.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      case 'popular':
        return filtered.sort((a, b) => b.views - a.views);
      case 'engagement':
        return filtered.sort((a, b) => b.engagement - a.engagement);
      default:
        return filtered;
    }
  };

  const categories = ['all', 'lifestyle', 'food', 'travel', 'music', 'entertainment', 'tech'];
  const categoryLabels = {
    all: '全部',
    lifestyle: '生活',
    food: '美食',
    travel: '旅行',
    music: '音乐',
    entertainment: '娱乐',
    tech: '科技'
  };

  const currentVideos = activeTab === 'videos' ? userVideos : likedVideos;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 用户信息区域 */}
      <div className="bg-white px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">个人主页</h1>
          <div className="flex gap-1 sm:gap-2">
             <button 
               onClick={() => navigate('/live-streaming')}
               className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
               title="开始直播"
             >
               <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
             </button>
             <button 
               onClick={() => navigate('/subtitle-center')}
               className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
               title="AI字幕中心"
             >
               <Subtitles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
             </button>
             <button 
               onClick={() => navigate('/wallet')}
               className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
               title="我的钱包"
             >
               <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
             </button>
             <button 
               onClick={() => navigate('/shop')}
               className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
               title="商城"
             >
               <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
             </button>
             <button 
               onClick={() => navigate('/ads')}
               className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
               title="广告中心"
             >
               <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
             </button>
             <button 
               onClick={() => navigate('/settings')}
               className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
               title="设置"
             >
               <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
             </button>
             <button 
               onClick={() => setShowResetConfirm(true)}
               className="p-1.5 sm:p-2 hover:bg-red-50 rounded-full transition-colors"
               title="重置数据"
             >
               <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
             </button>
           </div>
        </div>

        {/* 用户头像和基本信息 */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <img
            src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20portrait%20friendly%20young%20person&image_size=square"
            alt="用户头像"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mb-3 sm:mb-4"
          />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">创作者昵称</h2>
          <p className="text-xs sm:text-sm text-gray-600 text-center mb-3 sm:mb-4 px-4">
            分享生活中的美好瞬间 ✨<br />
            记录每一个值得纪念的时刻
          </p>

          {/* 统计数据 */}
          <div className="flex items-center space-x-6 sm:space-x-8 mb-3 sm:mb-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-semibold text-gray-800">{formatNumber(userStats.likes)}</div>
              <div className="text-xs sm:text-sm text-gray-600">获赞</div>
              <div className="text-green-500 text-xs">{userStats.growth.likes}</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-semibold text-gray-800">{formatNumber(userStats.followers)}</div>
              <div className="text-xs sm:text-sm text-gray-600">粉丝</div>
              <div className="text-green-500 text-xs">{userStats.growth.followers}</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-semibold text-gray-800">{formatNumber(userStats.following)}</div>
              <div className="text-xs sm:text-sm text-gray-600">关注</div>
            </div>
          </div>
          
          {/* 详细统计按钮 */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">详细数据</span>
            </button>
          </div>
          
          {/* 详细统计面板 */}
          {showStats && (
            <div className="bg-gray-100 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="text-gray-800 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">数据统计</h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-white p-2 sm:p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">总播放量</span>
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  </div>
                  <div className="text-gray-800 text-sm sm:text-lg font-semibold">{formatNumber(userStats.views)}</div>
                  <div className="text-green-500 text-xs">{userStats.growth.views}</div>
                </div>
                
                <div className="bg-white p-2 sm:p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">总分享数</span>
                    <Share className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  </div>
                  <div className="text-gray-800 text-sm sm:text-lg font-semibold">{formatNumber(userStats.shares)}</div>
                </div>
                
                <div className="bg-white p-2 sm:p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">总评论数</span>
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                  </div>
                  <div className="text-gray-800 text-sm sm:text-lg font-semibold">{formatNumber(userStats.comments)}</div>
                </div>
                
                <div className="bg-white p-2 sm:p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">平均观看时长</span>
                    <Play className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                  </div>
                  <div className="text-gray-800 text-sm sm:text-lg font-semibold">{userStats.avgWatchTime}</div>
                </div>
                
                <div className="bg-white p-2 sm:p-3 rounded col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">互动率</span>
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  </div>
                  <div className="text-gray-800 text-sm sm:text-lg font-semibold">{userStats.engagement}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-2">
                    <div 
                      className="bg-yellow-500 h-1.5 sm:h-2 rounded-full" 
                      style={{ width: `${userStats.engagement * 10}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-2 sm:space-x-3">
            <button 
              onClick={handleEditProfile}
              className="flex-1 bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >编辑资料</button>
            <button 
              onClick={() => navigate('/drafts')}
              className="p-1.5 sm:p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              title="草稿管理"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setShowInteractionPanel(!showInteractionPanel)}
              className="p-1.5 sm:p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button 
              onClick={handleShareProfile}
              className="p-1.5 sm:p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              <Share className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>

          </div>
          
          {/* 粉丝互动面板 */}
          {showInteractionPanel && (
            <div className="bg-gray-100 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
              <h3 className="text-gray-800 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">粉丝互动</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button 
                  onClick={() => handleInteractionClick('like')}
                  className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-2 sm:p-3 rounded-lg flex flex-col items-center space-y-1 hover:scale-105 transition-transform"
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs">点赞</span>
                </button>
                <button 
                  onClick={() => handleInteractionClick('gift')}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-2 sm:p-3 rounded-lg flex flex-col items-center space-y-1 hover:scale-105 transition-transform"
                >
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs">送礼</span>
                </button>
                <button 
                  onClick={() => handleInteractionClick('favorite')}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-2 sm:p-3 rounded-lg flex flex-col items-center space-y-1 hover:scale-105 transition-transform"
                >
                  <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs">收藏</span>
                </button>
                <button 
                  onClick={() => handleInteractionClick('notify')}
                  className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-2 sm:p-3 rounded-lg flex flex-col items-center space-y-1 hover:scale-105 transition-transform"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs">提醒</span>
                </button>
                <button 
                  onClick={() => handleInteractionClick('reward')}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-2 sm:p-3 rounded-lg flex flex-col items-center space-y-1 hover:scale-105 transition-transform"
                >
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs">打赏</span>
                </button>
                <button 
                  onClick={() => handleInteractionClick('download')}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-2 sm:p-3 rounded-lg flex flex-col items-center space-y-1 hover:scale-105 transition-transform"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs">下载</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 内容切换标签 */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-2.5 sm:py-3 text-center font-medium transition-colors ${
              activeTab === 'videos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <span className="text-sm sm:text-base">作品</span>
              <span className="bg-blue-600 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded-full">{userVideos.length}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 py-2.5 sm:py-3 text-center font-medium transition-colors ${
              activeTab === 'drafts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <DraftStatusIndicator variant="button" />
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex-1 py-2.5 sm:py-3 text-center font-medium transition-colors ${
              activeTab === 'likes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-sm sm:text-base">喜欢</span>
              <span className="text-xs">{likedVideos.length}</span>
            </div>
          </button>
        </div>
        
        {/* 筛选和排序 */}
        {activeTab === 'videos' && (
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                <span className="text-gray-500 text-xs sm:text-sm">筛选:</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-gray-500 text-xs sm:text-sm">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white text-gray-700 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-gray-300"
                >
                  <option value="newest">最新</option>
                  <option value="popular">最热</option>
                  <option value="engagement">互动最多</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto scrollbar-hide">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilterType(category)}
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors ${
                    filterType === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 视频网格 */}
      <div className="p-3 sm:p-4">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'videos' && (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {getFilteredVideos().map((video) => (
              <div 
                key={video.id} 
                className="relative aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                <LazyImageWithFallback
                  src={video.thumbnail}
                  alt="视频缩略图"
                  className="w-full h-full object-cover"
                />
                
                {/* 播放图标 */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-current" />
                </div>
                
                {/* 视频标识 */}
                <div className="absolute top-6 sm:top-8 left-1 sm:left-2 flex space-x-1">
                  {video.hasSubtitles && (
                    <div className="bg-blue-600 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded">
                      字幕
                    </div>
                  )}
                  {video.isPrivate && (
                    <div className="bg-red-600 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded">
                      私密
                    </div>
                  )}
                </div>
                
                {/* 更多按钮 */}
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                  <button
                    onClick={(e) => handleMoreClick(e, video.id)}
                    className="p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </button>
                </div>
                
                {/* 互动率指示器 */}
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    video.engagement >= 9 ? 'bg-green-400' :
                    video.engagement >= 7 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                </div>
                
                {/* 视频信息 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 sm:p-2">
                  <div className="text-white text-xs mb-1 truncate">{video.title}</div>
                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="flex items-center space-x-0.5 sm:space-x-1">
                        <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="text-xs">{formatNumber(video.views)}</span>
                      </span>
                      <span className="flex items-center space-x-0.5 sm:space-x-1">
                        <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="text-xs">{formatNumber(video.likes)}</span>
                      </span>
                    </div>
                    <span className="text-xs">{video.duration}</span>
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5 sm:mt-1">
                    {new Date(video.uploadDate).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'likes' && (
          currentVideos.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {currentVideos.map((video) => (
                <div 
                  key={video.id} 
                  className="relative aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden group cursor-pointer"
                  onClick={() => handleVideoClick(video)}
                >
                  <LazyImageWithFallback
                    src={video.thumbnail}
                    alt="视频缩略图"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 播放图标 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-current" />
                  </div>
                  
                  {/* 视频标识 */}
                  <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex space-x-1">
                    {video.hasSubtitles && (
                      <div className="bg-blue-600 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded">
                        字幕
                      </div>
                    )}
                    {video.isPrivate && (
                      <div className="bg-red-600 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded">
                        私密
                      </div>
                    )}
                  </div>
                  
                  {/* 互动率指示器 */}
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      video.engagement >= 9 ? 'bg-green-400' :
                      video.engagement >= 7 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                  
                  {/* 视频信息 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 sm:p-2">
                    <div className="text-white text-xs mb-1 truncate">{video.title}</div>
                    <div className="flex items-center justify-between text-white text-xs">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className="flex items-center space-x-0.5 sm:space-x-1">
                          <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="text-xs">{formatNumber(video.views)}</span>
                        </span>
                        <span className="flex items-center space-x-0.5 sm:space-x-1">
                          <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="text-xs">{formatNumber(video.likes)}</span>
                        </span>
                      </div>
                      <span className="text-xs">{video.duration}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5 sm:mt-1">
                      {new Date(video.uploadDate).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Heart className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">还没有喜欢的内容</h3>
              <p className="text-sm text-gray-400 text-center px-8">
                去发现页面找找感兴趣的内容吧！
              </p>
            </div>
          )
        )}
        
        {activeTab === 'drafts' && (
          <div className="space-y-4">
            <DraftStatusIndicator variant="card" />
          </div>
        )}
        
        {activeTab === 'videos' && getFilteredVideos().length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <Play className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">开始你的创作之旅</h3>
            <p className="text-sm text-gray-500 text-center px-8 mb-6 leading-relaxed">
              还没有发布任何作品呢！<br />
              拍摄你的第一个精彩瞬间，与世界分享你的故事
            </p>
            <button
              onClick={() => window.location.href = '/camera'}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              开始创作
            </button>
          </div>
        )}
      </div>

      {/* 编辑资料模态框 */}
      {showProfileEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">编辑资料</h2>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* 头像上传 */}
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <div className="relative">
                  <img
                    src={profileEditForm.avatar}
                    alt="头像预览"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-gray-200"
                  />
                  <button
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                  >
                    <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <p className="text-xs sm:text-sm text-gray-500">点击相机图标更换头像</p>
              </div>

              {/* 昵称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  昵称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileEditForm.nickname}
                  onChange={(e) => handleFormChange('nickname', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入昵称"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">{profileEditForm.nickname.length}/20</p>
              </div>

              {/* 个人简介 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  个人简介
                </label>
                <textarea
                  value={profileEditForm.bio}
                  onChange={(e) => handleFormChange('bio', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="介绍一下自己吧..."
                  rows={3}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{profileEditForm.bio.length}/100</p>
              </div>

              {/* 所在地 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所在地
                </label>
                <input
                  type="text"
                  value={profileEditForm.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入所在地"
                />
              </div>

              {/* 个人网站 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  个人网站
                </label>
                <input
                  type="url"
                  value={profileEditForm.website}
                  onChange={(e) => handleFormChange('website', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              {/* 生日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生日
                </label>
                <input
                  type="date"
                  value={profileEditForm.birthday}
                  onChange={(e) => handleFormChange('birthday', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 模态框底部按钮 */}
            <div className="flex space-x-3 p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSubmitting || !profileEditForm.nickname.trim()}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-xs sm:text-sm">保存中...</span>
                  </>
                ) : (
                  '保存'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 个人作品更多选项菜单 */}
      {showMoreMenu && moreMenuVideoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[1000]" onClick={handleCloseMoreMenu}>
          <div className="bg-white rounded-t-2xl w-full max-w-md mx-4 mb-0 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">作品管理</h3>
              
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
                  onClick={handleCloseMoreMenu}
                  className="w-full flex items-center justify-center p-3 mt-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <span className="text-gray-700 font-medium">取消</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑视频模态框 */}
      {showEditModal && editingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">编辑作品</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标题
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入视频标题"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="entertainment">娱乐</option>
                    <option value="tech">科技</option>
                    <option value="lifestyle">生活</option>
                    <option value="education">教育</option>
                    <option value="music">音乐</option>
                    <option value="sports">体育</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={editForm.isPrivate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700">
                    设为私密作品
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                删除作品
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                确定要删除这个作品吗？此操作不可撤销，删除后将无法恢复。
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 重置数据确认对话框 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
                ⚠️ 危险操作
              </h3>
              
              <h4 className="text-lg font-medium text-red-600 text-center mb-4">
                重置所有视频数据
              </h4>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm leading-relaxed">
                  <strong>警告：</strong>此操作将永久删除您的所有视频作品，包括：
                </p>
                <ul className="text-red-700 text-sm mt-2 space-y-1 ml-4">
                  <li>• 所有已发布的视频内容</li>
                  <li>• 视频的观看数据和统计信息</li>
                  <li>• 相关的用户行为记录</li>
                  <li>• 视频缩略图和元数据</li>
                </ul>
                <p className="text-red-800 text-sm mt-3 font-medium">
                  此操作不可撤销，删除后无法恢复！
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-yellow-800 text-sm">
                  💡 <strong>建议：</strong>在执行重置前，请确保您已经备份了重要的视频内容。
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelReset}
                  disabled={isResetting}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleResetAllVideos}
                  disabled={isResetting}
                  className="flex-1 px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      重置中...
                    </>
                  ) : (
                    '确认重置'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 社交互动系统 - z-index: 1100 */}
      {showSocialInteraction && currentInteractionUserId && (
        <SocialInteractionSystem
          userId={currentInteractionUserId}
          onClose={() => {
            setShowSocialInteraction(false);
            setCurrentInteractionUserId(null);
          }}
        />
      )}
    </div>
  );
};