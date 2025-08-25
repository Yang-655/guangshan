import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  MessageCircle,
  Navigation,
  Phone,
  MoreHorizontal,
  Edit3,
  Trash2
} from 'lucide-react';

interface MeetupRecord {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  location: {
    name: string;
    address: string;
  };
  scheduledTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  rating?: number;
  review?: string;
  createdAt: string;
  emergencyContact?: string;
  isLocationShared: boolean;
}

interface MeetupHistoryProps {
  onClose: () => void;
}

const mockMeetupHistory: MeetupRecord[] = [
  {
    id: '1',
    itemId: '1',
    itemTitle: 'iPhone 13 Pro 128GB 深空灰',
    itemImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2013%20Pro%20space%20gray&image_size=square',
    sellerId: 'seller1',
    sellerName: '数码达人',
    sellerAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20enthusiast%20avatar&image_size=square',
    location: {
      name: '朝阳大悦城',
      address: '朝阳区朝阳北路101号'
    },
    scheduledTime: '2024-01-15 14:00',
    status: 'completed',
    rating: 5,
    review: '卖家很诚信，商品描述准确，碰面很顺利！',
    createdAt: '2024-01-14 10:30',
    emergencyContact: '138****8888',
    isLocationShared: true
  },
  {
    id: '2',
    itemId: '2',
    itemTitle: '北欧风实木书桌',
    itemImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20wooden%20desk&image_size=square',
    sellerId: 'seller2',
    sellerName: '家居小达人',
    sellerAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=home%20decor%20enthusiast%20avatar&image_size=square',
    location: {
      name: '国贸地铁站',
      address: '朝阳区建国门外大街1号'
    },
    scheduledTime: '2024-01-16 10:00',
    status: 'scheduled',
    createdAt: '2024-01-15 16:20',
    emergencyContact: '139****9999',
    isLocationShared: false
  },
  {
    id: '3',
    itemId: '3',
    itemTitle: '小米空气净化器',
    itemImage: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=xiaomi%20air%20purifier&image_size=square',
    sellerId: 'seller3',
    sellerName: '生活达人',
    sellerAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=lifestyle%20enthusiast%20avatar&image_size=square',
    location: {
      name: '星巴克(国贸店)',
      address: '朝阳区建国门外大街甲6号'
    },
    scheduledTime: '2024-01-13 15:30',
    status: 'cancelled',
    createdAt: '2024-01-12 09:15',
    isLocationShared: false
  }
];

const statusConfig = {
  scheduled: { 
    label: '已预约', 
    color: 'text-blue-600 bg-blue-50', 
    icon: Calendar 
  },
  in_progress: { 
    label: '进行中', 
    color: 'text-orange-600 bg-orange-50', 
    icon: Clock 
  },
  completed: { 
    label: '已完成', 
    color: 'text-green-600 bg-green-50', 
    icon: CheckCircle 
  },
  cancelled: { 
    label: '已取消', 
    color: 'text-gray-600 bg-gray-50', 
    icon: XCircle 
  },
  no_show: { 
    label: '未到场', 
    color: 'text-red-600 bg-red-50', 
    icon: AlertCircle 
  }
};

export default function MeetupHistory({ onClose }: MeetupHistoryProps) {
  const [selectedTab, setSelectedTab] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [selectedMeetup, setSelectedMeetup] = useState<MeetupRecord | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const filteredHistory = mockMeetupHistory.filter(meetup => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'scheduled') return ['scheduled', 'in_progress'].includes(meetup.status);
    if (selectedTab === 'completed') return meetup.status === 'completed';
    return true;
  });

  const handleRescheduleMeetup = (meetup: MeetupRecord) => {
    alert(`重新安排与 ${meetup.sellerName} 的碰面`);
  };

  const handleCancelMeetup = (meetup: MeetupRecord) => {
    if (confirm('确定要取消这次碰面吗？')) {
      alert('碰面已取消');
    }
  };

  const handleContactSeller = (meetup: MeetupRecord) => {
    alert(`正在联系 ${meetup.sellerName}...`);
  };

  const handleNavigateToLocation = (meetup: MeetupRecord) => {
    alert(`正在导航到 ${meetup.location.name}...`);
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      alert('请选择评分');
      return;
    }
    
    alert(`评价已提交！\n评分：${rating}星\n评价：${review || '无'}`);
    setShowRatingModal(false);
    setSelectedMeetup(null);
    setRating(0);
    setReview('');
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return '明天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === -1) return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-md h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">碰面记录</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b">
          {[
            { key: 'all', label: '全部' },
            { key: 'scheduled', label: '待碰面' },
            { key: 'completed', label: '已完成' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedTab(key as any)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                selectedTab === key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 碰面记录列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Calendar className="w-12 h-12 mb-2" />
              <p>暂无碰面记录</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredHistory.map((meetup) => {
                const StatusIcon = statusConfig[meetup.status].icon;
                
                return (
                  <div key={meetup.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    {/* 商品信息 */}
                    <div className="flex items-start space-x-3 mb-3">
                      <img 
                        src={meetup.itemImage} 
                        alt={meetup.itemTitle}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {meetup.itemTitle}
                        </h3>
                        <div className="flex items-center mt-1">
                          <img 
                            src={meetup.sellerAvatar} 
                            alt={meetup.sellerName}
                            className="w-4 h-4 rounded-full mr-1"
                          />
                          <span className="text-xs text-gray-600">{meetup.sellerName}</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[meetup.status].color}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {statusConfig[meetup.status].label}
                      </div>
                    </div>

                    {/* 碰面信息 */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="line-clamp-1">{meetup.location.name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{formatDateTime(meetup.scheduledTime)}</span>
                      </div>
                      {meetup.emergencyContact && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>紧急联系人: {meetup.emergencyContact}</span>
                        </div>
                      )}
                    </div>

                    {/* 评价信息 */}
                    {meetup.status === 'completed' && meetup.rating && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium text-gray-900 mr-2">我的评价:</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${
                                  i < meetup.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                        {meetup.review && (
                          <p className="text-sm text-gray-700">{meetup.review}</p>
                        )}
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex space-x-2">
                      {meetup.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handleContactSeller(meetup)}
                            className="flex-1 flex items-center justify-center py-2 px-3 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            联系
                          </button>
                          <button
                            onClick={() => handleNavigateToLocation(meetup)}
                            className="flex-1 flex items-center justify-center py-2 px-3 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition-colors"
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            导航
                          </button>
                          <button
                            onClick={() => handleRescheduleMeetup(meetup)}
                            className="flex items-center justify-center py-2 px-3 bg-gray-500 text-white rounded-md text-xs font-medium hover:bg-gray-600 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleCancelMeetup(meetup)}
                            className="flex items-center justify-center py-2 px-3 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      
                      {meetup.status === 'completed' && !meetup.rating && (
                        <button
                          onClick={() => {
                            setSelectedMeetup(meetup);
                            setShowRatingModal(true);
                          }}
                          className="flex-1 flex items-center justify-center py-2 px-3 bg-yellow-500 text-white rounded-md text-xs font-medium hover:bg-yellow-600 transition-colors"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          评价交易
                        </button>
                      )}
                      
                      {meetup.status === 'completed' && (
                        <button
                          onClick={() => handleContactSeller(meetup)}
                          className="flex-1 flex items-center justify-center py-2 px-3 bg-gray-500 text-white rounded-md text-xs font-medium hover:bg-gray-600 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          再次联系
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 评价弹窗 */}
      {showRatingModal && selectedMeetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">评价交易</h3>
            
            <div className="mb-4">
              <div className="text-sm text-gray-700 mb-2">与 {selectedMeetup.sellerName} 的交易体验如何？</div>
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star 
                      className={`w-8 h-8 ${
                        star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                评价内容 (可选)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="分享你的交易体验..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setSelectedMeetup(null);
                  setRating(0);
                  setReview('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitRating}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                提交评价
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}