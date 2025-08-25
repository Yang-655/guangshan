import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Edit, Search, Radio, User, Volume2, VolumeX, Subtitles, MoreHorizontal, MapPin, Users, Gift, ShoppingBag, Plus, Play, Grid3X3, Loader2, RefreshCw, X, ThumbsDown, Flag, Star, Download, Link, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SubtitleDisplay from '../components/SubtitleDisplay';
import VideoPlayer from '../components/VideoPlayer';
import LazyImageWithFallback from '../components/LazyImageWithFallback';
import { useToast } from '../components/Toast';
import { useRecommendation, useRecommendationBehavior } from '../hooks/useRecommendation';
import { recommendationService } from '../utils/recommendationService';
import CommentSystem from '../components/CommentSystem';
import DraftStatusIndicator from '../components/DraftStatusIndicator';

interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  language: string;
}

interface VideoData {
  id: string;
  videoUrl: string;
  thumbnail: string;
  user: {
    id: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  description: string;
  music: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
  isFollowing: boolean;
  subtitles: Subtitle[];
  recommendationReason?: string; // 推荐原因
}

export default function Home() {
  const navigate = useNavigate();
  const { success, error, info, warning } = useToast();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSubtitlesVisible, setIsSubtitlesVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [pinchStartDistance, setPinchStartDistance] = useState(0);
  const [pinchCurrentDistance, setPinchCurrentDistance] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  const [mouseTimer, setMouseTimer] = useState<NodeJS.Timeout | null>(null);
  const [showUIInImmersive, setShowUIInImmersive] = useState(false);
  
  // 推荐功能相关状态
  const [userId] = useState('user_demo_001'); // 模拟用户ID
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [selectedVideoForFeedback, setSelectedVideoForFeedback] = useState<string | null>(null);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [pullRefreshOffset, setPullRefreshOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  
  // 推荐Hook
  const {
    recommendations,
    isLoading: isRecommendationLoading,
    isRefreshing,
    hasMore,
    refreshRecommendations,
    loadMoreRecommendations,
    markAsNotInterested,
    markAsViewed
  } = useRecommendation({ userId, initialCount: 15 });
  
  // 行为记录Hook
  const {
    recordLike,
    recordComment,
    recordShare,
    recordView,
    recordSkip
  } = useRecommendationBehavior(userId);
  
  // 搜索相关状态
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // 长按加速相关状态
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [accelerationSpeed, setAccelerationSpeed] = useState(1);
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  
  // 滑动相关状态
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeVelocity, setSwipeVelocity] = useState(0);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const [nextVideoPreview, setNextVideoPreview] = useState<VideoData | null>(null);
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  
  // 地理位置和碰面功能状态
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [meetingEnabled, setMeetingEnabled] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<any[]>([]);
  
  // 加载状态
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isEnablingMeeting, setIsEnablingMeeting] = useState(false);
  
  // 更多菜单状态
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [moreMenuVideoId, setMoreMenuVideoId] = useState<string | null>(null);
  
  // 评论系统状态
  const [showCommentSystem, setShowCommentSystem] = useState(false);
  const [currentCommentVideoId, setCurrentCommentVideoId] = useState<string | null>(null);
  
  // 防抖和点击反馈状态
  const [lastLocationClick, setLastLocationClick] = useState(0);
  const [lastMeetingClick, setLastMeetingClick] = useState(0);
  const [locationButtonClicked, setLocationButtonClicked] = useState(false);
  const [meetingButtonClicked, setMeetingButtonClicked] = useState(false);
  // 将推荐数据转换为视频数据格式
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [videoLikeStates, setVideoLikeStates] = useState<Record<string, boolean>>({});
  const [videoFollowStates, setVideoFollowStates] = useState<Record<string, boolean>>({});
  
  // 转换推荐数据为视频数据
  useEffect(() => {
    const convertRecommendations = async () => {
      if (recommendations.length > 0) {
        const convertedVideos: VideoData[] = await Promise.all(recommendations.map(async (rec, index) => {
        // 从recommendationService获取真实的视频数据
      const videoData = await recommendationService.getVideoById(rec.videoId);
        
        if (videoData) {
          // 使用真实的视频数据
          console.log('🔍 Home页面处理视频缩略图:', {
            videoId: videoData.id,
            title: videoData.title,
            hasThumbnailUrl: !!videoData.thumbnailUrl,
            thumbnailType: videoData.thumbnailUrl ? typeof videoData.thumbnailUrl : 'undefined',
            isDataUrl: videoData.thumbnailUrl ? videoData.thumbnailUrl.startsWith('data:') : false,
            thumbnailSize: videoData.thumbnailUrl ? Math.round(videoData.thumbnailUrl.length / 1024) + ' KB' : 'N/A'
          });
          
          // 优先使用数据库中的真实缩略图
          let thumbnail = '';
          if (videoData.thumbnailUrl && videoData.thumbnailUrl.trim() !== '') {
            console.log('✅ Home页面使用数据库中的缩略图:', {
              isBase64: videoData.thumbnailUrl.startsWith('data:'),
              size: Math.round(videoData.thumbnailUrl.length / 1024) + ' KB'
            });
            thumbnail = videoData.thumbnailUrl;
          } else {
            console.log('⚠️ Home页面数据库中无缩略图，使用透明背景');
            thumbnail = ''; // 不使用任何fallback，显示透明背景
          }
          
          return {
            id: videoData.id,
            videoUrl: videoData.videoUrl || `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`, // 使用实际视频URL，如果没有则使用示例URL
            thumbnail: thumbnail,
            user: {
              id: videoData.creatorId,
              username: videoData.creatorId === 'user_demo_001' ? '创作者昵称' : 'creator_user',
              avatar: '', // 不使用AI生成头像
              isVerified: false
            },
            description: videoData.description || '精彩视频分享！',
            music: '原创音乐',
            stats: {
              likes: videoData.stats.likes || 0,
              comments: videoData.stats.comments || 0,
              shares: videoData.stats.shares || 0
            },
            isLiked: videoLikeStates[rec.videoId] || false,
            isFollowing: videoFollowStates[rec.videoId] || false,
            subtitles: [
              {
                id: '1',
                text: videoData.description || '精彩视频分享',
                startTime: 0,
                endTime: 3,
                language: 'zh-CN'
              },
              {
                id: '2',
                text: rec.reason || '为你推荐',
                startTime: 3,
                endTime: 6,
                language: 'zh-CN'
              }
            ],
            recommendationReason: rec.reason
          };
        } else {
          // 如果找不到真实数据，使用默认数据
          const categories = ['美食', '旅行', '生活', '音乐', '舞蹈', '搞笑', '教育', '科技'];
          const category = rec.category || categories[index % categories.length];
          
          console.log('⚠️ Home页面未找到真实视频数据，使用默认数据');
          return {
            id: rec.videoId,
            videoUrl: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`, // 使用示例视频
            thumbnail: '', // 不使用AI生成，显示透明背景
            user: {
              id: `creator_${index}`,
              username: `${category}达人${index + 1}`,
              avatar: '', // 不使用AI生成头像
              isVerified: Math.random() > 0.5
            },
            description: `精彩的${category}内容分享！${rec.reason ? ` (${rec.reason})` : ''} #${category}`,
            music: `原创音乐 - ${category}达人${index + 1}`,
            stats: {
              likes: Math.floor(Math.random() * 50000) + 1000,
              comments: Math.floor(Math.random() * 2000) + 50,
              shares: Math.floor(Math.random() * 500) + 10
            },
            isLiked: videoLikeStates[rec.videoId] || false,
            isFollowing: videoFollowStates[rec.videoId] || false,
            subtitles: [
              {
                id: '1',
                text: `这是一个关于${category}的精彩视频`,
                startTime: 0,
                endTime: 3,
                language: 'zh-CN'
              },
              {
                id: '2',
                text: rec.reason || '为你推荐',
                startTime: 3,
                endTime: 6,
                language: 'zh-CN'
              }
            ],
            recommendationReason: rec.reason
          };
        }
        }));
        
        setVideos(convertedVideos);
      } else if (!isRecommendationLoading && recommendations.length === 0) {
      // 如果推荐数据为空且不在加载中，提供默认视频内容
      const defaultVideos: VideoData[] = [
        {
          id: 'default_1',
          videoUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=welcome%20video%20content&image_size=portrait_16_9',
          thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=welcome%20video%20thumbnail&image_size=portrait_16_9',
          user: {
            id: 'system',
            username: '光闪官方',
            avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=official%20avatar&image_size=square',
            isVerified: true
          },
          description: '欢迎来到光闪！这里有最精彩的短视频内容等你发现 ✨ #欢迎',
          music: '原创音乐 - 光闪官方',
          stats: {
            likes: 10000,
            comments: 500,
            shares: 100
          },
          isLiked: false,
          isFollowing: false,
          subtitles: [
            {
              id: '1',
              text: '欢迎来到光闪短视频平台',
              startTime: 0,
              endTime: 3,
              language: 'zh-CN'
            },
            {
              id: '2',
              text: '发现更多精彩内容',
              startTime: 3,
              endTime: 6,
              language: 'zh-CN'
            }
          ],
          recommendationReason: '欢迎使用光闪'
        }
      ];
        setVideos(defaultVideos);
      }
    };
    
    convertRecommendations();
  }, [recommendations, videoLikeStates, videoFollowStates, isRecommendationLoading]);

  // 页面焦点事件监听，用于刷新推荐内容（添加防抖机制）
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 清除之前的定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        // 延迟1秒后再刷新推荐，避免频繁请求
        timeoutId = setTimeout(() => {
          refreshRecommendations();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [refreshRecommendations]);

  const videoRefs = useRef<(HTMLImageElement | null)[]>([]);

  // 视频观看时长记录
  const [videoStartTime, setVideoStartTime] = useState<number>(0);
  const [lastRecordedVideo, setLastRecordedVideo] = useState<string>('');
  
  // 模拟视频播放时间更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => (prev + 0.1) % 10); // 模拟10秒循环
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  // 记录视频观看开始时间
  useEffect(() => {
    const video = videos[currentVideoIndex];
    if (video && video.id !== lastRecordedVideo) {
      setVideoStartTime(Date.now());
      setLastRecordedVideo(video.id);
      markAsViewed(video.id);
    }
  }, [currentVideoIndex, videos, lastRecordedVideo, markAsViewed]);
  
  // 记录视频观看时长
  useEffect(() => {
    return () => {
      if (videoStartTime > 0 && lastRecordedVideo) {
        const watchTime = (Date.now() - videoStartTime) / 1000;
        const video = videos.find(v => v.id === lastRecordedVideo);
        if (video && watchTime > 1) { // 至少观看1秒才记录
          recordView(lastRecordedVideo, watchTime,
            video.description.includes('#') ? 
              video.description.split('#')[1]?.split(' ')[0] || '其他' : '其他',
            video.description.match(/#\w+/g) || []
          );
        }
      }
    };
  }, [videoStartTime, lastRecordedVideo, videos, recordView]);
  
  // 优化无限滚动检测和预加载
  useEffect(() => {
    // 提前加载更多内容，改善用户体验
    if (currentVideoIndex >= videos.length - 5 && hasMore && !isRecommendationLoading) {
      loadMoreRecommendations();
    }
    
    // 预加载下一个视频的元数据
    if (currentVideoIndex < videos.length - 1) {
      const nextVideo = videos[currentVideoIndex + 1];
      if (nextVideo?.videoUrl) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = nextVideo.videoUrl;
        video.load();
      }
    }
  }, [currentVideoIndex, videos.length, hasMore, isRecommendationLoading, loadMoreRecommendations, videos]);

  // 沉浸式模式ESC键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImmersiveMode) {
        setIsImmersiveMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImmersiveMode]);

  // 临时移除自定义非被动触摸事件监听器，稍后在函数定义后添加

  // 沉浸式模式下的鼠标移动处理
  const handleMouseMove = () => {
    if (!isImmersiveMode) return;
    
    setShowUIInImmersive(true);
    
    if (mouseTimer) {
      clearTimeout(mouseTimer);
    }
    
    const timer = setTimeout(() => {
      setShowUIInImmersive(false);
    }, 3000);
    
    setMouseTimer(timer);
  };

  // 计算两点间距离
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 手势控制沉浸式模式
  const handlePinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setPinchStartDistance(distance);
      setPinchCurrentDistance(distance);
      setIsPinching(true);
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setPinchCurrentDistance(distance);
    }
  };

  const handlePinchEnd = () => {
    if (isPinching && pinchStartDistance > 0) {
      const scale = pinchCurrentDistance / pinchStartDistance;
      
      // 放大手势进入沉浸模式 (scale > 1.2)
      if (scale > 1.2 && !isImmersiveMode) {
        setIsImmersiveMode(true);
        setShowUIInImmersive(true);
        // 3秒后自动隐藏UI
        setTimeout(() => {
          setShowUIInImmersive(false);
        }, 3000);
      }
      // 缩小手势退出沉浸模式 (scale < 0.8)
      else if (scale < 0.8 && isImmersiveMode) {
        setIsImmersiveMode(false);
      }
    }
    
    setIsPinching(false);
    setPinchStartDistance(0);
    setPinchCurrentDistance(0);
  };

  // 触摸开始处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    const touch = e.touches[0];
    const startY = touch.clientY;
    const startX = touch.clientX;
    const startTime = Date.now();
    
    setTouchStartY(startY);
    setTouchStartX(startX);
    setTouchStartTime(startTime);
    setIsDragging(false);
    setDragOffset(0);
    
    // 长按检测
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    const timer = setTimeout(() => {
      if (!isDragging) {
        setIsLongPressing(true);
        setAccelerationSpeed(2);
        setShowSpeedIndicator(true);
        
        setTimeout(() => {
          if (isLongPressing) {
            setAccelerationSpeed(3);
          }
        }, 1000);
      }
    }, 500);
    
    setLongPressTimer(timer);
  };
  
  // 触摸移动处理（优化性能和响应性）
  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const currentX = touch.clientX;
    
    const deltaY = currentY - touchStartY;
    const deltaX = currentX - touchStartX;
    const absDeltaY = Math.abs(deltaY);
    const absDeltaX = Math.abs(deltaX);
    
    // 判断是否为垂直滑动（降低阈值提高响应性）
    if (absDeltaY > 5 && absDeltaY > absDeltaX * 1.2) {
      // 安全地调用preventDefault，避免被动监听器错误
      try {
        if (e.cancelable !== false && typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
      } catch (error) {
        // 静默处理preventDefault错误
        console.debug('preventDefault failed:', error);
      }
      
      if (!isDragging) {
        setIsDragging(true);
        // 取消长按
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }
        if (isLongPressing) {
          setIsLongPressing(false);
          setAccelerationSpeed(1);
          setShowSpeedIndicator(false);
        }
      }
      
      // 优化阻尼效果，提供更自然的滑动感觉
      const dampingFactor = 0.4; // 增加阻尼系数
      const maxOffset = window.innerHeight * 0.35; // 增加最大偏移
      let offset = deltaY * dampingFactor;
      
      // 改进边界处理，提供更好的反弹效果
      if (currentVideoIndex === 0 && deltaY > 0) {
        const boundaryDamping = Math.max(0.1, 1 - (deltaY / (window.innerHeight * 0.5)));
        offset = Math.min(offset * boundaryDamping, maxOffset * 0.6);
      } else if (currentVideoIndex === videos.length - 1 && deltaY < 0) {
        const boundaryDamping = Math.max(0.1, 1 - (Math.abs(deltaY) / (window.innerHeight * 0.5)));
        offset = Math.max(offset * boundaryDamping, -maxOffset * 0.6);
      } else {
        offset = Math.max(-maxOffset, Math.min(maxOffset, offset));
      }
      
      // 使用 requestAnimationFrame 优化性能
      requestAnimationFrame(() => {
        setDragOffset(offset);
        
        // 显示滑动方向指示器（降低阈值）
        if (Math.abs(deltaY) > 20) {
          setShowSwipeIndicator(true);
          setSwipeDirection(deltaY < 0 ? 'up' : 'down');
        }
      });
    }
  }, [isTransitioning, touchStartY, touchStartX, isDragging, longPressTimer, isLongPressing, currentVideoIndex, videos.length]);
  
  // 触摸结束处理
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    const endTime = Date.now();
    const duration = endTime - touchStartTime;
    const deltaY = dragOffset / 0.3; // 还原真实滑动距离
    
    // 清理长按定时器
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (isDragging) {
       // 计算滑动速度（像素/毫秒）
       const velocity = Math.abs(deltaY) / duration;
       setSwipeVelocity(velocity);
       
       // 优化动态阈值：根据滑动速度和距离调整
       const baseThreshold = window.innerHeight * 0.12; // 降低基础阈值
       const fastSwipeThreshold = 0.6; // 降低快速滑动阈值
       const superFastThreshold = 1.2; // 降低超快速滑动阈值
       
       let threshold = baseThreshold;
       let animationDuration = 250; // 缩短动画时间，提高响应性
       
       // 根据速度调整阈值和动画时间
       if (velocity > superFastThreshold) {
         // 超快速滑动：降低阈值，加快动画
         threshold = baseThreshold * 0.3;
         animationDuration = 150;
       } else if (velocity > fastSwipeThreshold) {
         // 快速滑动：适中阈值和动画
         threshold = baseThreshold * 0.6;
         animationDuration = 200;
       } else {
         // 慢速滑动：保持原阈值，稍慢动画
         threshold = baseThreshold;
         animationDuration = 350;
       }
       
       let shouldSwitch = false;
       let direction = 0;
       
       // 判断是否切换视频
       if (velocity > fastSwipeThreshold || Math.abs(deltaY) > threshold) {
         if (deltaY < 0 && currentVideoIndex < videos.length - 1) {
           // 上滑，下一个视频
           direction = 1;
           shouldSwitch = true;
         } else if (deltaY > 0 && currentVideoIndex > 0) {
           // 下滑，上一个视频
           direction = -1;
           shouldSwitch = true;
         }
       }
       
       if (shouldSwitch) {
         // 触觉反馈（如果支持）
         if ('vibrate' in navigator) {
           navigator.vibrate(50);
         }
         
         // 根据速度调整切换动画
         switchVideoWithVelocity(direction, velocity);
       } else {
         // 回弹动画，时间根据速度调整
         setIsTransitioning(true);
         setDragOffset(0);
         setTimeout(() => {
           setIsTransitioning(false);
         }, animationDuration);
       }
       
       // 隐藏滑动指示器
       setShowSwipeIndicator(false);
       setSwipeDirection(null);
       setIsDragging(false);
    } else if (isLongPressing) {
      // 长按结束
      setIsLongPressing(false);
      setAccelerationSpeed(1);
      setShowSpeedIndicator(false);
    } else {
      // 普通点击 - 移除沉浸模式切换，改为手势控制
      // 不再处理点击切换沉浸模式
    }
  };
  
  // 切换视频（基础版本）
  const switchVideo = (direction: number) => {
    switchVideoWithVelocity(direction, 0.5);
  };
  
  // 根据滑动速度切换视频
  const switchVideoWithVelocity = (direction: number, velocity: number) => {
    setIsTransitioning(true);
    setDragOffset(0);
    
    // 根据速度调整动画时间
    const baseDelay = 150;
    const fadeDelay = 100;
    
    let switchDelay = baseDelay;
    let fadeInDelay = fadeDelay;
    
    if (velocity > 1.5) {
      // 超快速：减少延迟
      switchDelay = 80;
      fadeInDelay = 50;
    } else if (velocity > 0.8) {
      // 快速：适中延迟
      switchDelay = 120;
      fadeInDelay = 80;
    }
    
    // 预加载下一个视频
    const newIndex = currentVideoIndex + direction;
    if (newIndex >= 0 && newIndex < videos.length) {
      setNextVideoPreview(videos[newIndex]);
    }
    
    // 淡出当前视频，速度越快淡出越快
    const fadeOutOpacity = velocity > 1.0 ? 0.5 : 0.7;
    setVideoOpacity(fadeOutOpacity);
    
    setTimeout(() => {
      setCurrentVideoIndex(prev => {
        const newIndex = prev + direction;
        return Math.max(0, Math.min(videos.length - 1, newIndex));
      });
      
      // 淡入新视频
      setTimeout(() => {
        setVideoOpacity(1);
        setNextVideoPreview(null);
        setIsTransitioning(false);
      }, fadeInDelay);
    }, switchDelay);
  };
  
  // 长按开始处理（鼠标事件）
  const handleLongPressStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (longPressTimer || isLongPressing || isDragging) {
      return;
    }
    
    const timer = setTimeout(() => {
      setIsLongPressing(true);
      setAccelerationSpeed(2);
      setShowSpeedIndicator(true);
      
      setTimeout(() => {
        if (isLongPressing) {
          setAccelerationSpeed(3);
        }
      }, 1000);
    }, 500);
    
    setLongPressTimer(timer);
  };

  // 长按结束处理（鼠标事件）
  const handleLongPressEnd = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (isLongPressing) {
      setIsLongPressing(false);
      setAccelerationSpeed(1);
      setShowSpeedIndicator(false);
    }
  };

  // 视频播放器引用
  const videoPlayerRef = useRef<any>(null);

  // 处理视频交互（区分点击和长按）
  const handleVideoInteraction = (e: React.MouseEvent) => {
    if (isLongPressing) {
      // 长按状态下不处理点击
      return;
    }
    
    // 检查点击目标是否为按钮或其子元素
    const target = e.target as HTMLElement;
    const isButton = target.closest('button') !== null;
    
    // 如果点击的是按钮区域，不处理视频交互
    if (isButton) {
      return;
    }
    
    // 点击视频区域播放/暂停
    if (videoPlayerRef.current && videoPlayerRef.current.togglePlay) {
      videoPlayerRef.current.togglePlay();
    }
  };

  // 清理定时器和优化性能
  useEffect(() => {
    return () => {
      if (mouseTimer) {
        clearTimeout(mouseTimer);
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [mouseTimer, longPressTimer]);
  
  // 防止内存泄漏，重置状态
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        if (isTransitioning) {
          setIsTransitioning(false);
          setDragOffset(0);
        }
      }, 1000); // 最大过渡时间保护
      
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);
  
  // 优化触摸事件性能
  useEffect(() => {
    const handleTouchMovePassive = (e: TouchEvent) => {
      if (isDragging && e.cancelable) {
        e.preventDefault();
      }
    };
    
    // 使用非被动监听器以支持preventDefault
    const options = { passive: false, capture: false };
    document.addEventListener('touchmove', handleTouchMovePassive, options);
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMovePassive, options);
    };
  }, [isDragging]);

  // 下拉刷新处理
  const handlePullRefresh = useCallback(async () => {
    if (isPullRefreshing || isRefreshing) return;
    
    setIsPullRefreshing(true);
    try {
      await refreshRecommendations();
      setCurrentVideoIndex(0);
    } catch (err) {
      error('刷新失败，请重试');
    } finally {
      setIsPullRefreshing(false);
      setPullRefreshOffset(0);
    }
  }, [isPullRefreshing, isRefreshing, refreshRecommendations, error]);

  // 触摸开始处理（下拉刷新）
  const handleTouchStartRefresh = useCallback((e: React.TouchEvent) => {
    if (currentVideoIndex === 0 && !isImmersiveMode && !isTransitioning) {
      setStartY(e.touches[0].clientY);
      setPullRefreshOffset(0); // 重置下拉刷新偏移
    }
  }, [currentVideoIndex, isImmersiveMode, isTransitioning]);

  // 触摸移动处理（下拉刷新）
  const handleTouchMoveRefresh = useCallback((e: React.TouchEvent) => {
    if (startY === 0 || currentVideoIndex !== 0 || isImmersiveMode || isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    // 只有在第一个视频且向下滑动时才处理下拉刷新
    if (distance > 0 && distance < 120) {
      setPullRefreshOffset(distance);
      // 安全地调用preventDefault，避免被动监听器错误
      try {
        if (e.cancelable !== false && typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
      } catch (error) {
        // 静默处理preventDefault错误
        console.debug('preventDefault failed:', error);
      }
    }
  }, [startY, currentVideoIndex, isImmersiveMode, isDragging]);

  // 触摸结束处理（下拉刷新）
  const handleTouchEndRefresh = useCallback(() => {
    if (currentVideoIndex === 0 && !isImmersiveMode) {
      if (pullRefreshOffset > 80) {
        handlePullRefresh();
      } else {
        setPullRefreshOffset(0);
      }
      setStartY(0);
    }
  }, [pullRefreshOffset, handlePullRefresh, currentVideoIndex, isImmersiveMode]);

  const handleLike = useCallback((videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    
    const newIsLiked = !video.isLiked;
    
    // 更新本地状态
    setVideoLikeStates(prev => ({ ...prev, [videoId]: newIsLiked }));
    
    // 记录用户行为
    if (newIsLiked) {
      recordLike(videoId, video.description.includes('#') ? 
        video.description.split('#')[1]?.split(' ')[0] || '其他' : '其他', 
        video.description.match(/#\w+/g) || []
      );
    }
    
    success(newIsLiked ? '已点赞' : '已取消点赞');
  }, [videos, recordLike, success]);

  const handleFollow = useCallback((userId: string) => {
    setVideoFollowStates(prev => ({ ...prev, [userId]: !prev[userId] }));
    success(videoFollowStates[userId] ? '已取消关注' : '已关注');
  }, [videoFollowStates, success]);

  // 处理不感兴趣
  const handleNotInterested = useCallback((videoId: string) => {
    setSelectedVideoForFeedback(videoId);
    setShowNotInterestedModal(true);
  }, []);

  // 确认不感兴趣
  const confirmNotInterested = useCallback((reason?: string) => {
    if (selectedVideoForFeedback) {
      markAsNotInterested(selectedVideoForFeedback, reason);
      
      // 记录跳过行为
      const video = videos.find(v => v.id === selectedVideoForFeedback);
      if (video) {
        recordSkip(selectedVideoForFeedback, 
          video.description.includes('#') ? 
            video.description.split('#')[1]?.split(' ')[0] || '其他' : '其他',
          video.description.match(/#\w+/g) || []
        );
      }
      
      // 如果是当前视频，切换到下一个
      if (videos[currentVideoIndex]?.id === selectedVideoForFeedback) {
        if (currentVideoIndex < videos.length - 1) {
          setCurrentVideoIndex(prev => prev + 1);
        } else {
          // 加载更多推荐
          loadMoreRecommendations();
        }
      }
    }
    
    setShowNotInterestedModal(false);
    setSelectedVideoForFeedback(null);
  }, [selectedVideoForFeedback, markAsNotInterested, videos, currentVideoIndex, recordSkip, loadMoreRecommendations]);

  const formatCount = (count: number): string => {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + '万';
    }
    return count.toString();
  };

  // 防抖处理函数
  const handleLocationClick = async () => {
    const now = Date.now();
    if (now - lastLocationClick < 1000) {
      info('请稍等，正在处理中...');
      return;
    }
    setLastLocationClick(now);
    
    // 点击反馈动画
    setLocationButtonClicked(true);
    setTimeout(() => setLocationButtonClicked(false), 150);
    
    await requestLocationPermission();
  };
  
  const handleMeetingClick = async () => {
    const now = Date.now();
    if (now - lastMeetingClick < 1000) {
      info('请稍等，正在处理中...');
      return;
    }
    setLastMeetingClick(now);
    
    // 点击反馈动画
    setMeetingButtonClicked(true);
    setTimeout(() => setMeetingButtonClicked(false), 150);
    
    await enableMeetingFeature();
  };

  // 地理位置权限请求
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      error('您的浏览器不支持地理位置功能');
      return false;
    }

    if (isRequestingLocation) {
      return false;
    }

    setIsRequestingLocation(true);
    info('正在请求位置权限...');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      setUserLocation(location);
      setLocationPermission('granted');
      
      // 模拟获取附近用户
      const nearby = generateNearbyUsers(location);
      setNearbyUsers(nearby);
      
      success('位置获取成功！已为您找到附近用户');
      return true;
      
    } catch (err) {
      console.error('获取位置失败:', err);
      setLocationPermission('denied');
      
      let errorMessage = '无法获取您的位置信息';
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = '位置权限被拒绝，请在浏览器设置中允许位置访问';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用，请检查GPS或网络连接';
            break;
          case err.TIMEOUT:
            errorMessage = '位置请求超时，请重试';
            break;
        }
      }
      
      error(errorMessage);
      return false;
    } finally {
      setIsRequestingLocation(false);
    }
  };

  // 生成模拟附近用户数据
  const generateNearbyUsers = (location: {lat: number, lng: number}) => {
    const users = [];
    for (let i = 0; i < 5; i++) {
      users.push({
        id: `nearby_${i}`,
        username: `用户${i + 1}`,
        avatar: '', // 不使用AI生成头像
        distance: Math.floor(Math.random() * 1000) + 50, // 50-1050米
        isOnline: Math.random() > 0.3,
        lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString()
      });
    }
    return users;
  };

  // 开启碰面功能
  const enableMeetingFeature = async () => {
    if (isEnablingMeeting) {
      return;
    }

    setIsEnablingMeeting(true);
    
    try {
      let hasLocation = locationPermission === 'granted';
      
      if (!hasLocation) {
        info('开启碰面功能需要位置权限...');
        hasLocation = await requestLocationPermission();
      }
      
      if (hasLocation) {
        setMeetingEnabled(true);
        startMeetingDetection();
        success('碰面功能已开启！正在检测附近用户...');
      } else {
        error('无法开启碰面功能，需要位置权限');
      }
    } catch (err) {
      console.error('开启碰面功能失败:', err);
      error('开启碰面功能失败，请重试');
    } finally {
      setIsEnablingMeeting(false);
    }
  };

  // 开始碰面检测
  const startMeetingDetection = () => {
    // 模拟10米内用户检测
    const checkNearbyUsers = () => {
      if (userLocation && meetingEnabled) {
        const veryNearUsers = nearbyUsers.filter(user => {
          // 模拟距离计算，实际应该使用真实的地理距离计算
          const distance = Math.random() * 50; // 0-50米
          return distance <= 10 && user.isOnline;
        });
        
        if (veryNearUsers.length > 0) {
          setMatchedUsers(veryNearUsers);
          setShowMeetingModal(true);
        }
      }
    };
    
    // 每30秒检测一次
    const interval = setInterval(checkNearbyUsers, 30000);
    return () => clearInterval(interval);
  };

  // 处理碰面聊天
  const handleMeetingChat = (user: any) => {
    setShowMeetingModal(false);
    // 跳转到聊天页面
    navigate(`/chat/${user.id}`);
  };

  // 处理评论按钮点击
  const handleCommentClick = useCallback((e?: React.MouseEvent) => {
    // 阻止事件冒泡
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('评论按钮被点击');
    
    const video = videos[currentVideoIndex];
    if (video) {
      recordComment(video.id, 
        video.description.includes('#') ? 
          video.description.split('#')[1]?.split(' ')[0] || '其他' : '其他',
        video.description.match(/#\w+/g) || []
      );
      
      // 打开评论系统
      setCurrentCommentVideoId(video.id);
      setShowCommentSystem(true);
    }
  }, [videos, currentVideoIndex, recordComment]);

  // 处理编辑按钮点击
  const handleEditClick = useCallback((e?: React.MouseEvent) => {
    // 阻止事件冒泡
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('编辑按钮被点击');
    
    const video = videos[currentVideoIndex];
    if (!video) return;
    
    // 检查是否是当前用户的视频
    if (video.user.id === 'user_demo_001') {
      info('编辑功能开发中，敬请期待！');
    } else {
      info('只能编辑自己的作品');
    }
  }, [videos, currentVideoIndex, info]);

  // 处理更多按钮点击
  const handleMoreClick = useCallback((e?: React.MouseEvent) => {
    // 阻止事件冒泡
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const video = videos[currentVideoIndex];
    if (video) {
      setMoreMenuVideoId(video.id);
      setShowMoreMenu(true);
    }
  }, [videos, currentVideoIndex]);
  
  // 处理更多菜单选项
  const handleMoreMenuOption = useCallback((option: string) => {
    const video = videos[currentVideoIndex];
    if (!video) return;
    
    setShowMoreMenu(false);
    setMoreMenuVideoId(null);
    
    switch (option) {
      case 'report':
        warning('举报功能开发中，感谢您的反馈！');
        break;
      case 'favorite':
        success('已添加到收藏夹！');
        break;
      case 'download':
        info('视频下载中，请稍候...');
        break;
      case 'copyLink':
        navigator.clipboard.writeText(window.location.href + `?video=${video.id}`);
        success('链接已复制到剪贴板！');
        break;
      case 'notInterested':
        handleNotInterested(video.id);
        break;
      default:
        break;
    }
  }, [videos, currentVideoIndex, success, warning, info, handleNotInterested]);
  
  // 关闭更多菜单
  const handleCloseMoreMenu = useCallback(() => {
    setShowMoreMenu(false);
    setMoreMenuVideoId(null);
  }, []);

  // 处理推荐按钮点击
  const handleRecommendClick = () => {
    success('推荐内容已刷新！');
    console.log('刷新推荐内容');
    // TODO: 切换到推荐页面或刷新推荐内容
  };

  // 搜索功能
  const handleSearchToggle = () => {
    setShowSearchBox(!showSearchBox);
    if (showSearchBox) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 模拟搜索结果
      const mockResults = [
        { id: '1', type: 'video', title: `包含"${searchQuery}"的视频`, user: '用户1' },
        { id: '2', type: 'user', title: `@${searchQuery}`, followers: '10.5万粉丝' },
        { id: '3', type: 'topic', title: `#${searchQuery}`, posts: '1.2万个视频' }
      ];
      setSearchResults(mockResults);
    }
  };

  const handleSearchResultClick = (result: any) => {
    setShowSearchBox(false);
    setSearchQuery('');
    setSearchResults([]);
    // 根据结果类型跳转到相应页面
    if (result.type === 'user') {
      navigate(`/profile/${result.id}`);
    } else if (result.type === 'topic') {
      navigate(`/topic/${result.id}`);
    }
  };

  // 自定义非被动触摸事件监听器
  useEffect(() => {
    const videoContainer = document.querySelector('[data-video-container]');
    if (!videoContainer) return;

    const handleNativeTouch = (e: TouchEvent) => {
      // 将原生TouchEvent转换为React.TouchEvent格式
      const reactEvent = {
        touches: e.touches,
        changedTouches: e.changedTouches,
        targetTouches: e.targetTouches,
        cancelable: e.cancelable,
        altKey: e.altKey || false,
        ctrlKey: e.ctrlKey || false,
        metaKey: e.metaKey || false,
        shiftKey: e.shiftKey || false,
        detail: e.detail || 0,
        view: e.view || window,
        bubbles: e.bubbles,
        currentTarget: e.currentTarget,
        defaultPrevented: e.defaultPrevented,
        eventPhase: e.eventPhase,
        isTrusted: e.isTrusted,
        target: e.target,
        timeStamp: e.timeStamp,
        type: e.type,
        nativeEvent: e,
        isDefaultPrevented: () => e.defaultPrevented,
        isPropagationStopped: () => false,
        persist: () => {},
        stopPropagation: () => e.stopPropagation(),
        getModifierState: (key: string) => false,
        preventDefault: () => {
          try {
            if (e.cancelable !== false) {
              e.preventDefault();
            }
          } catch (error) {
            console.debug('Native preventDefault failed:', error);
          }
        }
      } as unknown as React.TouchEvent<HTMLDivElement>;

      // 调用现有的处理函数
      handleTouchMove(reactEvent);
      handleTouchMoveRefresh(reactEvent);
    };

    // 添加非被动事件监听器
    videoContainer.addEventListener('touchmove', handleNativeTouch, { passive: false });

    return () => {
      videoContainer.removeEventListener('touchmove', handleNativeTouch);
    };
  }, []); // 移除依赖项以避免初始化问题

  // 获取当前视频
  const currentVideo = videos[currentVideoIndex];

  // 优化加载状态判断：只有在真正加载中且没有任何视频数据时才显示加载状态
  if (isRecommendationLoading && videos.length === 0) {
    return (
      <div className="relative h-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>正在加载推荐内容...</p>
        </div>
      </div>
    );
  }

  // 如果有视频数据但当前视频不存在，显示错误状态
  if (videos.length > 0 && !currentVideo) {
    return (
      <div className="relative h-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="mb-4">视频加载出错</p>
          <button 
            onClick={() => {
              setCurrentVideoIndex(0);
              refreshRecommendations();
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 如果没有推荐数据且不在加载中，显示空状态
  if (!isRecommendationLoading && videos.length === 0) {
    return (
      <div className="relative h-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="text-white text-center px-8">
          <div className="text-gray-400 text-6xl mb-6">🎬</div>
          <h2 className="text-2xl font-bold mb-4">欢迎来到光闪！</h2>
          <p className="text-gray-300 mb-2">还没有内容可以推荐</p>
          <p className="text-gray-400 text-sm mb-8">开始发布你的第一个作品，让更多人看到你的精彩内容</p>
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/camera')}
              className="w-full px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-medium"
            >
              📹 开始创作
            </button>
            <button 
              onClick={refreshRecommendations}
              className="w-full px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              🔄 刷新推荐
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative h-screen bg-black overflow-hidden ${
        isImmersiveMode ? 'fixed inset-0 z-50' : ''
      }`}
      onMouseMove={handleMouseMove}
    >
      {/* 下拉刷新指示器 */}
      {pullRefreshOffset > 0 && currentVideoIndex === 0 && (
        <div 
          className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center"
          style={{
            height: `${Math.min(pullRefreshOffset, 100)}px`,
            transform: `translateY(-${100 - Math.min(pullRefreshOffset, 100)}px)`
          }}
        >
          <div className="flex flex-col items-center text-white bg-black bg-opacity-50 rounded-lg px-4 py-2">
            {pullRefreshOffset >= 80 ? (
              <>
                <RefreshCw className={`w-6 h-6 mb-1 ${isPullRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm">{isPullRefreshing ? '刷新中...' : '松开刷新'}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-6 h-6 mb-1" style={{ transform: `rotate(${pullRefreshOffset * 4.5}deg)` }} />
                <span className="text-sm">下拉刷新</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 视频容器 */}
      <div 
        data-video-container
        className={`relative w-full h-full cursor-pointer select-none transition-transform duration-300 ${
          isLongPressing ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''
        } ${
          isDragging ? 'transition-none' : ''
        }`}
        style={{
          transform: `translateY(${dragOffset + pullRefreshOffset}px)`,
          transition: isDragging || isPullRefreshing ? 'none' : isTransitioning ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'transform 0.3s ease-out'
        }}
        onClick={handleVideoInteraction}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={(e) => {
          handleTouchStart(e);
          handleTouchStartRefresh(e);
          handlePinchStart(e);
        }}
        onTouchMove={(e) => {
          handleTouchMove(e);
          handleTouchMoveRefresh(e);
          handlePinchMove(e);
        }}
        onTouchEnd={(e) => {
          handleTouchEnd(e);
          handleTouchEndRefresh();
          handlePinchEnd();
        }}
        onTouchCancel={(e) => {
          handleTouchEnd(e);
          handleTouchEndRefresh();
          handlePinchEnd();
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="relative w-full h-full">
          <VideoPlayer
            ref={videoPlayerRef}
            src={currentVideo.videoUrl}
            poster={currentVideo.thumbnail}
            autoPlay={false}
            loop={true}
            muted={true}
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: videoOpacity }}
            onTimeUpdate={(currentTime, duration) => {
              // Handle time updates for analytics
            }}
            onEnded={() => {
              // Handle video end
            }}
          />
          
          {/* 下一个视频预览 */}
          {nextVideoPreview && (
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <VideoPlayer
                src={nextVideoPreview.videoUrl}
                poster={nextVideoPreview.thumbnail}
                autoPlay={false}
                loop={false}
                muted={true}
                className="w-full h-full"
              />
            </div>
          )}
        </div>
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
        
        {/* Subtitle Display */}
        <div className="absolute bottom-32 left-4 right-4">
          <SubtitleDisplay
            videoCurrentTime={currentTime}
            subtitles={[]}
            isVisible={isSubtitlesVisible}
            onToggleVisibility={() => setIsSubtitlesVisible(!isSubtitlesVisible)}
          />
        </div>
      </div>

      {/* 顶部工具栏 */}
      <div className={`absolute top-0 left-0 right-0 flex justify-between items-center p-4 pt-safe-top sm:pt-12 z-10 transition-opacity duration-300 ${
        isImmersiveMode 
          ? (showUIInImmersive ? 'opacity-100' : 'opacity-0 pointer-events-none')
          : 'opacity-100'
      }`}>
        <div className="flex-1 overflow-hidden">
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button 
              onClick={() => navigate('/discover')}
              className="text-white font-medium opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap text-sm sm:text-base px-2 sm:px-0"
            >
              关注
            </button>
            <button 
              onClick={handleRecommendClick}
              className="text-white font-medium border-b-2 border-white pb-1 whitespace-nowrap hover:opacity-80 transition-opacity text-sm sm:text-base px-2 sm:px-0"
            >
              推荐
            </button>
            <button 
              onClick={() => navigate('/shop')}
              className="text-white font-medium opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap text-sm sm:text-base px-2 sm:px-0"
            >
              <span className="text-base sm:text-lg">🛒</span>
              <span className="hidden sm:inline">商城</span>
            </button>
            <button 
              onClick={() => navigate('/secondhand')}
              className="text-white font-medium opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap text-sm sm:text-base px-2 sm:px-0"
            >
              <span className="text-base sm:text-lg">♻️</span>
              <span className="hidden sm:inline">旧物</span>
            </button>
            <button 
              onClick={() => navigate('/reward')}
              className="text-white font-medium opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap text-sm sm:text-base px-2 sm:px-0"
            >
              <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">悬赏</span>
            </button>
            <button 
              onClick={() => navigate('/square')}
              className="text-white font-medium opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap text-sm sm:text-base px-2 sm:px-0"
            >
              <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">广场</span>
            </button>
            <button 
              onClick={handleLocationClick}
              disabled={isRequestingLocation || isEnablingMeeting}
              className={`text-white font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3 rounded-lg min-w-[60px] sm:min-w-[88px] min-h-[36px] sm:min-h-[44px] justify-center touch-manipulation select-none ${
                isRequestingLocation || isEnablingMeeting
                  ? 'opacity-50 cursor-not-allowed' 
                  : locationPermission === 'granted'
                    ? 'opacity-100 text-green-400 bg-green-500/20 shadow-lg'
                    : 'opacity-60 hover:opacity-100 hover:bg-white/10 active:bg-white/20'
              } ${
                locationButtonClicked ? 'scale-95 bg-white/20' : 'hover:scale-105'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isRequestingLocation ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">同城</span>
            </button>
            <div className="w-6"></div>
            <button 
              onClick={handleMeetingClick}
              disabled={isEnablingMeeting || isRequestingLocation}
              className={`text-white font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3 rounded-lg min-w-[60px] sm:min-w-[88px] min-h-[36px] sm:min-h-[44px] justify-center touch-manipulation select-none ${
                isEnablingMeeting || isRequestingLocation
                  ? 'opacity-50 cursor-not-allowed'
                  : meetingEnabled 
                    ? 'opacity-100 text-green-400 bg-green-500/20 shadow-lg' 
                    : 'opacity-60 hover:opacity-100 hover:bg-white/10 active:bg-white/20'
              } ${
                meetingButtonClicked ? 'scale-95 bg-white/20' : 'hover:scale-105'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isEnablingMeeting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Users className="w-5 h-5" />
              )}
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">碰面</span>
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-black/20 rounded-full p-1">
            <DraftStatusIndicator variant="badge" />
          </div>
          <button
            onClick={handleSearchToggle}
            className={`p-2 bg-black/20 rounded-full transition-colors ${
              showSearchBox ? 'bg-blue-500/30' : 'hover:bg-black/30'
            }`}
          >
            <Search className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-black/20 rounded-full"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* 搜索框 */}
      {showSearchBox && (
        <div className={`absolute top-20 left-4 right-4 z-20 transition-opacity duration-300 ${
          isImmersiveMode 
            ? (showUIInImmersive ? 'opacity-100' : 'opacity-0 pointer-events-none')
            : 'opacity-100'
        }`}>
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索视频、用户、话题..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-400"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                搜索
              </button>
            </form>
            
            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full text-left p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <div className="text-white font-medium">{result.title}</div>
                    {result.user && (
                      <div className="text-white/60 text-sm">{result.user}</div>
                    )}
                    {result.followers && (
                      <div className="text-white/60 text-sm">{result.followers}</div>
                    )}
                    {result.posts && (
                      <div className="text-white/60 text-sm">{result.posts}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {/* 热门搜索 */}
            {searchResults.length === 0 && searchQuery === '' && (
              <div>
                <div className="text-white/80 text-sm mb-2">热门搜索</div>
                <div className="flex flex-wrap gap-2">
                  {['美食', '旅行', '音乐', '舞蹈', '搞笑', '宠物'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-sm hover:bg-white/20 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 右侧操作栏 */}
      <div className={`absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-1 sm:space-y-2 z-10 transition-opacity duration-300 ${
        isImmersiveMode 
          ? (showUIInImmersive ? 'opacity-100' : 'opacity-0 pointer-events-none')
          : 'opacity-100'
      }`} style={{ top: 'max(50%, 120px)', transform: 'translateY(-50%)' }}>
        {/* 用户头像 */}
        <div className="relative">
          <LazyImageWithFallback
            src={currentVideo.user.avatar}
            alt={currentVideo.user.username}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white object-cover"
          />
          {!currentVideo.isFollowing && (
            <button
              onClick={() => handleFollow(currentVideo.user.id)}
              className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs font-bold">+</span>
            </button>
          )}
        </div>

        {/* 点赞 */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => handleLike(currentVideo.id)}
            className={`p-2 sm:p-3 rounded-full transition-colors ${
              currentVideo.isLiked ? 'text-red-500' : 'text-white'
            }`}
          >
            <Heart className={`w-6 h-6 sm:w-7 sm:h-7 ${currentVideo.isLiked ? 'fill-current' : ''}`} />
          </button>
          <span className="text-white text-xs mt-1">{formatCount(currentVideo.stats.likes)}</span>
        </div>

        {/* 评论 */}
        <div className="flex flex-col items-center">
          <button 
            onClick={handleCommentClick}
            onTouchEnd={(e) => {
              if (e.cancelable) {
                e.preventDefault();
              }
              e.stopPropagation();
              handleCommentClick(e as any);
            }}
            className="p-2 sm:p-3 text-white hover:bg-white/10 rounded-full transition-colors touch-manipulation select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <span className="text-white text-xs mt-1">{formatCount(currentVideo.stats.comments)}</span>
        </div>

        {/* 编辑 (仅显示给作品所有者) */}
        {currentVideo.user.id === 'user_demo_001' && (
          <div className="flex flex-col items-center">
            <button 
              onClick={handleEditClick}
              onTouchEnd={(e) => {
                if (e.cancelable) {
                  e.preventDefault();
                }
                e.stopPropagation();
                handleEditClick(e as any);
              }}
              className="p-2 sm:p-3 text-white hover:bg-white/10 rounded-full transition-colors touch-manipulation select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Edit className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <span className="text-white text-xs mt-1">编辑</span>
          </div>
        )}

        {/* 字幕 */}
        <div className="flex flex-col items-center">
          <button 
            onClick={() => setIsSubtitlesVisible(!isSubtitlesVisible)}
            className={`p-2 sm:p-3 transition-colors ${
              isSubtitlesVisible ? 'text-blue-400' : 'text-white'
            }`}
          >
            <Subtitles className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <span className="text-white text-xs mt-1 hidden sm:inline">字幕</span>
        </div>

        {/* 不感兴趣 */}
        <div className="flex flex-col items-center">
          <button 
            onClick={() => handleNotInterested(currentVideo.id)}
            className="p-2 sm:p-3 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <span className="text-white text-xs mt-1 hidden sm:inline">不喜欢</span>
        </div>



        {/* 更多 */}
        <button 
          onClick={handleMoreClick}
          onTouchEnd={(e) => {
            if (e.cancelable) {
              e.preventDefault();
            }
            e.stopPropagation();
            handleMoreClick(e as any);
          }}
          className="p-2 sm:p-3 text-white hover:bg-white/10 rounded-full transition-colors touch-manipulation select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <MoreHorizontal className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      {/* 底部信息区域 */}
      <div className={`absolute bottom-32 sm:bottom-36 left-3 sm:left-4 right-16 sm:right-20 z-10 transition-opacity duration-300 ${
        isImmersiveMode 
          ? (showUIInImmersive ? 'opacity-100' : 'opacity-0 pointer-events-none')
          : 'opacity-100'
      }`}>
        {/* 用户信息 */}
        <div className="flex items-center mb-2 sm:mb-3">
          <span className="text-white font-semibold mr-2 text-sm sm:text-base">@{currentVideo.user.username}</span>
          {currentVideo.user.isVerified && (
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        {/* 视频描述 */}
        <p className="text-white text-xs sm:text-sm mb-2 sm:mb-3 leading-relaxed">
          {currentVideo.description}
        </p>

        {/* 音乐信息 */}
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mr-1 sm:mr-2">
            <span className="text-white text-xs">♪</span>
          </div>
          <span className="text-white text-xs sm:text-sm opacity-80">{currentVideo.music}</span>
        </div>

        {/* 推荐解释 */}
        {currentVideo.recommendationReason && (
          <div className="flex items-center mt-1 sm:mt-2 p-1.5 sm:p-2 bg-black/20 rounded-lg backdrop-blur-sm">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center mr-1 sm:mr-2">
              <span className="text-white text-xs">💡</span>
            </div>
            <span className="text-white text-xs opacity-70">{currentVideo.recommendationReason}</span>
          </div>
        )}
      </div>

      {/* 视频切换指示器 */}
      <div className={`absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1 sm:space-y-2 z-10 transition-opacity duration-300 ${
        isImmersiveMode 
          ? (showUIInImmersive ? 'opacity-100' : 'opacity-0 pointer-events-none')
          : 'opacity-100'
      }`} style={{ top: 'max(50%, 80px)', transform: 'translateY(-50%)', maxHeight: 'calc(100vh - 160px)' }}>
        {videos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentVideoIndex(index)}
            className={`w-0.5 sm:w-1 h-6 sm:h-8 rounded-full transition-colors ${
              index === currentVideoIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
      
      {/* 加速倍数指示器 */}
      {showSpeedIndicator && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-yellow-500 bg-opacity-90 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xl sm:text-2xl font-bold shadow-lg animate-pulse">
            {accelerationSpeed}x
          </div>
          <div className="text-center mt-1 sm:mt-2 text-white text-xs sm:text-sm bg-black bg-opacity-50 px-2 sm:px-3 py-1 rounded-full">
            长按加速中...
          </div>
        </div>
      )}
      
      {/* 滑动方向指示器 */}
      {showSwipeIndicator && swipeDirection && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className={`flex flex-col items-center transition-all duration-200 ${
            swipeDirection === 'up' ? 'animate-bounce' : ''
          } ${
            swipeDirection === 'down' ? 'animate-bounce' : ''
          }`}>
            {swipeDirection === 'up' && (
              <>
                <div className="text-white text-3xl sm:text-4xl mb-1 sm:mb-2">↑</div>
                <div className="text-white text-xs sm:text-sm bg-black bg-opacity-50 px-2 sm:px-3 py-1 rounded-full">
                  {currentVideoIndex < videos.length - 1 ? '下一个视频' : '已是最后一个'}
                </div>
              </>
            )}
            {swipeDirection === 'down' && (
              <>
                <div className="text-white text-3xl sm:text-4xl mb-1 sm:mb-2">↓</div>
                <div className="text-white text-xs sm:text-sm bg-black bg-opacity-50 px-2 sm:px-3 py-1 rounded-full">
                  {currentVideoIndex > 0 ? '上一个视频' : '已是第一个'}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* 沉浸式模式提示 */}
      {isImmersiveMode && !showSpeedIndicator && (
        <div className={`absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm transition-opacity duration-300 z-30 ${
          showUIInImmersive ? 'opacity-100' : 'opacity-0'
        }`}>
          按 ESC 键或点击视频退出沉浸模式
        </div>
      )}
      
      {/* 碰面匹配弹窗 - z-index: 1000 */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">发现附近的人</h3>
              <p className="text-sm text-gray-600 mt-1">在10米内发现了 {matchedUsers.length} 位用户</p>
            </div>
            
            <div className="space-y-3 mb-4">
              {matchedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">距离约 {Math.floor(Math.random() * 10) + 1}m</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMeetingChat(user)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors"
                  >
                    聊天
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMeetingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                稍后
              </button>
              <button
                onClick={() => {
                  setShowMeetingModal(false);
                  setMeetingEnabled(false);
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                关闭碰面
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 更多选项菜单 - z-index: 1000 */}
      {showMoreMenu && moreMenuVideoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[1000]" onClick={handleCloseMoreMenu}>
          <div className="bg-white rounded-t-2xl w-full max-w-md mx-4 mb-0 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">更多选项</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleMoreMenuOption('favorite')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Star className="w-5 h-5 text-yellow-500 mr-3" />
                  <span className="text-gray-900">收藏</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('download')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="text-gray-900">下载</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('copyLink')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Link className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-900">复制链接</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('notInterested')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <EyeOff className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="text-gray-900">不感兴趣</span>
                </button>
                
                <button
                  onClick={() => handleMoreMenuOption('report')}
                  className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Flag className="w-5 h-5 text-red-500 mr-3" />
                  <span className="text-gray-900">举报</span>
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

      {/* 不感兴趣反馈模态框 - z-index: 1000 */}
      {showNotInterestedModal && selectedVideoForFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ThumbsDown className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">不感兴趣</h3>
              <p className="text-sm text-gray-600 mt-1">告诉我们原因，我们会减少类似推荐</p>
            </div>
            
            <div className="space-y-2 mb-4">
              {[
                { key: 'content', label: '内容不感兴趣' },
                { key: 'creator', label: '对创作者不感兴趣' },
                { key: 'category', label: '对此类别不感兴趣' },
                { key: 'quality', label: '视频质量差' },
                { key: 'repetitive', label: '内容重复' },
                { key: 'inappropriate', label: '内容不当' }
              ].map((reason) => (
                <button
                  key={reason.key}
                  onClick={() => {
                    confirmNotInterested(reason.key);
                    setShowNotInterestedModal(false);
                  }}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-gray-900">{reason.label}</span>
                </button>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNotInterestedModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  confirmNotInterested('general');
                  setShowNotInterestedModal(false);
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 评论系统 - z-index: 1100 */}
      {showCommentSystem && currentCommentVideoId && (
        <CommentSystem
          videoId={currentCommentVideoId}
          onClose={() => {
            setShowCommentSystem(false);
            setCurrentCommentVideoId(null);
          }}
        />
      )}
    </div>
  );
}