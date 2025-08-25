import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, Heart, MapPin, Star, MessageCircle, Calendar, History
} from 'lucide-react';
import LazyImageWithFallback from '../components/LazyImageWithFallback';
import MeetupFeatures from '../components/MeetupFeatures';
import MeetupHistory from '../components/MeetupHistory';
import { useToast } from '../components/Toast';

interface SecondHandItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  condition: 'excellent' | 'good' | 'fair';
  location: string;
  distance: string;
  images: string[];
  seller: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    isVerified: boolean;
  };
  category: string;
  description: string;
  postedAt: string;
  isLiked: boolean;
}

const mockItems: SecondHandItem[] = [
  {
    id: '1',
    title: 'iPhone 13 Pro 128GB 深空灰',
    price: 4500,
    originalPrice: 7999,
    condition: 'excellent',
    location: '朝阳区',
    distance: '2.3km',
    images: ['https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2013%20Pro%20space%20gray%20excellent%20condition&image_size=square'],
    seller: {
      id: 'seller1',
      name: '数码达人',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20enthusiast%20avatar&image_size=square',
      rating: 4.8,
      isVerified: true
    },
    category: '数码产品',
    description: '9成新，无磕碰，功能完好，配件齐全',
    postedAt: '2小时前',
    isLiked: false
  },
  {
    id: '2',
    title: '北欧风实木书桌',
    price: 800,
    originalPrice: 1500,
    condition: 'good',
    location: '海淀区',
    distance: '5.1km',
    images: ['https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20wooden%20desk%20furniture%20good%20condition&image_size=square'],
    seller: {
      id: 'seller2',
      name: '家居小达人',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=home%20decor%20enthusiast%20avatar&image_size=square',
      rating: 4.6,
      isVerified: false
    },
    category: '家具',
    description: '搬家出售，使用1年，保养良好',
    postedAt: '1天前',
    isLiked: true
  }
];

const categories = ['全部', '数码产品', '家具', '服装', '图书', '运动器材', '其他'];
const conditions = {
  excellent: { label: '9成新', color: 'text-green-600' },
  good: { label: '8成新', color: 'text-blue-600' },
  fair: { label: '7成新', color: 'text-yellow-600' }
};

export default function SecondHand() {
  const navigate = useNavigate();
  const { success, info } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [items, setItems] = useState(mockItems);
  const [selectedItem, setSelectedItem] = useState<SecondHandItem | null>(null);
  const [showMeetupFeatures, setShowMeetupFeatures] = useState(false);
  const [showMeetupHistory, setShowMeetupHistory] = useState(false);

  const handleLike = (itemId: string) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, isLiked: !item.isLiked } : item
    ));
  };

  const handleContactSeller = (item: any) => {
    setSelectedItem(item);
    setShowMeetupFeatures(true);
  };

  // 处理发布按钮点击
  const handlePublishClick = () => {
    info('发布功能开发中，敬请期待！');
    console.log('发布新商品');
    // TODO: 跳转到发布页面
    // navigate('/secondhand/publish');
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === '全部' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部导航 */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">旧物市场</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowMeetupHistory(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="碰面记录"
            >
              <History className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索旧物..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 分类标签 */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 商品列表 */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* 商品图片 */}
              <div className="relative aspect-square">
                <LazyImageWithFallback
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  fallbackSrc="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20product%20image&image_size=square"
                />
                <button
                  onClick={() => handleLike(item.id)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                    item.isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${item.isLiked ? 'fill-current' : ''}`} />
                </button>
                <div className="absolute bottom-2 left-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-white/90 ${
                    conditions[item.condition].color
                  }`}>
                    {conditions[item.condition].label}
                  </span>
                </div>
              </div>
              
              {/* 商品信息 */}
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                  {item.title}
                </h3>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-red-500 font-bold text-lg">¥{item.price}</span>
                    {item.originalPrice && (
                      <span className="text-gray-400 text-sm line-through">¥{item.originalPrice}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{item.location} · {item.distance}</span>
                  </div>
                  <span>{item.postedAt}</span>
                </div>
                
                {/* 卖家信息 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <LazyImageWithFallback
                      src={item.seller.avatar}
                      alt={item.seller.name}
                      className="w-6 h-6 rounded-full mr-2"
                      fallbackSrc="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar&image_size=square"
                    />
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 mr-1">{item.seller.name}</span>
                      {item.seller.isVerified && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                    <span className="text-xs text-gray-600">{item.seller.rating}</span>
                  </div>
                </div>
                
                {/* 联系按钮 */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleContactSeller(item)}
                    className="flex items-center justify-center py-2 px-3 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    联系
                  </button>
                  <button
                    onClick={() => handleContactSeller(item)}
                    className="flex items-center justify-center py-2 px-3 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition-colors"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    碰面
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 发布按钮 */}
      <button 
        onClick={handlePublishClick}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-blue-600 transition-colors active:scale-95"
      >
        <span className="text-white text-2xl font-bold">+</span>
      </button>

      {/* 碰面功能弹窗 */}
       {showMeetupFeatures && selectedItem && (
         <MeetupFeatures
           itemId={selectedItem.id}
           sellerId={selectedItem.seller.id}
           sellerName={selectedItem.seller.name}
           sellerRating={selectedItem.seller.rating}
           isVerified={selectedItem.seller.isVerified}
           location={selectedItem.location}
           onClose={() => {
             setShowMeetupFeatures(false);
             setSelectedItem(null);
           }}
         />
       )}

       {/* 碰面历史记录弹窗 */}
       {showMeetupHistory && (
         <MeetupHistory
           onClose={() => setShowMeetupHistory(false)}
         />
       )}
    </div>
  );
}