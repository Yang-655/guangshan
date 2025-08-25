import React, { useState } from 'react';
import { ArrowLeft, Search, Filter, Plus, Eye, Users, Clock, DollarSign, CheckCircle, XCircle, MessageCircle, Star, Award, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LazyImageWithFallback from '../components/LazyImageWithFallback';

interface TaskBidder {
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
}

interface ManagedTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  currentReward: number;
  category: string;
  location: string;
  deadline: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  tags: string[];
  deposit: number;
  autoIncrease: boolean;
  increaseAmount: number;
  maxReward: number;
  nextIncreaseTime?: string;
  bidders: TaskBidder[];
  selectedBidder?: string;
  publishTime: string;
}

export default function RewardManage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBidders, setShowBidders] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showIncreaseModal, setShowIncreaseModal] = useState<string | null>(null);
  const [increaseAmount, setIncreaseAmount] = useState(0);
  const [showPaymentWarning, setShowPaymentWarning] = useState<string | null>(null);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // 模拟用户发布的任务数据
  const [managedTasks] = useState<ManagedTask[]>([
    {
      id: '1',
      title: 'Logo设计项目',
      description: '为新创业公司设计Logo，要求简洁现代，提供多个方案选择。',
      reward: 500,
      currentReward: 550,
      category: 'design',
      location: '线上远程',
      deadline: '2024-01-20 23:59',
      difficulty: 'medium',
      status: 'open',
      tags: ['设计', '创意', '远程'],
      deposit: 500,
      autoIncrease: true,
      increaseAmount: 50,
      maxReward: 800,
      nextIncreaseTime: '2024-01-16 10:30',
      publishTime: '2024-01-14 09:00',
      bidders: [
        {
          id: 'bidder1',
          username: '设计师小王',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=designer%20avatar&image_size=square',
          rating: 4.8,
          completedTasks: 45,
          bidAmount: 450,
          bidTime: '2024-01-15 10:30',
          message: '我有5年的Logo设计经验，曾为多家初创公司设计过品牌标识。',
          estimatedDays: 3,
          creditScore: 95,
          status: 'pending'
        },
        {
          id: 'bidder2',
          username: '创意工作室',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20studio%20avatar&image_size=square',
          rating: 4.9,
          completedTasks: 120,
          bidAmount: 480,
          bidTime: '2024-01-15 14:20',
          message: '专业设计团队，擅长现代简约风格。',
          estimatedDays: 2,
          creditScore: 98,
          status: 'pending'
        }
      ]
    },
    {
      id: '2',
      title: '小程序开发',
      description: '开发一个简单的记账小程序，包含基本的收支记录和统计功能。',
      reward: 1200,
      currentReward: 1200,
      category: 'tech',
      location: '线上远程',
      deadline: '2024-02-01 23:59',
      difficulty: 'hard',
      status: 'in_progress',
      tags: ['开发', '小程序', '长期'],
      deposit: 1200,
      autoIncrease: false,
      increaseAmount: 0,
      maxReward: 1200,
      publishTime: '2024-01-10 14:30',
      selectedBidder: 'dev1',
      bidders: [
        {
          id: 'dev1',
          username: '全栈开发者',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=developer%20avatar&image_size=square',
          rating: 4.9,
          completedTasks: 78,
          bidAmount: 1100,
          bidTime: '2024-01-10 16:45',
          message: '专业小程序开发，有丰富的记账类应用开发经验。',
          estimatedDays: 15,
          creditScore: 96,
          status: 'selected'
        }
      ]
    }
  ]);

  const statusOptions = [
    { value: 'all', label: '全部', count: managedTasks.length },
    { value: 'open', label: '招募中', count: managedTasks.filter(t => t.status === 'open').length },
    { value: 'in_progress', label: '进行中', count: managedTasks.filter(t => t.status === 'in_progress').length },
    { value: 'completed', label: '已完成', count: managedTasks.filter(t => t.status === 'completed').length },
    { value: 'cancelled', label: '已取消', count: managedTasks.filter(t => t.status === 'cancelled').length }
  ];

  const filteredTasks = managedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-500 bg-blue-100';
      case 'in_progress': return 'text-orange-500 bg-orange-100';
      case 'completed': return 'text-green-500 bg-green-100';
      case 'cancelled': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '招募中';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600 bg-green-100';
    if (score >= 85) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const handleSelectBidder = (taskId: string, bidderId: string) => {
    console.log('选择接单者:', { taskId, bidderId });
    // 这里实现选择接单者的逻辑
  };

  const handleRejectBidder = (taskId: string, bidderId: string) => {
    console.log('拒绝接单者:', { taskId, bidderId });
    // 这里实现拒绝接单者的逻辑
  };

  const handleManualIncrease = (taskId: string) => {
    const task = managedTasks.find(t => t.id === taskId);
    if (task) {
      setIncreaseAmount(task.increaseAmount || 50);
      setShowIncreaseModal(taskId);
    }
  };

  const confirmManualIncrease = () => {
    if (showIncreaseModal && increaseAmount > 0) {
      console.log('确认手动加价:', { taskId: showIncreaseModal, amount: increaseAmount });
      // 这里实现实际的加价逻辑
      setShowIncreaseModal(null);
      setIncreaseAmount(0);
    }
  };

  const handleCancelTask = (taskId: string) => {
    console.log('取消任务:', taskId);
    // 这里实现取消任务的逻辑
  };

  const handleConfirmCompletion = (taskId: string) => {
    setShowPaymentWarning(taskId);
    setCountdown(5);
    setConfirmationChecked(false);
  };

  const handlePaymentConfirm = () => {
    if (confirmationChecked && countdown === 0 && showPaymentWarning) {
      console.log('确认支付完成:', showPaymentWarning);
      setShowPaymentWarning(null);
      // 这里实现实际的支付逻辑
    }
  };

  // 倒计时效果
  React.useEffect(() => {
    if (showPaymentWarning && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showPaymentWarning, countdown]);

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
            <h1 className="text-xl font-bold text-gray-900">我的悬赏</h1>
          </div>
          <button
            onClick={() => navigate('/reward/publish')}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>发布新任务</span>
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="px-4 pb-4">
          <div className="flex space-x-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-full whitespace-nowrap transition-colors ${
                  statusFilter === option.value
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="p-4 space-y-4 pb-safe max-md:pb-24 max-sm:pb-28">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* 任务头部 */}
            <div className="flex items-start justify-between mb-4 max-sm:flex-col max-sm:space-y-3">
              <div className="flex-1 max-sm:w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{task.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 max-sm:flex-col max-sm:items-start max-sm:space-x-0 max-sm:space-y-1">
                  <span>发布时间: {new Date(task.publishTime).toLocaleString()}</span>
                  <span>截止时间: {new Date(task.deadline).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right max-sm:w-full max-sm:flex max-sm:justify-between max-sm:items-center">
                <div className="text-2xl font-bold text-purple-600 mb-1 max-sm:mb-0">
                  ¥{task.currentReward}
                  {task.currentReward > task.reward && (
                    <span className="text-sm text-gray-500 line-through ml-2">¥{task.reward}</span>
                  )}
                </div>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </div>
              </div>
            </div>

            {/* 自动加价信息 */}
            {task.autoIncrease && task.status === 'open' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">自动加价</span>
                  </div>
                  <button
                    onClick={() => handleManualIncrease(task.id)}
                    className="text-sm text-yellow-700 hover:text-yellow-900 underline"
                  >
                    立即加价
                  </button>
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  下次加价: {task.nextIncreaseTime} (+¥{task.increaseAmount})
                </div>
              </div>
            )}

            {/* 竞标者信息 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{task.bidders.length} 人竞标</span>
                </div>
                {task.selectedBidder && (
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>已选定接单者</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {task.status === 'open' && (
                  <>
                    <button
                      onClick={() => setShowBidders(showBidders === task.id ? null : task.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>查看竞标</span>
                    </button>
                    <button
                      onClick={() => handleCancelTask(task.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>取消任务</span>
                    </button>
                  </>
                )}
                {task.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => navigate(`/reward/${task.id}`)}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>联系接单者</span>
                    </button>
                    <button
                      onClick={() => handleConfirmCompletion(task.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>确认完成</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 竞标者列表 */}
            {showBidders === task.id && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">竞标者列表</h4>
                <div className="space-y-3">
                  {task.bidders.map((bidder) => (
                    <div key={bidder.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <LazyImageWithFallback
                            src={bidder.avatar}
                            alt={bidder.username}
                            className="w-10 h-10 rounded-full object-cover"
                            fallbackSrc="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar&image_size=square"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{bidder.username}</div>
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-current text-yellow-400" />
                                <span>{bidder.rating}</span>
                              </div>
                              <span>完成 {bidder.completedTasks} 个任务</span>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCreditScoreColor(bidder.creditScore)}`}>
                                信誉 {bidder.creditScore}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-600">¥{bidder.bidAmount}</div>
                          <div className="text-xs text-gray-500">{bidder.estimatedDays} 天完成</div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-3">{bidder.message}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          竞标时间: {new Date(bidder.bidTime).toLocaleString()}
                        </div>
                        {bidder.status === 'pending' && task.status === 'open' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRejectBidder(task.id, bidder.id)}
                              className="px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors text-sm"
                            >
                              拒绝
                            </button>
                            <button
                              onClick={() => handleSelectBidder(task.id, bidder.id)}
                              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                            >
                              选择
                            </button>
                          </div>
                        )}
                        {bidder.status === 'selected' && (
                          <div className="flex items-center space-x-1 text-sm text-green-600">
                            <Award className="w-4 h-4" />
                            <span>已选中</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Users className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无相关任务</h3>
          <p className="text-gray-500 text-center mb-6">试试调整搜索条件或发布新的悬赏任务</p>
          <button
            onClick={() => navigate('/reward/publish')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            发布悬赏任务
          </button>
        </div>
      )}

      {/* 手动加价弹窗 */}
      {showIncreaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">手动加价</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">加价金额</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={increaseAmount}
                    onChange={(e) => setIncreaseAmount(Number(e.target.value))}
                    placeholder="输入加价金额"
                    min="1"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  加价后悬赏金额将增加 ¥{increaseAmount}，立即生效并吸引更多接单者。
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowIncreaseModal(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmManualIncrease}
                disabled={!increaseAmount || increaseAmount <= 0}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                确认加价
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 支付不可逆警告对话框 */}
      {showPaymentWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-red-200 bg-red-50">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-bold text-red-900">支付确认警告</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">重要警告：支付不可逆</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• 一旦确认支付，资金将立即转给接单者</li>
                      <li>• 支付完成后无法撤销或退款</li>
                      <li>• 请确保任务已完全验收合格</li>
                      <li>• 如有争议请先联系客服处理</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    {countdown > 0 ? `请仔细阅读警告信息 (${countdown}s)` : '现在可以确认支付'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmationChecked}
                    onChange={(e) => setConfirmationChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    我已确认任务验收完成，理解支付不可逆，愿意承担相应风险
                  </span>
                </label>
              </div>

              {(() => {
                const currentTask = managedTasks.find(t => t.id === showPaymentWarning);
                const selectedBidder = currentTask?.bidders.find(b => b.id === currentTask.selectedBidder);
                return (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">支付金额: ¥{currentTask?.currentReward}</div>
                    <div className="text-sm text-gray-500">接单者: {selectedBidder?.username}</div>
                  </div>
                );
              })()}
            </div>
            <div className="p-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowPaymentWarning(null)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handlePaymentConfirm}
                disabled={!confirmationChecked || countdown > 0}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  confirmationChecked && countdown === 0
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {countdown > 0 ? `等待 ${countdown}s` : '确认支付 (不可逆)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}