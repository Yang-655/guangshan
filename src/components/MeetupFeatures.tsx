import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Shield, 
  Phone, 
  MessageCircle, 
  Calendar,
  AlertTriangle,
  Star,
  CheckCircle,
  Navigation,
  Users,
  X,
  Award,
  Flag,
  Eye,
  Video,
  Play,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings
} from 'lucide-react';
import LocationServices from './LocationServices';

interface MeetupLocation {
  id: string;
  name: string;
  address: string;
  type: 'metro' | 'mall' | 'cafe' | 'public';
  distance: string;
  safetyRating: number;
  isRecommended: boolean;
}

interface NearbyVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  publisherName: string;
  publisherAvatar: string;
  distance: number; // 距离（米）
  publishedAt: string;
  viewCount: number;
  location: {
    lat: number;
    lng: number;
  };
  isLive?: boolean;
}

interface MeetupFeaturesProps {
  itemId: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  isVerified: boolean;
  location: string;
  onClose: () => void;
}

const safeLocations: MeetupLocation[] = [
  {
    id: '1',
    name: '朝阳大悦城',
    address: '朝阳区朝阳北路101号',
    type: 'mall',
    distance: '1.2km',
    safetyRating: 5,
    isRecommended: true
  },
  {
    id: '2', 
    name: '国贸地铁站',
    address: '朝阳区建国门外大街1号',
    type: 'metro',
    distance: '2.1km',
    safetyRating: 5,
    isRecommended: true
  },
  {
    id: '3',
    name: '星巴克(国贸店)',
    address: '朝阳区建国门外大街甲6号',
    type: 'cafe',
    distance: '1.8km',
    safetyRating: 4,
    isRecommended: false
  }
];

const timeSlots = [
  { id: 'today_morning', label: '今天上午', time: '09:00-12:00' },
  { id: 'today_afternoon', label: '今天下午', time: '14:00-17:00' },
  { id: 'tomorrow_morning', label: '明天上午', time: '09:00-12:00' },
  { id: 'tomorrow_afternoon', label: '明天下午', time: '14:00-17:00' },
  { id: 'weekend', label: '本周末', time: '自选时间' },
  { id: 'custom', label: '自定义时间', time: '点击选择' }
];

const safetyTips = [
  '选择人流量大的公共场所碰面',
  '白天时间碰面更安全',
  '告知朋友或家人碰面信息',
  '验货时注意保护个人隐私',
  '如遇异常情况立即离开',
  '保留交易凭证和聊天记录'
];

// 模拟附近视频数据
const mockNearbyVideos: NearbyVideo[] = [
  {
    id: '1',
    title: '朝阳大悦城美食探店',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=food%20court%20shopping%20mall%20video%20thumbnail&image_size=landscape_16_9',
    duration: '2:30',
    publisherName: '美食小达人',
    publisherAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=food%20blogger%20avatar&image_size=square',
    distance: 5,
    publishedAt: '3分钟前',
    viewCount: 128,
    location: { lat: 39.9042, lng: 116.4074 },
    isLive: false
  },
  {
    id: '2',
    title: '国贸地铁站实时人流',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=subway%20station%20crowd%20live%20stream&image_size=landscape_16_9',
    duration: 'LIVE',
    publisherName: '交通助手',
    publisherAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=traffic%20helper%20avatar&image_size=square',
    distance: 8,
    publishedAt: '正在直播',
    viewCount: 456,
    location: { lat: 39.9041, lng: 116.4075 },
    isLive: true
  },
  {
    id: '3',
    title: '星巴克新品试喝',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=starbucks%20coffee%20new%20product%20review&image_size=landscape_16_9',
    duration: '1:45',
    publisherName: '咖啡爱好者',
    publisherAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=coffee%20lover%20avatar&image_size=square',
    distance: 9,
    publishedAt: '10分钟前',
    viewCount: 89,
    location: { lat: 39.9040, lng: 116.4076 },
    isLive: false
  }
];

export default function MeetupFeatures({ 
  itemId, 
  sellerId, 
  sellerName, 
  sellerRating, 
  isVerified, 
  location, 
  onClose 
}: MeetupFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'contact' | 'meetup' | 'safety' | 'videos'>('contact');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // 处理时间选择
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    console.log('选择时间:', time);
    // TODO: 实现时间选择逻辑
  };

  // 处理自定义时间
  const handleCustomTime = () => {
    console.log('打开自定义时间选择器');
    // TODO: 打开时间选择器
  };

  // 处理快速操作
  const handleQuickAction = (action: string) => {
    console.log('快速操作:', action);
    switch (action) {
      case 'inquiry':
        console.log('询问详情');
        break;
      case 'negotiate':
        console.log('议价');
        break;
      case 'more_images':
        console.log('查看更多图片');
        break;
      case 'usage_info':
        console.log('了解使用情况');
        break;
      default:
        break;
    }
  };
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [shareLocation, setShareLocation] = useState(false);
  const [showLocationServices, setShowLocationServices] = useState(false);
  
  // 附近视频相关状态
  const [nearbyVideos, setNearbyVideos] = useState<NearbyVideo[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [videoPrivacyEnabled, setVideoPrivacyEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // 计算两点间距离（米）
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // 获取用户位置
  const getUserLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // 如果获取位置失败，使用默认位置（北京国贸）
          console.warn('获取位置失败，使用默认位置:', error);
          resolve({ lat: 39.9042, lng: 116.4074 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  };

  // 获取附近视频
  const fetchNearbyVideos = async () => {
    if (!videoPrivacyEnabled) return;
    
    setIsLoadingVideos(true);
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 筛选10米范围内的视频
      const filteredVideos = mockNearbyVideos.filter(video => {
        const distance = calculateDistance(
          location.lat, location.lng,
          video.location.lat, video.location.lng
        );
        return distance <= 10;
      }).map(video => ({
        ...video,
        distance: Math.round(calculateDistance(
          location.lat, location.lng,
          video.location.lat, video.location.lng
        ))
      })).sort((a, b) => a.distance - b.distance);
      
      setNearbyVideos(filteredVideos);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('获取附近视频失败:', error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // 播放视频
  const handlePlayVideo = (video: NearbyVideo) => {
    alert(`正在播放视频: ${video.title}\n发布者: ${video.publisherName}\n距离: ${video.distance}米`);
  };

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 自动刷新附近视频
  useEffect(() => {
    if (activeTab === 'videos' && videoPrivacyEnabled) {
      fetchNearbyVideos();
      
      const interval = setInterval(() => {
        if (activeTab === 'videos' && videoPrivacyEnabled) {
          fetchNearbyVideos();
        }
      }, 30000); // 每30秒刷新一次
      
      return () => clearInterval(interval);
    }
  }, [activeTab, videoPrivacyEnabled]);

  const handleContactSeller = () => {
    // 模拟联系卖家
    alert(`正在联系 ${sellerName}...`);
  };

  const handleScheduleMeetup = () => {
    if (!selectedLocation || !selectedTime) {
      alert('请选择碰面地点和时间');
      return;
    }
    
    // 模拟预约碰面
    const locationName = safeLocations.find(loc => loc.id === selectedLocation)?.name;
    const timeSlot = timeSlots.find(slot => slot.id === selectedTime)?.label;
    
    alert(`碰面已预约！\n地点：${locationName}\n时间：${timeSlot}\n\n请注意安全，选择公共场所碰面。`);
    onClose();
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'metro': return '🚇';
      case 'mall': return '🏬';
      case 'cafe': return '☕';
      case 'public': return '🏛️';
      default: return '📍';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">联系卖家</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 卖家信息 */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {sellerName.charAt(0)}
              </div>
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{sellerName}</span>
                  {isVerified && (
                    <CheckCircle className="w-4 h-4 text-blue-500 ml-1" />
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                  <span>{sellerRating}</span>
                  <span className="mx-2">·</span>
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{location}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end mb-1">
                <Award className="w-3 h-3 text-yellow-500 mr-1" />
                <span className="text-xs text-gray-500">信用等级</span>
              </div>
              <div className="text-sm font-medium text-green-600">优秀 (AAA)</div>
              <div className="text-xs text-gray-500">实名认证 ✓</div>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex border-b">
          {[
            { key: 'contact', label: '立即联系', icon: MessageCircle },
            { key: 'meetup', label: '预约碰面', icon: Calendar },
            { key: 'safety', label: '安全须知', icon: Shield },
            { key: 'videos', label: '附近视频', icon: Video }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 mr-1" />
              {label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="p-4 overflow-y-auto max-h-96">
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleContactSeller}
                  className="flex items-center justify-center py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  发消息
                </button>
                <button 
                  onClick={handleContactSeller}
                  className="flex items-center justify-center py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  打电话
                </button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <div className="font-medium mb-1">安全提醒</div>
                    <div>建议选择公共场所碰面，保护个人信息安全</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">快速操作</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button 
                  onClick={() => handleQuickAction('inquiry')}
                  className="py-2 px-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  询问详情
                </button>
                <button 
                  onClick={() => handleQuickAction('negotiate')}
                  className="py-2 px-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  议价
                </button>
                <button 
                  onClick={() => handleQuickAction('more_images')}
                  className="py-2 px-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  查看更多图片
                </button>
                <button 
                  onClick={() => handleQuickAction('usage_info')}
                  className="py-2 px-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  了解使用情况
                </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'meetup' && (
            <div className="space-y-4">
              {/* 碰面地点选择 */}
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">选择碰面地点</div>
                <div className="space-y-2">
                  {safeLocations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => setSelectedLocation(location.id)}
                      className={`w-full p-3 border rounded-lg text-left transition-colors ${
                        selectedLocation === location.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{getLocationIcon(location.type)}</span>
                            <span className="font-medium text-gray-900">{location.name}</span>
                            {location.isRecommended && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                推荐
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{location.address}</div>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Navigation className="w-3 h-3 mr-1" />
                            <span>{location.distance}</span>
                            <span className="mx-2">·</span>
                            <div className="flex items-center">
                              {[...Array(location.safetyRating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 碰面时间选择 */}
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">选择碰面时间</div>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedTime(slot.id)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        selectedTime === slot.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">{slot.label}</div>
                      <div className="text-xs text-gray-600">{slot.time}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 附加选项 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Navigation className="w-4 h-4 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-900">实时位置共享</span>
                  </div>
                  <button
                    onClick={() => setShareLocation(!shareLocation)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      shareLocation ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      shareLocation ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div>
                  <label className="text-sm text-gray-900">紧急联系人</label>
                  <input
                    type="text"
                    placeholder="输入紧急联系人电话"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 确认按钮 */}
              <div className="space-y-3">
                <button
                  onClick={handleScheduleMeetup}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  确认预约碰面
                </button>
                
                {selectedLocation && selectedTime && (
                  <button
                    onClick={() => {
                      const location = safeLocations.find(loc => loc.id === selectedLocation);
                      if (location) {
                        setShowLocationServices(true);
                      }
                    }}
                    className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm"
                  >
                    <Navigation className="w-4 h-4 inline mr-2" />
                    查看位置服务
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-red-900 mb-2">安全碰面须知</div>
                    <div className="space-y-2">
                      {safetyTips.map((tip, index) => (
                        <div key={index} className="flex items-start text-sm text-red-800">
                          <span className="w-4 h-4 bg-red-200 rounded-full flex items-center justify-center text-xs font-bold text-red-600 mr-2 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-blue-900 mb-2">平台保障</div>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>• 实名认证卖家，降低交易风险</div>
                      <div>• 24小时客服支持，及时处理纠纷</div>
                      <div>• 交易记录保存，维护合法权益</div>
                      <div>• 举报投诉渠道，净化交易环境</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Award className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-green-900 mb-2">信用保障体系</div>
                    <div className="text-sm text-green-800 space-y-1">
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-600 mr-2" />
                        <span>实名认证用户，身份可信</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-600 mr-2" />
                        <span>信用评级AAA，交易记录良好</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-600 mr-2" />
                        <span>平台担保交易，资金安全</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-600 mr-2" />
                        <span>7天无理由退换，售后保障</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <button 
                  onClick={() => alert('查看卖家详细信用报告')}
                  className="flex flex-col items-center justify-center py-3 px-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs"
                >
                  <Eye className="w-4 h-4 mb-1" />
                  <span>信用报告</span>
                </button>
                <button 
                  onClick={() => alert('举报用户违规行为')}
                  className="flex flex-col items-center justify-center py-3 px-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs"
                >
                  <Flag className="w-4 h-4 mb-1" />
                  <span>举报用户</span>
                </button>
                <button 
                  onClick={() => alert('联系客服：400-888-8888')}
                  className="flex flex-col items-center justify-center py-3 px-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                >
                  <Phone className="w-4 h-4 mb-1" />
                  <span>客服热线</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-4">
              {/* 功能状态栏 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 text-xs ${
                    isOnline ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span>{isOnline ? '在线' : '离线'}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    更新: {lastUpdateTime.toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchNearbyVideos}
                    disabled={isLoadingVideos || !videoPrivacyEnabled}
                    className="p-1 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingVideos ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setVideoPrivacyEnabled(!videoPrivacyEnabled)}
                    className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 隐私设置 */}
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <Video className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-900">显示附近视频</span>
                </div>
                <button
                  onClick={() => setVideoPrivacyEnabled(!videoPrivacyEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    videoPrivacyEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    videoPrivacyEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {!videoPrivacyEnabled && (
                <div className="text-center py-8">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <div className="text-gray-600 text-sm">已关闭附近视频功能</div>
                  <div className="text-gray-500 text-xs mt-1">开启后可查看附近10米范围内的视频</div>
                </div>
              )}

              {videoPrivacyEnabled && (
                <>
                  {isLoadingVideos && (
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-3 animate-spin" />
                      <div className="text-gray-600 text-sm">正在搜索附近视频...</div>
                    </div>
                  )}

                  {!isLoadingVideos && nearbyVideos.length === 0 && (
                    <div className="text-center py-8">
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <div className="text-gray-600 text-sm">附近10米内暂无视频</div>
                      <div className="text-gray-500 text-xs mt-1">稍后再试或移动到其他位置</div>
                    </div>
                  )}

                  {!isLoadingVideos && nearbyVideos.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-900">
                        附近视频 ({nearbyVideos.length})
                      </div>
                      {nearbyVideos.map((video) => (
                        <div key={video.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="flex">
                            {/* 视频缩略图 */}
                            <div className="relative w-24 h-16 flex-shrink-0">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <button
                                  onClick={() => handlePlayVideo(video)}
                                  className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                                >
                                  <Play className="w-4 h-4 text-gray-700 ml-0.5" />
                                </button>
                              </div>
                              <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white text-xs rounded">
                                {video.isLive ? (
                                  <span className="text-red-400 font-bold">LIVE</span>
                                ) : (
                                  video.duration
                                )}
                              </div>
                            </div>
                            
                            {/* 视频信息 */}
                            <div className="flex-1 p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                    {video.title}
                                  </h4>
                                  <div className="flex items-center text-xs text-gray-500 mb-1">
                                    <img
                                      src={video.publisherAvatar}
                                      alt={video.publisherName}
                                      className="w-4 h-4 rounded-full mr-1"
                                    />
                                    <span className="truncate">{video.publisherName}</span>
                                  </div>
                                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                                    <span>{video.viewCount} 观看</span>
                                    <span>•</span>
                                    <span>{video.publishedAt}</span>
                                  </div>
                                </div>
                                <div className="ml-2 text-right">
                                  <div className="text-xs font-medium text-blue-600">
                                    距离你 {video.distance}米
                                  </div>
                                  {video.isLive && (
                                    <div className="text-xs text-red-500 mt-1">
                                      正在直播
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* 提示信息 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <div className="font-medium mb-1">隐私提醒</div>
                    <div>附近视频功能仅在碰面期间开启，位置信息不会被保存</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 位置服务弹窗 */}
      {showLocationServices && selectedLocation && selectedTime && (
        <LocationServices
          meetupLocation={{
            name: safeLocations.find(loc => loc.id === selectedLocation)?.name || '',
            address: safeLocations.find(loc => loc.id === selectedLocation)?.address || '',
            lat: 39.9042, // 示例坐标
            lng: 116.4074
          }}
          scheduledTime={`2024-01-16 ${timeSlots.find(slot => slot.id === selectedTime)?.time || '10:00'}`}
          sellerName={sellerName}
          onClose={() => setShowLocationServices(false)}
        />
      )}
    </div>
  );
}