import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Users, Hash, Music, MapPin, Video, Eye, Heart, Check, Loader2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import Toast from '../components/Toast';
import { useRecommendation } from '../hooks/useRecommendation';
import { recommendationService } from '../utils/recommendationService';

export default function Discover() {
  const [followedUsers, setFollowedUsers] = useState<Set<number>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState<Set<number>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [userId] = useState('user_demo_001'); // 模拟用户ID
  
  // 使用推荐系统获取广场内容
  const {
    recommendations,
    isLoading: isRecommendationLoading,
    refreshRecommendations
  } = useRecommendation({ userId, initialCount: 20 });

  const trendingTopics = [
    { id: 1, name: '#美食分享', count: '12.5万' },
    { id: 2, name: '#旅行日记', count: '8.3万' },
    { id: 3, name: '#生活记录', count: '6.7万' },
    { id: 4, name: '#音乐推荐', count: '5.2万' }
  ];

  const recommendedUsers = [
    { id: 1, username: '美食达人小王', followers: '10.2万', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=food%20blogger%20avatar%20portrait&image_size=square' },
    { id: 2, username: '旅行摄影师', followers: '8.5万', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20photographer%20avatar%20portrait&image_size=square' },
    { id: 3, username: '生活记录者', followers: '6.8万', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=lifestyle%20blogger%20avatar%20portrait&image_size=square' }
  ];

  // 从本地存储加载关注状态
  useEffect(() => {
    const savedFollows = localStorage.getItem('followedUsers');
    if (savedFollows) {
      setFollowedUsers(new Set(JSON.parse(savedFollows)));
    }
  }, []);

  // 保存关注状态到本地存储
  const saveFollowState = (follows: Set<number>) => {
    localStorage.setItem('followedUsers', JSON.stringify(Array.from(follows)));
  };

  // 处理关注/取消关注
  const handleFollow = async (userId: number, username: string) => {
    // 添加触觉反馈
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setLoadingUsers(prev => new Set(prev).add(userId));

    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));

      const newFollowedUsers = new Set(followedUsers);
      const isFollowing = followedUsers.has(userId);

      if (isFollowing) {
        newFollowedUsers.delete(userId);
        setToastMessage(`已取消关注 ${username}`);
        setToastType('success');
      } else {
        newFollowedUsers.add(userId);
        setToastMessage(`已关注 ${username}`);
        setToastType('success');
      }

      setFollowedUsers(newFollowedUsers);
      saveFollowState(newFollowedUsers);
      setShowToast(true);
    } catch (error) {
      setToastMessage('操作失败，请重试');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-gray-900">
        <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-800 rounded-full px-3 sm:px-4 py-2 sm:py-3">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户、话题、音乐..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-sm sm:text-base"
          />
        </div>
      </div>

      {/* 热门直播区域 */}
      <div className="p-3 sm:p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Video className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold">热门直播</h2>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-ping"></div>
          </div>
          <Link to="/live" className="text-red-400 text-xs sm:text-sm hover:text-red-300">
            查看全部
          </Link>
        </div>
        
        <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2">
          {[
            { id: 1, title: '音乐现场', viewers: '12.3K', avatar: '🎵', isLive: true },
            { id: 2, title: '游戏直播', viewers: '8.7K', avatar: '🎮', isLive: true },
            { id: 3, title: '美食制作', viewers: '5.2K', avatar: '🍳', isLive: true },
            { id: 4, title: '户外探险', viewers: '3.1K', avatar: '🏔️', isLive: true },
          ].map((stream) => (
            <Link
              key={stream.id}
              to="/live"
              className="flex-shrink-0 w-28 sm:w-32 bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
            >
              <div className="relative aspect-video bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">{stream.avatar}</span>
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center space-x-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs">LIVE</span>
                </div>
                <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black/50 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center space-x-1">
                  <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="text-xs">{stream.viewers}</span>
                </div>
              </div>
              <div className="p-1.5 sm:p-2">
                <p className="text-xs sm:text-sm font-medium truncate">{stream.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-3 sm:px-4 py-4 sm:py-6 pb-24 space-y-4 sm:space-y-6">
        {/* 热门话题 */}
        <section>
          <div className="flex items-center mb-3 sm:mb-4">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-1.5 sm:mr-2" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">热门话题</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {trendingTopics.map((topic) => (
              <div key={topic.id} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex items-center mb-1.5 sm:mb-2">
                  <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mr-1" />
                  <span className="font-medium text-gray-800 text-sm sm:text-base truncate">{topic.name}</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-500">{topic.count} 参与</span>
              </div>
            ))}
          </div>
        </section>

        {/* 推荐用户 */}
        {/* 广场视频内容 */}
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center">
              <Video className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-1.5 sm:mr-2" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">广场精选</h2>
            </div>
            <button 
              onClick={refreshRecommendations}
              className="text-purple-500 text-xs sm:text-sm hover:text-purple-600"
            >
              刷新
            </button>
          </div>
          
          {isRecommendationLoading ? (
            <div className="flex justify-center py-6 sm:py-8">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {recommendations.slice(0, 8).map((rec, index) => {
                const categories = ['美食', '旅行', '生活', '音乐', '舞蹈', '搞笑', '教育', '科技'];
                const category = rec.category || categories[index % categories.length];
                
                return (
                  <div key={rec.videoId} className="bg-white rounded-lg overflow-hidden border border-gray-200">
                    <div className="relative aspect-video bg-gradient-to-br from-purple-500 to-pink-500">
                      <img
                        src={`https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(category + ' video thumbnail')}&image_size=landscape_16_9`}
                        alt={category}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black/50 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                        {Math.floor(Math.random() * 60) + 15}s
                      </div>
                    </div>
                    <div className="p-2 sm:p-3">
                      <p className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 mb-1">
                        {category}内容分享 #{category}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="truncate">@{category}达人{index + 1}</span>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>{Math.floor(Math.random() * 1000) + 100}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 推荐用户 */}
        <section>
          <div className="flex items-center mb-3 sm:mb-4">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-1.5 sm:mr-2" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">推荐关注</h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {recommendedUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-2 sm:mr-3 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-800 text-sm sm:text-base truncate">{user.username}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">{user.followers} 粉丝</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleFollow(user.id, user.username)}
                  disabled={loadingUsers.has(user.id)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 min-w-[60px] sm:min-w-[80px] flex items-center justify-center space-x-1 flex-shrink-0 ${
                    followedUsers.has(user.id)
                      ? 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                  } ${loadingUsers.has(user.id) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loadingUsers.has(user.id) ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : followedUsers.has(user.id) ? (
                    <>
                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">已关注</span>
                    </>
                  ) : (
                    <span>关注</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Toast 通知 */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}