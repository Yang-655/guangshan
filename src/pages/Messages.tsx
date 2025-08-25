import { Search, MoreHorizontal, MessageCircle, Shield, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import LazyImageWithFallback from '../components/LazyImageWithFallback';

interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline?: boolean;
  isEncrypted?: boolean;
  supportsEncryption?: boolean;
}

export default function Messages() {
  // 事件处理函数
  const handleMoreOptions = () => {
    toast.success('打开更多选项');
  };

  const chats: ChatItem[] = [
    {
      id: '1',
      name: '小明',
      avatar: '', // 将通过LazyImageWithFallback组件处理
      lastMessage: '🔒 今天的视频拍得不错！',
      timestamp: '2分钟前',
      unreadCount: 2,
      isOnline: true,
      isEncrypted: true,
      supportsEncryption: true
    },
    {
      id: '2',
      name: '美食达人',
      avatar: '', // 将通过LazyImageWithFallback组件处理
      lastMessage: '分享一下你的拍摄技巧吧',
      timestamp: '1小时前',
      unreadCount: 1,
      isOnline: false,
      supportsEncryption: true
    },
    {
      id: '3',
      name: '旅行摄影师',
      avatar: '', // 将通过LazyImageWithFallback组件处理
      lastMessage: '这个地方真的很美',
      timestamp: '昨天',
      unreadCount: 0,
      isOnline: true,
      supportsEncryption: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <div className="bg-white px-3 sm:px-4 py-2 sm:py-3 border-b">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">消息</h1>
          <button 
            onClick={handleMoreOptions}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>
        
        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="搜索聊天记录..."
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 聊天列表 */}
      <div className="divide-y divide-gray-200">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <Link
              key={chat.id}
              to={`/chat/${chat.id}`}
              className="block bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3">
                {/* 头像 */}
                <div className="relative mr-2.5 sm:mr-3">
                  <LazyImageWithFallback
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    useImageService={true}
                    prompt={`${chat.name} avatar portrait friendly`}
                    imageSize="square"
                    fallbackSrc="/images/default-avatar.svg"
                  />
                  {chat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* 聊天信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base truncate">{chat.name}</h3>
                      {chat.supportsEncryption && (
                        <div className="flex items-center flex-shrink-0" title={chat.isEncrypted ? '端到端加密聊天' : '支持加密聊天'}>
                          {chat.isEncrypted ? (
                            <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                          ) : (
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{chat.timestamp}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                </div>

                {/* 未读消息数 */}
                {chat.unreadCount && chat.unreadCount > 0 && (
                  <div className="ml-1.5 sm:ml-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">暂无消息</h3>
            <p className="text-sm text-gray-400 text-center px-8">
              开始关注其他用户，或者分享你的精彩内容来获得更多互动吧！
            </p>
          </div>
        )}
      </div>
    </div>
  );
}