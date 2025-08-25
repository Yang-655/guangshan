import React, { useState } from 'react';
import { ArrowLeft, Star, MapPin, Clock, Users, DollarSign, Shield, MessageCircle, Phone, Flag, Heart, Share2, AlertTriangle, Upload, Eye, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import LazyImageWithFallback from '../components/LazyImageWithFallback';
import MediaUpload, { MediaFile } from '../components/MediaUpload';
import BidManagement from '../components/BidManagement';
import TaskStatusManager from '../components/TaskStatusManager';
import EnhancedMediaPreview from '../components/EnhancedMediaPreview';
import { useToast } from '../components/Toast';

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
  responseTime?: number;
}

interface RewardTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  currentReward?: number;
  category: string;
  location: string;
  deadline: string;
  difficulty: 'easy' | 'medium' | 'hard';
  publisher: {
    id: string;
    username: string;
    avatar: string;
    rating: number;
    publishedTasks: number;
  };
  applicants: number;
  status: 'open' | 'in_progress' | 'completed';
  tags: string[];
  deposit: number;
  autoIncrease: boolean;
  increaseAmount: number;
  maxReward: number;
  nextIncreaseTime?: string;
  allowMultipleBids: boolean;
  bidders: Bidder[];
  selectedBidder?: string;
  requirementFiles?: MediaFile[];
  completionFiles?: MediaFile[];
}

export default function RewardDetail() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { success, error } = useToast();
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidMessage, setBidMessage] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(1);
  const [isPublisher, setIsPublisher] = useState(false); // 模拟当前用户是否为发布者
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionFiles, setCompletionFiles] = useState<MediaFile[]>([]);
  const [completionMessage, setCompletionMessage] = useState('');
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'bids' | 'status'>('details');

  // 模拟任务数据
  const [task, setTask] = useState<RewardTask>({
    id: '1',
    title: 'Logo设计项目',
    description: '为新创业公司设计Logo，要求简洁现代，提供多个方案选择。需要包含：\n1. 3-5个不同风格的Logo设计方案\n2. 提供矢量格式文件（AI/EPS）\n3. 提供PNG/JPG格式用于网络使用\n4. 包含Logo使用规范说明\n5. 提供品牌色彩搭配建议',
    reward: 500,
    category: 'design',
    location: '线上远程',
    deadline: '2024-01-20 23:59',
    difficulty: 'medium',
    publisher: {
      id: 'user2',
      username: '创业者小李',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=entrepreneur%20avatar&image_size=square',
      rating: 4.9,
      publishedTasks: 15
    },
    applicants: 8,
    status: 'in_progress',
    tags: ['设计', '创意', '远程', 'Logo'],
    deposit: 500,
    autoIncrease: true,
    increaseAmount: 50,
    maxReward: 800,
    allowMultipleBids: true,
    selectedBidder: 'bidder1',
    requirementFiles: [
      {
        id: 'req1',
        file: new File([''], 'logo-reference.jpg'),
        url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20logo%20design%20reference&image_size=landscape_4_3',
        type: 'image'
      },
      {
        id: 'req2',
        file: new File([''], 'brand-guidelines.pdf'),
        url: 'https://example.com/brand-guidelines.pdf',
        type: 'document'
      }
    ],
    bidders: [
      {
        id: 'bidder1',
        username: '设计师小王',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=designer%20avatar&image_size=square',
        rating: 4.8,
        completedTasks: 45,
        bidAmount: 450,
        bidTime: '2024-01-15 10:30',
        message: '我有5年的Logo设计经验，曾为多家初创公司设计过品牌标识。可以提供多种风格的方案供您选择，保证原创性和商业价值。',
        estimatedDays: 3,
        creditScore: 95,
        status: 'selected' as const
      },
      {
        id: 'bidder2',
        username: '创意工作室',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20studio%20avatar&image_size=square',
        rating: 4.9,
        completedTasks: 120,
        bidAmount: 480,
        bidTime: '2024-01-15 14:20',
        message: '专业设计团队，擅长现代简约风格。我们会深入了解您的品牌理念，提供符合行业特点的设计方案。',
        estimatedDays: 2,
        creditScore: 98,
        status: 'pending' as const
      },
      {
        id: 'bidder3',
        username: '资深设计师',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=senior%20designer%20avatar&image_size=square',
        rating: 4.7,
        completedTasks: 78,
        bidAmount: 520,
        bidTime: '2024-01-15 16:45',
        message: '10年设计经验，专注品牌视觉设计。可以提供完整的品牌视觉体系，不仅仅是Logo设计。',
        estimatedDays: 4,
        creditScore: 92,
        status: 'pending' as const
      }
    ]
  });

  // 任务状态历史
  const [statusHistory] = useState([
    {
      id: '1',
      status: 'open' as const,
      timestamp: '2024-01-14 09:00',
      description: '任务发布，开始招募',
      actor: '创业者小李'
    },
    {
      id: '2', 
      status: 'in_progress' as const,
      timestamp: '2024-01-15 16:30',
      description: '选择竞标者，任务开始执行',
      actor: '创业者小李'
    }
  ]);

  // 处理函数
  const handleSelectBidder = (bidderId: string) => {
    setTask(prev => ({
      ...prev,
      selectedBidder: bidderId,
      status: 'in_progress'
    }));
    success('已选择竞标者');
  };

  const handleRejectBidder = (bidderId: string) => {
    setTask(prev => ({
      ...prev,
      bidders: prev.bidders.map(bidder => 
        bidder.id === bidderId 
          ? { ...bidder, status: 'rejected' as const }
          : bidder
      )
    }));
    success('已拒绝该竞标');
  };

  const handleContactBidder = (bidderId: string) => {
    // 跳转到聊天页面
    navigate(`/chat/${bidderId}`);
  };

  const handleStatusChange = (newStatus: string, reason?: string) => {
    setTask(prev => ({
      ...prev,
      status: newStatus as any
    }));
    success(`任务状态已更新为${newStatus}`);
  };

  const handleRewardIncrease = (amount: number) => {
    setTask(prev => ({
      ...prev,
      reward: prev.reward + amount
    }));
    success(`悬赏金额已增加 ¥${amount}`);
  };

  const handleExtendDeadline = (newDeadline: string) => {
    setTask(prev => ({
      ...prev,
      deadline: newDeadline
    }));
    success('截止时间已延长');
  };

  const handleMediaPreview = (index: number) => {
    setPreviewIndex(index);
    setShowMediaPreview(true);
  };

  const handleNextMedia = () => {
    const totalFiles = (task.requirementFiles || []).length;
    setPreviewIndex((prev) => (prev + 1) % totalFiles);
  };

  const handlePreviousMedia = () => {
    const totalFiles = (task.requirementFiles || []).length;
    setPreviewIndex((prev) => (prev - 1 + totalFiles) % totalFiles);
  };

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

  const getCreditScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600 bg-green-100';
    if (score >= 85) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const handleBid = () => {
    // 这里实现竞标逻辑
    console.log('提交竞标:', { bidAmount, bidMessage, estimatedDays });
    setShowBidModal(false);
    toast.success('竞标提交成功，等待雇主选择');
  };

  const handleSubmitCompletion = () => {
    // 这里实现提交完成证明逻辑
    console.log('提交完成证明:', { completionFiles, completionMessage });
    setShowCompletionModal(false);
    toast.success('完成证明已提交，等待雇主确认');
  };



  // 新增事件处理函数
  const handleLike = () => {
    toast.success('已收藏任务');
  };

  const handleShare = () => {
    toast.success('任务链接已复制到剪贴板');
  };

  const handleReport = () => {
    toast.success('举报已提交，我们会尽快处理');
  };

  const handleMessage = () => {
    toast.success('打开聊天窗口');
  };

  const handleCall = () => {
    toast.success('拨打电话');
  };

  const handleConfirmCompletion = () => {
    setShowPaymentWarning(true);
    setCountdown(5);
    setConfirmationChecked(false);
  };

  const handlePaymentConfirm = () => {
    if (confirmationChecked && countdown === 0) {
      console.log('确认支付完成');
      setShowPaymentWarning(false);
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
            <h1 className="text-xl font-bold text-gray-900">任务详情</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleLike}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Heart className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={handleReport}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Flag className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 任务基本信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h2>
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
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600 mb-1">¥{task.reward}</div>
              {task.autoIncrease && (
                <div className="text-xs text-gray-500">
                  最高可达 ¥{task.maxReward}
                </div>
              )}
            </div>
          </div>

          <div className="prose max-w-none text-gray-700 mb-4">
            <p className="whitespace-pre-line">{task.description}</p>
          </div>

          {/* 任务要求文件 */}
          {task.requirementFiles && task.requirementFiles.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">任务要求文件</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {task.requirementFiles.map((file, index) => (
                  <div 
                    key={file.id} 
                    className="relative group cursor-pointer"
                    onClick={() => handleMediaPreview(index)}
                  >
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt="任务要求"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {task.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          {/* 质押信息 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">质押保障</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              雇主已质押 ¥{task.deposit} 作为保证金，确保任务完成后及时支付
            </p>
          </div>
        </div>

        {/* 发布者信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">发布者信息</h3>
          <div className="flex items-center space-x-3">
            <LazyImageWithFallback
              src={task.publisher.avatar}
              alt={task.publisher.username}
              className="w-12 h-12 rounded-full object-cover"
              fallbackSrc="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar&image_size=square"
            />
            <div className="flex-1">
              <div className="text-lg font-medium text-gray-900">{task.publisher.username}</div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span>{task.publisher.rating}</span>
                </div>
                <span>已发布 {task.publisher.publishedTasks} 个任务</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handleMessage}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                onClick={handleCall}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Phone className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-4">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                任务详情
              </button>
              <button
                onClick={() => setActiveTab('bids')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bids'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                竞标管理
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'status'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                状态管理
              </button>
            </nav>
          </div>

          <div className="p-4">
            {activeTab === 'details' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">详细说明</h3>
                <div className="prose max-w-none text-gray-700">
                  <p className="whitespace-pre-line">{task.description}</p>
                </div>
              </div>
            )}

            {activeTab === 'bids' && (
              <BidManagement
                bidders={task.bidders}
                taskReward={task.reward}
                selectedBidderId={task.selectedBidder}
                isPublisher={isPublisher}
                onSelectBidder={handleSelectBidder}
                onRejectBidder={handleRejectBidder}
                onContactBidder={handleContactBidder}
              />
            )}

            {activeTab === 'status' && (
              <TaskStatusManager
                taskId={task.id}
                currentStatus={task.status}
                statusHistory={statusHistory}
                reward={task.reward}
                currentReward={task.currentReward || task.reward}
                autoIncrease={task.autoIncrease}
                increaseAmount={task.increaseAmount}
                nextIncreaseTime={task.nextIncreaseTime}
                maxReward={task.maxReward}
                deadline={task.deadline}
                isPublisher={isPublisher}
                selectedBidder={task.selectedBidder}
                onStatusChange={handleStatusChange}
                onRewardIncrease={handleRewardIncrease}
                onExtendDeadline={handleExtendDeadline}
              />
            )}
          </div>
        </div>

        {/* 自动加价信息 */}
        {task.autoIncrease && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">自动加价</h3>
            </div>
            <div className="text-sm text-gray-600">
              <p>• 每24小时自动加价 ¥{task.increaseAmount}</p>
              <p>• 最高悬赏金额: ¥{task.maxReward}</p>
              <p>• 下次加价时间: 2024-01-16 10:30</p>
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      {!isPublisher && task.status === 'open' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe max-md:pb-24 max-sm:pb-28">
          <button
            onClick={() => setShowBidModal(true)}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            立即竞标
          </button>
        </div>
      )}

      {/* 接单者提交完成证明 */}
      {!isPublisher && task.status === 'in_progress' && task.selectedBidder === 'bidder1' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe max-md:pb-24 max-sm:pb-28">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">提交完成证明</span>
            </div>
            <p className="text-sm text-blue-700">
              请上传任务完成的图片或视频作为证明，等待雇主确认验收。
            </p>
          </div>
          <button
            onClick={() => setShowCompletionModal(true)}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>提交完成证明</span>
          </button>
        </div>
      )}

      {/* 雇主操作栏 */}
      {isPublisher && task.status === 'in_progress' && task.selectedBidder && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe max-md:pb-24 max-sm:pb-28">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">重要提醒</span>
            </div>
            <p className="text-sm text-orange-700">
              请确认任务已完全验收合格后再确认完成。一旦放行支付成功不可逆！
            </p>
          </div>
          <button
            onClick={handleConfirmCompletion}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>确认任务完成并支付</span>
          </button>
        </div>
      )}

      {/* 竞标弹窗 */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">提交竞标</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">竞标金额</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    placeholder="输入您的报价"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">预计完成天数</label>
                <input
                  type="number"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(Number(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">竞标说明</label>
                <textarea
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder="介绍您的经验和优势，提高中标几率"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowBidModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBid}
                disabled={!bidAmount || !bidMessage}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                提交竞标
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提交完成证明弹窗 */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">提交完成证明</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">上传要求</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 请上传能证明任务完成的图片或视频</li>
                  <li>• 确保文件清晰可见，符合任务要求</li>
                  <li>• 支持JPG、PNG、GIF、MP4等格式</li>
                  <li>• 单个文件不超过50MB</li>
                </ul>
              </div>

              <MediaUpload
                onFilesChange={setCompletionFiles}
                maxFiles={10}
                maxSize={50}
                label="完成证明文件"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">完成说明</label>
                <textarea
                  value={completionMessage}
                  onChange={(e) => setCompletionMessage(e.target.value)}
                  placeholder="请描述任务完成情况，说明提交的文件内容..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSubmitCompletion}
                disabled={completionFiles.length === 0 || !completionMessage.trim()}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                提交证明
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

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">支付金额: ¥{task.reward}</div>
                <div className="text-sm text-gray-500">接单者: {task.bidders.find(b => b.id === task.selectedBidder)?.username}</div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowPaymentWarning(false)}
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

      {/* 媒体预览模态框 */}
      {showMediaPreview && task.requirementFiles && task.requirementFiles.length > 0 && (
        <EnhancedMediaPreview
          files={task.requirementFiles}
          currentIndex={previewIndex}
          isOpen={showMediaPreview}
          onClose={() => setShowMediaPreview(false)}
          onNext={handleNextMedia}
          onPrevious={handlePreviousMedia}
        />
      )}
    </div>
  );
}