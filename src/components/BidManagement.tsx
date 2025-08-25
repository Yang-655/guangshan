import React, { useState } from 'react';
import { Star, Clock, DollarSign, MessageCircle, CheckCircle, XCircle, AlertTriangle, User, Award, Shield } from 'lucide-react';
import LazyImageWithFallback from './LazyImageWithFallback';
import { useToast } from './Toast';

interface Bidder {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  completedTasks: number;
  bidAmount: number;
  bidTime: string;
  message: string;
  estimatedDays: number;
  creditScore: number;
  status: 'pending' | 'selected' | 'rejected';
  portfolio?: string[];
  skills?: string[];
  responseTime?: number; // 平均响应时间（小时）
}

interface BidManagementProps {
  bidders: Bidder[];
  taskReward: number;
  onSelectBidder: (bidderId: string) => void;
  onRejectBidder: (bidderId: string) => void;
  onContactBidder: (bidderId: string) => void;
  isPublisher: boolean;
  selectedBidderId?: string;
}

const BidManagement: React.FC<BidManagementProps> = ({
  bidders,
  taskReward,
  onSelectBidder,
  onRejectBidder,
  onContactBidder,
  isPublisher,
  selectedBidderId
}) => {
  const { success, error } = useToast();
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'time' | 'credit'>('rating');
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);
  const [expandedBidder, setExpandedBidder] = useState<string | null>(null);

  const sortedBidders = [...bidders].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'price':
        return a.bidAmount - b.bidAmount;
      case 'time':
        return new Date(a.bidTime).getTime() - new Date(b.bidTime).getTime();
      case 'credit':
        return b.creditScore - a.creditScore;
      default:
        return 0;
    }
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriceComparisonColor = (bidAmount: number) => {
    const percentage = (bidAmount / taskReward) * 100;
    if (percentage <= 80) return 'text-green-600';
    if (percentage <= 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSelectBidder = (bidderId: string) => {
    setShowConfirmModal(bidderId);
  };

  const confirmSelection = (bidderId: string) => {
    onSelectBidder(bidderId);
    setShowConfirmModal(null);
    success('已选择该竞标者');
  };

  const handleRejectBidder = (bidderId: string) => {
    onRejectBidder(bidderId);
    success('已拒绝该竞标');
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return '< 1小时';
    if (hours < 24) return `${Math.round(hours)}小时`;
    return `${Math.round(hours / 24)}天`;
  };

  return (
    <div className="space-y-4">
      {/* 排序选项 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">竞标管理 ({bidders.length})</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="rating">评分</option>
            <option value="price">价格</option>
            <option value="time">时间</option>
            <option value="credit">信用</option>
          </select>
        </div>
      </div>

      {/* 竞标者列表 */}
      <div className="space-y-3">
        {sortedBidders.map((bidder) => (
          <div
            key={bidder.id}
            className={`bg-white border rounded-lg p-4 transition-all ${
              bidder.status === 'selected'
                ? 'border-green-300 bg-green-50'
                : bidder.status === 'rejected'
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
            }`}
          >
            {/* 竞标者基本信息 */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <LazyImageWithFallback
                  src={bidder.avatar}
                  alt={bidder.username}
                  className="w-12 h-12 rounded-full object-cover"
                  fallbackSrc="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar&image_size=square"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">{bidder.username}</h4>
                    {bidder.status === 'selected' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {bidder.status === 'rejected' && (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  
                  {/* 评分和统计 */}
                  <div className="flex items-center space-x-4 mt-1 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className={`w-4 h-4 fill-current ${getRatingColor(bidder.rating)}`} />
                      <span className={getRatingColor(bidder.rating)}>{bidder.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{bidder.completedTasks}个任务</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className={`w-4 h-4 ${getCreditScoreColor(bidder.creditScore)}`} />
                      <span className={getCreditScoreColor(bidder.creditScore)}>信用{bidder.creditScore}</span>
                    </div>
                    {bidder.responseTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">响应{formatResponseTime(bidder.responseTime)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 竞标金额和操作 */}
              <div className="text-right">
                <div className={`text-xl font-bold ${getPriceComparisonColor(bidder.bidAmount)}`}>
                  ¥{bidder.bidAmount}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  预计{bidder.estimatedDays}天完成
                </div>
                
                {isPublisher && bidder.status === 'pending' && (
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleSelectBidder(bidder.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      选择
                    </button>
                    <button
                      onClick={() => handleRejectBidder(bidder.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      拒绝
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => onContactBidder(bidder.id)}
                  className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm mt-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>联系</span>
                </button>
              </div>
            </div>

            {/* 竞标消息 */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{bidder.message}</p>
            </div>

            {/* 技能标签 */}
            {bidder.skills && bidder.skills.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {bidder.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 展开/收起详细信息 */}
            <button
              onClick={() => setExpandedBidder(expandedBidder === bidder.id ? null : bidder.id)}
              className="text-sm text-purple-600 hover:text-purple-700 mt-2"
            >
              {expandedBidder === bidder.id ? '收起详情' : '查看详情'}
            </button>

            {/* 详细信息 */}
            {expandedBidder === bidder.id && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p><strong>竞标时间:</strong> {new Date(bidder.bidTime).toLocaleString()}</p>
                  <p><strong>信用评分:</strong> {bidder.creditScore}/100</p>
                  {bidder.responseTime && (
                    <p><strong>平均响应时间:</strong> {formatResponseTime(bidder.responseTime)}</p>
                  )}
                </div>
                
                {/* 作品集预览 */}
                {bidder.portfolio && bidder.portfolio.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">作品集预览</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {bidder.portfolio.slice(0, 3).map((image, index) => (
                        <LazyImageWithFallback
                          key={index}
                          src={image}
                          alt={`作品 ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                          fallbackSrc="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=portfolio%20placeholder&image_size=square"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 确认选择模态框 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">确认选择竞标者</h3>
            </div>
            <p className="text-gray-600 mb-6">
              选择后将无法更改，请确认您要选择这位竞标者完成任务。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => confirmSelection(showConfirmModal)}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {bidders.length === 0 && (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无竞标</h3>
          <p className="text-gray-500">还没有人对这个任务进行竞标</p>
        </div>
      )}
    </div>
  );
};

export default BidManagement;