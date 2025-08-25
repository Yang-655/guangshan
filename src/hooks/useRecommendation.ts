import { useState, useEffect, useCallback, useRef } from 'react';
import { recommendationService, RecommendationResult, UserBehavior } from '../utils/recommendationService';
import { useToast } from '../components/Toast';

interface UseRecommendationOptions {
  userId: string;
  initialCount?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseRecommendationReturn {
  recommendations: RecommendationResult[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
  
  // 操作方法
  refreshRecommendations: () => Promise<void>;
  loadMoreRecommendations: () => Promise<void>;
  recordBehavior: (behavior: Omit<UserBehavior, 'userId'>) => void;
  markAsNotInterested: (videoId: string, reason?: string) => void;
  markAsViewed: (videoId: string) => void;
  
  // 统计信息
  getUserStats: () => any;
}

export function useRecommendation({
  userId,
  initialCount = 10,
  autoRefresh = false,
  refreshInterval = 300000 // 5分钟
}: UseRecommendationOptions): UseRecommendationReturn {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const { success, error: showError, info } = useToast();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadedVideoIds = useRef<Set<string>>(new Set());

  // 获取推荐内容
  const fetchRecommendations = useCallback(async (
    isRefresh = false,
    count = initialCount
  ) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
        setError(null);
        loadedVideoIds.current.clear();
      } else {
        setIsLoading(true);
      }

      const excludeIds = Array.from(loadedVideoIds.current);
      const newRecommendations = isRefresh 
        ? await recommendationService.refreshRecommendations(userId, count)
        : await recommendationService.getPersonalizedRecommendations(userId, count, excludeIds);

      if (newRecommendations.length === 0) {
        setHasMore(false);
        if (isRefresh) {
          info('暂无更多推荐内容');
        }
        return;
      }

      // 更新已加载的视频ID集合
      newRecommendations.forEach(rec => {
        loadedVideoIds.current.add(rec.videoId);
      });

      if (isRefresh) {
        setRecommendations(newRecommendations);
        setCurrentPage(1);
        success('推荐内容已刷新');
      } else {
        setRecommendations(prev => [...prev, ...newRecommendations]);
        setCurrentPage(prev => prev + 1);
      }

      setHasMore(newRecommendations.length === count);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取推荐失败';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, initialCount]);

  // 使用useRef存储fetchRecommendations的稳定引用
  const fetchRecommendationsRef = useRef(fetchRecommendations);
  fetchRecommendationsRef.current = fetchRecommendations;

  // 刷新推荐
  const refreshRecommendations = useCallback(async () => {
    await fetchRecommendationsRef.current(true);
  }, []);

  // 加载更多推荐
  const loadMoreRecommendations = useCallback(async () => {
    if (!hasMore || isLoading || isRefreshing) {
      return;
    }
    await fetchRecommendationsRef.current(false);
  }, [hasMore, isLoading, isRefreshing]);

  // 记录用户行为
  const recordBehavior = useCallback((behavior: Omit<UserBehavior, 'userId'>) => {
    try {
      const fullBehavior: UserBehavior = {
        ...behavior,
        userId,
        timestamp: behavior.timestamp || Date.now()
      };
      
      recommendationService.recordUserBehavior(fullBehavior);
      
      // 如果是观看行为，标记为已观看
      if (behavior.action === 'view') {
        recommendationService.markAsViewed(userId, behavior.videoId);
      }
      
    } catch (err) {
      console.error('记录用户行为失败:', err);
    }
  }, [userId]);

  // 标记不感兴趣
  const markAsNotInterested = useCallback((videoId: string, reason?: string) => {
    try {
      recommendationService.markAsNotInterested(userId, videoId, reason);
      
      // 从当前推荐列表中移除
      setRecommendations(prev => {
        const filtered = prev.filter(rec => rec.videoId !== videoId);
        // 如果推荐列表变少，自动加载更多
        if (filtered.length <= 5 && hasMore) {
          setTimeout(() => {
            fetchRecommendationsRef.current(false);
          }, 0);
        }
        return filtered;
      });
      loadedVideoIds.current.delete(videoId);
      
      success('已标记为不感兴趣');
      
    } catch (err) {
      showError('操作失败，请重试');
    }
  }, [userId, hasMore]);

  // 标记已观看
  const markAsViewed = useCallback((videoId: string) => {
    try {
      recommendationService.markAsViewed(userId, videoId);
    } catch (err) {
      console.error('标记已观看失败:', err);
    }
  }, [userId]);

  // 获取用户统计信息
  const getUserStats = useCallback(() => {
    return recommendationService.getUserPreferenceStats(userId);
  }, [userId]);

  // 初始化加载
  useEffect(() => {
    fetchRecommendationsRef.current(true);
  }, []);

  // 自动刷新
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        fetchRecommendationsRef.current(true);
      }, refreshInterval);

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  return {
    recommendations,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    refreshRecommendations,
    loadMoreRecommendations,
    recordBehavior,
    markAsNotInterested,
    markAsViewed,
    getUserStats
  };
}

// 推荐行为记录Hook
export function useRecommendationBehavior(userId: string) {
  const recordBehavior = useCallback((behavior: Omit<UserBehavior, 'userId'>) => {
    const fullBehavior: UserBehavior = {
      ...behavior,
      userId,
      timestamp: behavior.timestamp || Date.now()
    };
    
    recommendationService.recordUserBehavior(fullBehavior);
  }, [userId]);

  // 便捷方法
  const recordLike = useCallback((videoId: string, videoCategory: string, videoTags: string[]) => {
    recordBehavior({
      videoId,
      action: 'like',
      watchTime: 0,
      videoCategory,
      videoTags,
      timestamp: Date.now()
    });
  }, [recordBehavior]);

  const recordComment = useCallback((videoId: string, videoCategory: string, videoTags: string[]) => {
    recordBehavior({
      videoId,
      action: 'comment',
      watchTime: 0,
      videoCategory,
      videoTags,
      timestamp: Date.now()
    });
  }, [recordBehavior]);

  const recordShare = useCallback((videoId: string, videoCategory: string, videoTags: string[]) => {
    recordBehavior({
      videoId,
      action: 'share',
      watchTime: 0,
      videoCategory,
      videoTags,
      timestamp: Date.now()
    });
  }, [recordBehavior]);

  const recordView = useCallback((
    videoId: string, 
    watchTime: number, 
    videoCategory: string, 
    videoTags: string[]
  ) => {
    recordBehavior({
      videoId,
      action: 'view',
      watchTime,
      videoCategory,
      videoTags,
      timestamp: Date.now()
    });
  }, [recordBehavior]);

  const recordSkip = useCallback((videoId: string, videoCategory: string, videoTags: string[]) => {
    recordBehavior({
      videoId,
      action: 'skip',
      watchTime: 0,
      videoCategory,
      videoTags,
      timestamp: Date.now()
    });
  }, [recordBehavior]);

  return {
    recordBehavior,
    recordLike,
    recordComment,
    recordShare,
    recordView,
    recordSkip
  };
}

// 推荐统计Hook
export function useRecommendationStats(userId: string) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStats = useCallback(() => {
    setIsLoading(true);
    try {
      const userStats = recommendationService.getUserPreferenceStats(userId);
      setStats(userStats);
    } catch (err) {
      console.error('获取统计信息失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 使用useRef存储refreshStats的稳定引用
  const refreshStatsRef = useRef(refreshStats);
  refreshStatsRef.current = refreshStats;

  useEffect(() => {
    refreshStatsRef.current();
  }, []);

  return {
    stats,
    isLoading,
    refreshStats
  };
}