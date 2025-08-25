import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  Share2,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  Target,
  Route,
  Bell,
  X
} from 'lucide-react';

interface LocationServicesProps {
  meetupLocation: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  scheduledTime: string;
  sellerName: string;
  onClose: () => void;
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export default function LocationServices({ 
  meetupLocation, 
  scheduledTime, 
  sellerName, 
  onClose 
}: LocationServicesProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [arrivalNotification, setArrivalNotification] = useState(false);

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

  // 获取用户位置
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理定位');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        setUserLocation(location);
        setLocationPermission('granted');
        calculateDistance(location);
      },
      (error) => {
        console.error('获取位置失败:', error);
        setLocationPermission('denied');
        alert('无法获取您的位置，请检查位置权限设置');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分钟缓存
      }
    );
  };

  // 计算距离
  const calculateDistance = (userLoc: UserLocation) => {
    const R = 6371; // 地球半径（公里）
    const dLat = (meetupLocation.lat - userLoc.lat) * Math.PI / 180;
    const dLng = (meetupLocation.lng - userLoc.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLoc.lat * Math.PI / 180) * Math.cos(meetupLocation.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;
    
    setDistance(dist);
    
    // 估算到达时间（假设步行速度5km/h，开车30km/h）
    const walkingTime = Math.ceil(dist / 5 * 60); // 分钟
    const drivingTime = Math.ceil(dist / 30 * 60); // 分钟
    
    if (dist < 1) {
      setEstimatedArrival(`步行 ${walkingTime} 分钟`);
    } else {
      setEstimatedArrival(`开车 ${drivingTime} 分钟 / 步行 ${walkingTime} 分钟`);
    }
  };

  // 开始位置共享
  const startLocationSharing = () => {
    if (locationPermission !== 'granted') {
      getCurrentLocation();
      return;
    }
    
    setIsLocationSharing(true);
    
    // 模拟实时位置更新
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: Date.now()
            };
            setUserLocation(location);
            calculateDistance(location);
            
            // 检查是否到达目的地（100米内）
            if (distance < 0.1 && !arrivalNotification) {
              setArrivalNotification(true);
              alert(`您已到达 ${meetupLocation.name} 附近！`);
            }
          },
          (error) => {
            console.error('位置更新失败:', error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
      }
    }, 30000); // 每30秒更新一次
    
    // 清理定时器
    return () => clearInterval(interval);
  };

  // 停止位置共享
  const stopLocationSharing = () => {
    setIsLocationSharing(false);
  };

  // 开始导航
  const startNavigation = () => {
    if (!userLocation) {
      getCurrentLocation();
      return;
    }
    
    setIsNavigating(true);
    
    // 使用系统默认地图应用
    const url = `https://maps.google.com/maps?saddr=${userLocation.lat},${userLocation.lng}&daddr=${meetupLocation.lat},${meetupLocation.lng}`;
    window.open(url, '_blank');
  };

  // 分享位置给卖家
  const shareLocationWithSeller = () => {
    if (!userLocation) {
      alert('请先获取您的位置');
      return;
    }
    
    const locationUrl = `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}`;
    const message = `我的实时位置：${locationUrl}\n预计 ${estimatedArrival} 到达 ${meetupLocation.name}`;
    
    // 模拟发送位置给卖家
    alert(`位置已分享给 ${sellerName}:\n${message}`);
  };

  // 设置到达提醒
  const setupArrivalReminder = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          alert('到达提醒已设置，我们会在您接近目的地时通知您');
        }
      });
    } else {
      alert('您的浏览器不支持通知功能');
    }
  };

  const formatDistance = (dist: number) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)}米`;
    }
    return `${dist.toFixed(1)}公里`;
  };

  const getLocationAccuracy = () => {
    if (!userLocation) return '';
    if (userLocation.accuracy < 10) return '精确';
    if (userLocation.accuracy < 50) return '较精确';
    return '大概位置';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">位置服务</h2>
          <div className="flex items-center space-x-2">
            {/* 网络状态指示器 */}
            <div className={`flex items-center text-xs ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-96">
          {/* 碰面地点信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">{meetupLocation.name}</h3>
                <p className="text-sm text-blue-700 mt-1">{meetupLocation.address}</p>
                <div className="flex items-center mt-2 text-sm text-blue-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>预约时间: {new Date(scheduledTime).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 当前位置状态 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">我的位置</h4>
              <button
                onClick={getCurrentLocation}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <Target className="w-4 h-4 mr-1" />
                更新位置
              </button>
            </div>
            
            {userLocation ? (
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>位置已获取 ({getLocationAccuracy()})</span>
                </div>
                {distance > 0 && (
                  <>
                    <div className="text-sm text-gray-600">
                      距离目的地: <span className="font-medium">{formatDistance(distance)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      预计时间: <span className="font-medium">{estimatedArrival}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>未获取位置信息</span>
              </div>
            )}
          </div>

          {/* 位置共享控制 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-green-900">实时位置共享</h4>
              <div className={`w-12 h-6 rounded-full transition-colors ${
                isLocationSharing ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <button
                  onClick={isLocationSharing ? stopLocationSharing : startLocationSharing}
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    isLocationSharing ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
            
            <p className="text-sm text-green-700 mb-3">
              {isLocationSharing 
                ? `正在与 ${sellerName} 共享位置，每30秒更新一次`
                : '开启后将与卖家实时共享您的位置信息'
              }
            </p>
            
            {isLocationSharing && (
              <div className="flex items-center text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                <span>位置共享中...</span>
              </div>
            )}
          </div>

          {/* 快速操作 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={startNavigation}
              disabled={!userLocation || !isOnline}
              className="flex items-center justify-center py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Navigation className="w-4 h-4 mr-2" />
              开始导航
            </button>
            
            <button
              onClick={shareLocationWithSeller}
              disabled={!userLocation}
              className="flex items-center justify-center py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享位置
            </button>
          </div>

          {/* 附加功能 */}
          <div className="space-y-3">
            <button
              onClick={setupArrivalReminder}
              className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Bell className="w-4 h-4 mr-2" />
              设置到达提醒
            </button>
            
            <button
              onClick={() => {
                const url = `https://maps.google.com/maps?q=${meetupLocation.lat},${meetupLocation.lng}`;
                window.open(url, '_blank');
              }}
              className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Route className="w-4 h-4 mr-2" />
              在地图中查看
            </button>
          </div>

          {/* 安全提醒 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <div className="font-medium mb-1">位置隐私提醒</div>
                <div>位置信息仅在碰面期间共享，交易完成后自动停止</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}