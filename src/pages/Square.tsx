import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Heart, MessageCircle, Share, Play, User, ArrowLeft, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import LazyImageWithFallback from '../components/LazyImageWithFallback';
import VideoPlayer from '../components/VideoPlayer';
import { recommendationService, VideoContent } from '../utils/recommendationService';

interface SquareItem {
  id: string;
  type: 'image' | 'video';
  thumbnail: string;
  title: string;
  videoUrl?: string; // 视频文件URL
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  stats: {
    likes: number;
    comments: number;
    views: number;
  };
  duration?: number; // 视频时长（秒）
  isLiked: boolean;
  tags: string[];
}

export default function Square() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<SquareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showFilter, setShowFilter] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);
  const isRestoringScrollRef = useRef<boolean>(false);
  const videoPlayerRef = useRef<any>(null);

  const categories = ['全部', '热门', '最新', '生活', '美食', '旅行', '音乐', '舞蹈', '游戏', '科技'];

  // 保存滚动位置
  const saveScrollPosition = useCallback(() => {
    if (isRestoringScrollRef.current) return;
    
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    try {
      sessionStorage.setItem('square_scroll_position', scrollY.toString());
    } catch (error) {
      console.warn('Failed to save scroll position:', error);
    }
  }, []);

  // 恢复滚动位置
  const restoreScrollPosition = useCallback(() => {
    try {
      const savedPosition = sessionStorage.getItem('square_scroll_position');
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        if (!isNaN(position)) {
          isRestoringScrollRef.current = true;
          
          // 使用requestAnimationFrame确保DOM已渲染
          requestAnimationFrame(() => {
            window.scrollTo({
              top: position,
              behavior: 'auto'
            });
            
            // 短暂延迟后允许保存新的滚动位置
            setTimeout(() => {
              isRestoringScrollRef.current = false;
            }, 100);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to restore scroll position:', error);
      isRestoringScrollRef.current = false;
    }
  }, []);



  // 格式化数字显示
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // 强制刷新数据（清除缓存）
  const forceRefresh = async () => {
    console.log('🔄 强制刷新Square数据，清除所有缓存...');
    
    // 清除所有相关缓存
    localStorage.removeItem('recommendationData');
    localStorage.removeItem('square_scroll_position');
    sessionStorage.clear(); // 清除会话存储
    
    // 清除组件状态
    setItems([]);
    setLoading(true);
    
    // 强制重新获取数据
    console.log('🔄 强制重新加载数据，禁用任何缓存机制');
    await loadSquareData();
  };

  // 加载广场数据
  const loadSquareData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Square页面开始加载视频数据...');
      const allVideos = await recommendationService.getAllVideos();
      console.log('📊 recommendationService返回的原始数据:', allVideos);
      
      // 转换为SquareItem格式
      const convertedItems: SquareItem[] = allVideos.map((video: VideoContent) => {
        let thumbnail: string;
        
        // 调试日志：检查缩略图数据
        console.log('🔍 Square页面处理视频缩略图:', {
          videoId: video.id,
          title: video.title,
          hasThumbnailUrl: !!video.thumbnailUrl,
          thumbnailType: video.thumbnailUrl ? typeof video.thumbnailUrl : 'undefined',
          isDataUrl: video.thumbnailUrl ? video.thumbnailUrl.startsWith('data:') : false,
          thumbnailSize: video.thumbnailUrl ? Math.round(video.thumbnailUrl.length / 1024) + ' KB' : 'N/A'
        });
        
        // 严格优先使用数据库中的缩略图，禁用AI生成
        if (video.thumbnailUrl && video.thumbnailUrl.trim() !== '') {
          console.log('✅ 使用数据库中的缩略图:', {
            isBase64: video.thumbnailUrl.startsWith('data:'),
            size: Math.round(video.thumbnailUrl.length / 1024) + ' KB'
          });
          thumbnail = video.thumbnailUrl;
        } else {
          console.log('⚠️ 数据库中无缩略图，使用默认占位图');
          // 完全禁用AI生成，使用默认占位图
          thumbnail = '/images/default-thumbnail.svg';
        }
        
        return {
        id: video.id,
        type: 'video' as const,
        thumbnail,
        title: video.title,
        videoUrl: video.videoUrl, // 使用实际的视频URL
        user: {
          id: video.creatorId,
          username: video.creatorId === 'user_demo_001' ? '我' : `用户${video.creatorId.slice(-3)}`,
          avatar: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20${video.creatorId}&image_size=square`
        },
        stats: {
          likes: video.stats.likes,
          comments: video.stats.comments,
          views: video.stats.views
        },
        duration: video.duration,
        isLiked: false,
        tags: video.tags
        };
      });
      
      setItems(convertedItems);
      setHasMore(false); // 暂时设置为无更多数据
      console.log('已加载广场视频:', convertedItems.length, '个');
    } catch (error) {
      console.error('Failed to load square data:', error);
    } finally {
      setLoading(false);
      // 数据加载完成后恢复滚动位置
      setTimeout(() => {
        restoreScrollPosition();
      }, 100);
    }
  };

  // 初始加载数据
  useEffect(() => {
    loadSquareData();
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
          loadSquareData();
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
  }, [restoreScrollPosition]);

  // 监听滚动事件，保存滚动位置
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          saveScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [saveScrollPosition]);

  // 页面卸载时保存滚动位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 组件卸载时也保存一次
      saveScrollPosition();
    };
  }, [saveScrollPosition]);

  // ESC键关闭放大卡片
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedCard) {
        setExpandedCard(null);
        setPlayingVideo(null);
        // 恢复导航菜单显示
        localStorage.removeItem('square_fullscreen');
      }
    };

    if (expandedCard) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [expandedCard]);

  // 管理全屏状态和导航菜单显示
  useEffect(() => {
    if (expandedCard) {
      // 隐藏导航菜单
      localStorage.setItem('square_fullscreen', 'true');
    } else {
      // 恢复导航菜单显示
      localStorage.removeItem('square_fullscreen');
    }
  }, [expandedCard]);

  // 加载更多数据
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    // TODO: 实现真实的数据加载逻辑
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setHasMore(false); // 暂时设置为无更多数据
    }, 800);
  }, [loading, hasMore]);

  // 无限滚动监听
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current);
    }
    
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMore, hasMore, loading]);

  // 处理视频交互（区分点击和长按）
  const handleVideoInteraction = (e: React.MouseEvent) => {
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

  // 处理点赞
  const handleLike = (itemId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newIsLiked = !item.isLiked;
        return {
          ...item,
          isLiked: newIsLiked,
          stats: {
            ...item.stats,
            likes: newIsLiked ? item.stats.likes + 1 : item.stats.likes - 1
          }
        };
      }
      return item;
    }));
  };

  // 格式化数字
  const formatCount = (count: number): string => {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + '万';
    }
    return count.toString();
  };

  // 格式化时长
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 过滤内容
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '全部' || item.tags.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">广场</h1>
          </div>
          
          <div className="flex items-center space-x-3">

            <button
              onClick={() => setShowFilter(!showFilter)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 搜索栏 */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索内容或用户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* 分类筛选 */}
        {showFilter && (
          <div className="px-4 pb-4">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 瀑布流内容区域 */}
      <div className="p-4">
        {filteredItems.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-900 to-purple-900 rounded-full flex items-center justify-center mb-6">
              <Play className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">广场还很空旷</h3>
            <p className="text-sm text-center text-gray-300 mb-6 leading-relaxed px-8">
              还没有用户发布内容呢！<br />
              成为第一个在广场分享精彩内容的创作者吧
            </p>
            <button
              onClick={() => navigate('/camera')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              开始创作
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-w-screen-xl mx-auto">
            {filteredItems.map((item, index) => (
            <div
              key={item.id}
              ref={index === filteredItems.length - 1 ? lastItemRef : null}
              className={`bg-gray-900 overflow-hidden transition-all duration-300 cursor-pointer ${
                expandedCard === item.id 
                  ? 'fixed inset-0 z-50 transform scale-100 shadow-2xl flex flex-col' 
                  : 'relative transform scale-100 hover:bg-gray-800 rounded-lg'
              }`}
              onClick={(e) => {
                // 如果已经是放大状态，阻止事件冒泡
                if (expandedCard === item.id) {
                  e.stopPropagation();
                  return;
                }
                // 如果正在播放视频，不处理点击
                if (playingVideo === item.id) {
                  e.stopPropagation();
                  return;
                }
                // 切换卡片放大状态（不进入全屏沉浸模式）
                setExpandedCard(item.id);
              }}
            >
              {/* 内容缩略图 */}
              <div className={`relative ${
                expandedCard === item.id ? 'flex-1 min-h-0' : 'aspect-[3/4]'
              }`}>
                <LazyImageWithFallback
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                
                {/* 视频播放图标和时长 */}
                {item.type === 'video' && (
                  <>
                    {/* 播放按钮 - 点击后进入全屏沉浸模式 */}
                    {playingVideo !== item.id && (
                      <button
                        className="absolute inset-0 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 点击播放按钮后同时设置放大和播放状态，进入全屏沉浸模式
                          setExpandedCard(item.id);
                          setPlayingVideo(item.id);
                        }}
                      >
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </button>
                    )}
                    
                    {/* 视频播放器 - 只在放大且播放状态下显示 */}
                    {expandedCard === item.id && playingVideo === item.id && (
                      <div 
                        className="absolute inset-0 w-full h-full"
                        onClick={handleVideoInteraction}
                      >
                        <VideoPlayer
                          ref={videoPlayerRef}
                          src={item.videoUrl || `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`}
                          className="w-full h-full object-cover"
                          autoPlay={true}
                          onEnded={() => setPlayingVideo(null)}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        />
                      </div>
                    )}
                    
                    {item.duration && expandedCard !== item.id && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(item.duration)}
                      </div>
                    )}
                  </>
                )}
                
                {/* 关闭按钮 - 只在放大状态下显示 */}
                {expandedCard === item.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCard(null);
                      setPlayingVideo(null);
                      // 恢复导航菜单显示
                      localStorage.removeItem('square_fullscreen');
                    }}
                    className="absolute top-2 left-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* 点赞按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(item.id);
                  }}
                  className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                    item.isLiked ? 'bg-red-500/80 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${item.isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              {/* 内容信息 - 在沉浸模式下隐藏 */}
              {!(expandedCard === item.id && playingVideo === item.id) && (
                <div className={`p-3 ${
                  expandedCard === item.id ? 'p-6 bg-gray-800 mt-auto' : ''
                }`}>
                <h3 className={`font-medium text-white mb-2 line-clamp-2 ${
                  expandedCard === item.id ? 'text-xl mb-4' : 'text-sm'
                }`}>
                  {item.title}
                </h3>
                
                {/* 用户信息 */}
                <div className={`flex items-center space-x-2 mb-2 ${
                  expandedCard === item.id ? 'mb-4' : ''
                }`}>
                  <LazyImageWithFallback
                    src={item.user.avatar}
                    alt={item.user.username}
                    className={`rounded-full object-cover ${
                      expandedCard === item.id ? 'w-10 h-10' : 'w-6 h-6'
                    }`}
                  />
                  <span className={`text-gray-400 truncate ${
                    expandedCard === item.id ? 'text-base' : 'text-xs'
                  }`}>{item.user.username}</span>
                </div>
                
                {/* 统计信息 */}
                <div className={`flex items-center justify-between text-gray-500 ${
                  expandedCard === item.id ? 'text-base' : 'text-xs'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Heart className={`${
                        expandedCard === item.id ? 'w-5 h-5' : 'w-3 h-3'
                      }`} />
                      <span>{formatCount(item.stats.likes)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className={`${
                        expandedCard === item.id ? 'w-5 h-5' : 'w-3 h-3'
                      }`} />
                      <span>{formatCount(item.stats.comments)}</span>
                    </span>
                  </div>
                  <span>{formatCount(item.stats.views)}次观看</span>
                </div>
                </div>
              )}
            </div>
          ))}
          
          {/* 加载状态 */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-400">加载中...</span>
            </div>
          )}
          
          {/* 没有更多内容 */}
          {!hasMore && filteredItems.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              没有更多内容了
            </div>
          )}
        </div>
        )}
      </div>
      
      {/* 背景遮罩层 */}
      {expandedCard && (
        <div 
          className="fixed inset-0 bg-black/80 z-40"
          onClick={() => {
            setExpandedCard(null);
            setPlayingVideo(null);
            // 恢复导航菜单显示
            localStorage.removeItem('square_fullscreen');
          }}
        />
      )}
    </div>
  );
}