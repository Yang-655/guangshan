import React, { useState } from 'react';
import { ArrowLeft, Search, Filter, Plus, Gift, Clock, MapPin, Star, Users, DollarSign, Info, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LazyImageWithFallback from '../components/LazyImageWithFallback';

interface RewardTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  category: string;
  location: string;
  deadline: string;
  difficulty: 'easy' | 'medium' | 'hard';
  publisher: {
    id: string;
    username: string;
    avatar: string;
    rating: number;
  };
  applicants: number;
  status: 'open' | 'in_progress' | 'completed';
  tags: string[];
}

export default function Reward() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('latest');

  const categories = [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'delivery', name: '跑腿代购', icon: '🚚' },
    { id: 'design', name: '设计创作', icon: '🎨' },
    { id: 'tech', name: '技术开发', icon: '💻' },
    { id: 'writing', name: '文案写作', icon: '✍️' },
    { id: 'photography', name: '摄影拍照', icon: '📸' },
    { id: 'tutoring', name: '教学辅导', icon: '📚' },
    { id: 'cleaning', name: '清洁服务', icon: '🧹' },
    { id: 'other', name: '其他', icon: '🔧' }
  ];

  const [rewardTasks] = useState<RewardTask[]>([
    {
      id: '1',
      title: '帮忙代购星巴克咖啡',
      description: '需要代购2杯星巴克咖啡，地址在市中心，要求30分钟内送达。',
      reward: 25,
      category: 'delivery',
      location: '市中心商业区',
      deadline: '2024-01-15 18:00',
      difficulty: 'easy',
      publisher: {
        id: 'user1',
        username: '咖啡爱好者',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=coffee%20lover%20avatar&image_size=square',
        rating: 4.8
      },
      applicants: 3,
      status: 'open',
      tags: ['急单', '市中心', '代购']
    },
    {
      id: '2',
      title: 'Logo设计项目',
      description: '为新创业公司设计Logo，要求简洁现代，提供多个方案选择。',
      reward: 500,
      category: 'design',
      location: '线上远程',
      deadline: '2024-01-20 23:59',
      difficulty: 'medium',
      publisher: {
        id: 'user2',
        username: '创业者小李',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=entrepreneur%20avatar&image_size=square',
        rating: 4.9
      },
      applicants: 12,
      status: 'open',
      tags: ['设计', '创意', '远程']
    },
    {
      id: '3',
      title: '小程序开发',
      description: '开发一个简单的记账小程序，包含基本的收支记录和统计功能。',
      reward: 1200,
      category: 'tech',
      location: '线上远程',
      deadline: '2024-02-01 23:59',
      difficulty: 'hard',
      publisher: {
        id: 'user3',
        username: '产品经理王总',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=product%20manager%20avatar&image_size=square',
        rating: 4.7
      },
      applicants: 8,
      status: 'open',
      tags: ['开发', '小程序', '长期']
    }
  ]);

  const filteredTasks = rewardTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-100';
      case 'medium': return 'text-yellow-500 bg-yellow-100';
      case 'hard': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-500 bg-blue-100';
      case 'in_progress': return 'text-orange-500 bg-orange-100';
      case 'completed': return 'text-green-500 bg-green-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '招募中';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      default: return '未知';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <Gift className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">悬赏任务</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <button
               onClick={() => navigate('/reward/rules')}
               className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors"
             >
               <Info className="w-4 h-4" />
               <span className="text-sm">规则</span>
             </button>
             <button
               onClick={() => navigate('/reward/manage')}
               className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors"
             >
               <Settings className="w-4 h-4" />
               <span className="text-sm">管理</span>
             </button>
             <button
               onClick={() => navigate('/reward/publish')}
               className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
             >
               <Plus className="w-4 h-4" />
               <span>发布悬赏</span>
             </button>
           </div>
        </div>

        {/* 搜索栏 */}
        <div className="px-4 pb-4">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索悬赏任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-purple-100 border-purple-300' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 分类标签 */}
        <div className="px-4 pb-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="p-4 space-y-4 pb-safe max-md:pb-24 max-sm:pb-28">
        {filteredTasks.map((task) => (
          <div 
            key={task.id} 
            onClick={() => navigate(`/reward/${task.id}`)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* 任务头部 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>
              </div>
              <div className="ml-4 text-right">
                <div className="text-2xl font-bold text-purple-600">¥{task.reward}</div>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </div>
              </div>
            </div>

            {/* 任务信息 */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{task.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>截止: {new Date(task.deadline).toLocaleDateString()}</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                {getDifficultyText(task.difficulty)}
              </div>
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {task.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            {/* 发布者信息和操作 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <LazyImageWithFallback
                  src={task.publisher.avatar}
                  alt={task.publisher.username}
                  className="w-8 h-8 rounded-full object-cover"
                  fallbackSrc="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar&image_size=square"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{task.publisher.username}</div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 fill-current text-yellow-400" />
                    <span>{task.publisher.rating}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{task.applicants}人申请</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/reward/${task.id}`);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Gift className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无相关悬赏任务</h3>
          <p className="text-gray-500 text-center mb-6">试试调整搜索条件或发布新的悬赏任务</p>
          <button
            onClick={() => navigate('/reward/publish')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            发布悬赏任务
          </button>
        </div>
      )}
    </div>
  );
}