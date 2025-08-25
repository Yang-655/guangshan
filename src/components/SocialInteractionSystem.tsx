import React, { useState } from 'react';
import { Heart, Star, Gift, Award, Bell, Download, X, Coins, Sparkles, Crown } from 'lucide-react';
import { useToast } from './Toast';

interface SocialInteractionSystemProps {
  userId: string;
  onClose: () => void;
}

interface InteractionStats {
  likes: number;
  favorites: number;
  gifts: number;
  rewards: number;
}

interface GiftItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface RewardTier {
  id: string;
  name: string;
  amount: number;
  icon: string;
  color: string;
}

const SocialInteractionSystem: React.FC<SocialInteractionSystemProps> = ({ userId, onClose }) => {
  const { success, info, warning } = useToast();
  const [activeTab, setActiveTab] = useState<'like' | 'favorite' | 'gift' | 'reward'>('like');
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [selectedReward, setSelectedReward] = useState<RewardTier | null>(null);
  const [userCoins, setUserCoins] = useState(1000); // 用户金币数量
  
  const [stats, setStats] = useState<InteractionStats>({
    likes: 1234,
    favorites: 567,
    gifts: 89,
    rewards: 45
  });

  // 礼物列表
  const gifts: GiftItem[] = [
    { id: '1', name: '玫瑰花', icon: '🌹', price: 10, rarity: 'common' },
    { id: '2', name: '巧克力', icon: '🍫', price: 20, rarity: 'common' },
    { id: '3', name: '香水', icon: '💐', price: 50, rarity: 'rare' },
    { id: '4', name: '钻戒', icon: '💍', price: 100, rarity: 'epic' },
    { id: '5', name: '跑车', icon: '🏎️', price: 500, rarity: 'legendary' },
    { id: '6', name: '城堡', icon: '🏰', price: 1000, rarity: 'legendary' }
  ];

  // 打赏等级
  const rewardTiers: RewardTier[] = [
    { id: '1', name: '小小心意', amount: 5, icon: '💝', color: 'bg-blue-500' },
    { id: '2', name: '表示支持', amount: 20, icon: '💖', color: 'bg-purple-500' },
    { id: '3', name: '非常喜欢', amount: 50, icon: '💎', color: 'bg-pink-500' },
    { id: '4', name: '超级粉丝', amount: 100, icon: '👑', color: 'bg-yellow-500' },
    { id: '5', name: '土豪打赏', amount: 500, icon: '🎖️', color: 'bg-red-500' }
  ];

  // 处理点赞
  const handleLike = () => {
    setIsLiked(!isLiked);
    setStats(prev => ({
      ...prev,
      likes: isLiked ? prev.likes - 1 : prev.likes + 1
    }));
    success(isLiked ? '已取消点赞' : '点赞成功！');
  };

  // 处理收藏
  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    setStats(prev => ({
      ...prev,
      favorites: isFavorited ? prev.favorites - 1 : prev.favorites + 1
    }));
    success(isFavorited ? '已取消收藏' : '收藏成功！');
  };

  // 处理送礼
  const handleSendGift = (gift: GiftItem) => {
    if (userCoins < gift.price) {
      warning('金币不足，请先充值！');
      return;
    }
    
    setUserCoins(prev => prev - gift.price);
    setStats(prev => ({ ...prev, gifts: prev.gifts + 1 }));
    setSelectedGift(gift);
    
    success(`成功送出${gift.name}${gift.icon}！`);
    
    // 3秒后清除选中状态
    setTimeout(() => setSelectedGift(null), 3000);
  };

  // 处理打赏
  const handleReward = (tier: RewardTier) => {
    if (userCoins < tier.amount) {
      warning('金币不足，请先充值！');
      return;
    }
    
    setUserCoins(prev => prev - tier.amount);
    setStats(prev => ({ ...prev, rewards: prev.rewards + 1 }));
    setSelectedReward(tier);
    
    success(`${tier.name}打赏成功！感谢您的支持！`);
    
    // 3秒后清除选中状态
    setTimeout(() => setSelectedReward(null), 3000);
  };

  // 获取稀有度颜色
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">社交互动</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-yellow-600">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-medium">{userCoins}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex border-b">
          {[
            { key: 'like', label: '点赞', icon: Heart, count: stats.likes },
            { key: 'favorite', label: '收藏', icon: Star, count: stats.favorites },
            { key: 'gift', label: '送礼', icon: Gift, count: stats.gifts },
            { key: 'reward', label: '打赏', icon: Award, count: stats.rewards }
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex flex-col items-center py-3 transition-colors ${
                activeTab === key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
              <span className="text-xs text-gray-500">{count}</span>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {activeTab === 'like' && (
            <div className="text-center">
              <div className="mb-6">
                <button
                  onClick={handleLike}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
                    isLiked
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-10 h-10 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isLiked ? '已点赞' : '点个赞吧'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isLiked ? '感谢您的支持！' : '您的点赞是对创作者最大的鼓励'}
              </p>
            </div>
          )}

          {activeTab === 'favorite' && (
            <div className="text-center">
              <div className="mb-6">
                <button
                  onClick={handleFavorite}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
                    isFavorited
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'
                  }`}
                >
                  <Star className={`w-10 h-10 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isFavorited ? '已收藏' : '收藏作品'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isFavorited ? '已添加到您的收藏夹' : '收藏后可以随时回看'}
              </p>
            </div>
          )}

          {activeTab === 'gift' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">选择礼物</h3>
              <div className="grid grid-cols-2 gap-3">
                {gifts.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    disabled={userCoins < gift.price}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      getRarityColor(gift.rarity)
                    } ${userCoins < gift.price ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'} ${
                      selectedGift?.id === gift.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="text-3xl mb-2">{gift.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{gift.name}</div>
                    <div className="flex items-center justify-center mt-1 text-yellow-600">
                      <Coins className="w-3 h-3 mr-1" />
                      <span className="text-xs">{gift.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reward' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">选择打赏金额</h3>
              <div className="space-y-3">
                {rewardTiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => handleReward(tier)}
                    disabled={userCoins < tier.amount}
                    className={`w-full p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      userCoins < tier.amount ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-300 hover:shadow-md'
                    } ${selectedReward?.id === tier.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${tier.color}`}>
                          <span className="text-lg">{tier.icon}</span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{tier.name}</div>
                          <div className="flex items-center text-yellow-600">
                            <Coins className="w-3 h-3 mr-1" />
                            <span className="text-sm">{tier.amount}</span>
                          </div>
                        </div>
                      </div>
                      <Sparkles className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-center space-x-2 text-gray-500 text-xs">
            <Bell className="w-4 h-4" />
            <span>您的互动将通知创作者</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialInteractionSystem;