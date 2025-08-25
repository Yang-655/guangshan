import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, Calendar, User, MessageCircle } from 'lucide-react';
import { useToast } from './Toast';

interface TaskStatus {
  id: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  timestamp: string;
  description: string;
  actor?: string; // 执行操作的用户
}

interface TaskStatusManagerProps {
  taskId: string;
  currentStatus: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  statusHistory: TaskStatus[];
  reward: number;
  currentReward?: number;
  autoIncrease?: boolean;
  increaseAmount?: number;
  nextIncreaseTime?: string;
  maxReward?: number;
  deadline: string;
  onStatusChange: (newStatus: string, reason?: string) => void;
  onRewardIncrease: (amount: number) => void;
  onExtendDeadline: (newDeadline: string) => void;
  isPublisher: boolean;
  selectedBidder?: string;
}

const TaskStatusManager: React.FC<TaskStatusManagerProps> = ({
  taskId,
  currentStatus,
  statusHistory,
  reward,
  currentReward = reward,
  autoIncrease = false,
  increaseAmount = 0,
  nextIncreaseTime,
  maxReward,
  deadline,
  onStatusChange,
  onRewardIncrease,
  onExtendDeadline,
  isPublisher,
  selectedBidder
}) => {
  const { success, error, warning } = useToast();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [increaseAmountInput, setIncreaseAmountInput] = useState(increaseAmount || 50);
  const [newDeadline, setNewDeadline] = useState('');
  const [timeToIncrease, setTimeToIncrease] = useState<string>('');

  // 计算到下次自动加价的时间
  useEffect(() => {
    if (autoIncrease && nextIncreaseTime && currentStatus === 'open') {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const target = new Date(nextIncreaseTime).getTime();
        const diff = target - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeToIncrease(`${hours}小时${minutes}分钟`);
        } else {
          setTimeToIncrease('即将加价');
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000); // 每分钟更新

      return () => clearInterval(interval);
    }
  }, [autoIncrease, nextIncreaseTime, currentStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'in_progress':
        return <User className="w-5 h-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'disputed':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return '招募中';
      case 'in_progress':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      case 'disputed':
        return '争议中';
      default:
        return '未知状态';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'disputed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCancelTask = () => {
    if (!cancelReason.trim()) {
      error('请输入取消原因');
      return;
    }
    onStatusChange('cancelled', cancelReason);
    setShowCancelModal(false);
    setCancelReason('');
    success('任务已取消');
  };

  const handleIncreaseReward = () => {
    if (increaseAmountInput <= 0) {
      error('加价金额必须大于0');
      return;
    }
    if (maxReward && currentReward + increaseAmountInput > maxReward) {
      error(`加价后金额不能超过最大限额 ¥${maxReward}`);
      return;
    }
    onRewardIncrease(increaseAmountInput);
    setShowIncreaseModal(false);
    success(`悬赏金额已增加 ¥${increaseAmountInput}`);
  };

  const handleExtendDeadline = () => {
    if (!newDeadline) {
      error('请选择新的截止时间');
      return;
    }
    const newDate = new Date(newDeadline);
    const currentDate = new Date(deadline);
    if (newDate <= currentDate) {
      error('新截止时间必须晚于当前截止时间');
      return;
    }
    onExtendDeadline(newDeadline);
    setShowExtendModal(false);
    setNewDeadline('');
    success('截止时间已延长');
  };

  const isDeadlineApproaching = () => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const hoursLeft = (deadlineTime - now) / (1000 * 60 * 60);
    return hoursLeft <= 24 && hoursLeft > 0;
  };

  const isOverdue = () => {
    return new Date() > new Date(deadline);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* 当前状态 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon(currentStatus)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">任务状态</h3>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentStatus)}`}>
              {getStatusText(currentStatus)}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        {isPublisher && (
          <div className="flex space-x-2">
            {currentStatus === 'open' && (
              <>
                <button
                  onClick={() => setShowIncreaseModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  加价
                </button>
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  延期
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  取消
                </button>
              </>
            )}
            {currentStatus === 'in_progress' && (
              <button
                onClick={() => onStatusChange('completed')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                确认完成
              </button>
            )}
          </div>
        )}
      </div>

      {/* 悬赏金额信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">当前悬赏</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">¥{currentReward}</div>
          {currentReward > reward && (
            <div className="text-sm text-green-600 mt-1">
              已加价 ¥{currentReward - reward}
            </div>
          )}
        </div>

        {autoIncrease && currentStatus === 'open' && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">自动加价</span>
            </div>
            <div className="text-lg font-semibold text-blue-900">¥{increaseAmount}</div>
            {timeToIncrease && (
              <div className="text-sm text-blue-600 mt-1">
                {timeToIncrease}后
              </div>
            )}
          </div>
        )}

        <div className={`rounded-lg p-4 ${
          isOverdue() ? 'bg-red-50' : isDeadlineApproaching() ? 'bg-yellow-50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className={`w-5 h-5 ${
              isOverdue() ? 'text-red-600' : isDeadlineApproaching() ? 'text-yellow-600' : 'text-gray-600'
            }`} />
            <span className={`text-sm font-medium ${
              isOverdue() ? 'text-red-800' : isDeadlineApproaching() ? 'text-yellow-800' : 'text-gray-800'
            }`}>截止时间</span>
          </div>
          <div className={`text-sm font-medium ${
            isOverdue() ? 'text-red-900' : isDeadlineApproaching() ? 'text-yellow-900' : 'text-gray-900'
          }`}>
            {new Date(deadline).toLocaleString()}
          </div>
          {isOverdue() && (
            <div className="text-sm text-red-600 mt-1">已逾期</div>
          )}
          {isDeadlineApproaching() && !isOverdue() && (
            <div className="text-sm text-yellow-600 mt-1">即将到期</div>
          )}
        </div>
      </div>

      {/* 状态历史 */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">状态历史</h4>
        <div className="space-y-3">
          {statusHistory.map((status, index) => (
            <div key={status.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getStatusIcon(status.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{getStatusText(status.status)}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(status.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{status.description}</p>
                {status.actor && (
                  <p className="text-xs text-gray-500 mt-1">操作者: {status.actor}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 取消任务模态框 */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">取消任务</h3>
            <p className="text-gray-600 mb-4">请说明取消任务的原因：</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="请输入取消原因..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCancelTask}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加价模态框 */}
      {showIncreaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">增加悬赏金额</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">加价金额</label>
              <input
                type="number"
                value={increaseAmountInput}
                onChange={(e) => setIncreaseAmountInput(Number(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                当前: ¥{currentReward} → 加价后: ¥{currentReward + increaseAmountInput}
              </p>
              {maxReward && (
                <p className="text-sm text-gray-500">
                  最大限额: ¥{maxReward}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowIncreaseModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleIncreaseReward}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                确认加价
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 延期模态框 */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">延长截止时间</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">新的截止时间</label>
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                当前截止时间: {new Date(deadline).toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowExtendModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExtendDeadline}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认延期
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStatusManager;