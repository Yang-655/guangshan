import { Home, Search, Plus, MessageCircle, User, Video } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const tabs: TabItem[] = [
  {
    id: 'home',
    label: '首页',
    icon: Home,
    path: '/'
  },
  {
    id: 'discover',
    label: '发现',
    icon: Search,
    path: '/discover'
  },
  {
    id: 'camera',
    label: '拍摄',
    icon: Plus,
    path: '/camera'
  },
  {
    id: 'live',
    label: '直播',
    icon: Video,
    path: '/live'
  },
  {
    id: 'messages',
    label: '消息',
    icon: MessageCircle,
    path: '/messages'
  },
  {
    id: 'profile',
    label: '我的',
    icon: User,
    path: '/profile'
  }
];

export default function TabNavigation() {
  const location = useLocation();
  const [shouldHide, setShouldHide] = useState(false);

  // 检查是否应该隐藏导航菜单
  const checkHideStatus = () => {
    const isOnCameraPage = location.pathname === '/camera';
    const isOnLivePage = location.pathname === '/live' || location.pathname === '/live-streaming';
    const isOnChatPage = location.pathname.startsWith('/chat/');
    const isOnSquarePage = location.pathname === '/square' || location.pathname === '/';
    
    // 检查Square页面全屏状态
    if (isOnSquarePage) {
      const isSquareFullscreen = localStorage.getItem('square_fullscreen') === 'true';
      if (isSquareFullscreen) {
        setShouldHide(true);
        return;
      }
    }
    
    if (!isOnCameraPage && !isOnLivePage && !isOnChatPage) {
      setShouldHide(false);
      return;
    }

    // 检查Camera页面状态
    if (isOnCameraPage) {
      const isRecording = localStorage.getItem('camera_recording') === 'true';
      const isCapturing = localStorage.getItem('camera_capturing') === 'true';
      const isEditing = localStorage.getItem('camera_editing') === 'true';
      const isPublishing = localStorage.getItem('camera_publishing') === 'true';
      
      setShouldHide(isRecording || isCapturing || isEditing || isPublishing);
      return;
    }

    // 检查直播页面状态
    if (isOnLivePage) {
      const isLiveStreaming = localStorage.getItem('live_streaming') === 'true';
      setShouldHide(isLiveStreaming);
      return;
    }

    // 检查聊天页面状态
    if (isOnChatPage) {
      const isChatActive = localStorage.getItem('chat_active') === 'true';
      setShouldHide(isChatActive);
      return;
    }
  };

  useEffect(() => {
    checkHideStatus();

    // 监听localStorage变化
    const handleStorageChange = () => {
      checkHideStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查状态（防止同页面localStorage变化不触发storage事件）
    const interval = setInterval(checkHideStatus, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
      // 组件卸载时清理状态
      localStorage.removeItem('camera_recording');
      localStorage.removeItem('camera_capturing');
      localStorage.removeItem('camera_editing');
      localStorage.removeItem('camera_publishing');
      localStorage.removeItem('live_streaming');
      localStorage.removeItem('chat_active');
      localStorage.removeItem('square_fullscreen');
    };
  }, [location.pathname]);

  // 如果应该隐藏，返回null
  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* 为页面内容添加底部边距，防止被导航栏遮挡 */}
      <div className="h-20"></div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors relative",
                "min-w-[60px] min-h-[60px]",
                isActive 
                  ? tab.id === 'live' 
                    ? "text-red-500 bg-red-50" 
                    : "text-blue-600 bg-blue-50"
                  : tab.id === 'live'
                    ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              )}
            >
              <Icon 
                className={cn(
                  "w-6 h-6 mb-1",
                  tab.id === 'camera' && "w-8 h-8 p-1 bg-blue-600 text-white rounded-full",
                  tab.id === 'live' && "animate-pulse"
                )} 
              />
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.id === 'live' && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              )}
            </Link>
          );
        })}
      </div>
      </div>
    </>
  );
}