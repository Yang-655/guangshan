import React, { useState } from 'react';
import { ArrowLeft, Star, Award, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertTriangle, Shield, Target, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LazyImageWithFallback from '../components/LazyImageWithFallback';

interface CreditRecord {
  id: string;
  type: 'increase' | 'decrease';
  amount: number;
  reason: string;
  taskTitle: string;
  date: string;
  description: string;
}

interface TaskHistory {
  id: string;
  title: string;
  type: 'published' | 'completed' | 'failed';
  amount: number;
  date: string;
  rating?: number;
  status: 'completed' | 'failed' | 'cancelled';
}

export default function CreditCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // 模拟用户信用数据
  const userCredit = {
    score: 92,
    level: '黄金',
    levelColor: 'text-yellow-600',
    totalTasks: 45,
    completedTasks: 42,
    failedTasks: 3,
    completionRate: 93.3,
    averageRating: 4.7,
    totalEarnings: 15680,
    onTimeRate: 95.2,
    responseTime: '2小时',
    joinDate: '2023-06-15'
  };

  const creditRecords: CreditRecord[] = [
    {
      id: '1',
      type: 'increase',
      amount: 5,
      reason: '按时完成任务',
      taskTitle: 'Logo设计项目',
      date: '2024-01-15 18:30',
      description: '任务按时完成，获得雇主5星好评'
    },
    {
      id: '2',
      type: 'increase',
      amount: 3,
      reason: '超预期完成',
      taskTitle: '网站UI设计',
      date: '2024-01-12 14:20',
      description: '提前2天完成任务，质量超出预期'
    },
    {
      id: '3',
      type: 'decrease',
      amount: -8,
      reason: '延期完成',
      taskTitle: '小程序开发',
      date: '2024-01-08 09:15',
      description: '任务延期3天完成，影响雇主计划'
    },
    {
      id: '4',
      type: 'increase',
      amount: 2,
      reason: '积极沟通',
      taskTitle: '文案撰写',
      date: '2024-01-05 16:45',
      description: '与雇主保持良好沟通，及时反馈进度'
    }
  ];

  const taskHistory: TaskHistory[] = [
    {
      id: '1',
      title: 'Logo设计项目',
      type: 'completed',
      amount: 500,
      date: '2024-01-15',
      rating: 5,
      status: 'completed'
    },
    {
      id: '2',
      title: '网站UI设计',
      type: 'completed',
      amount: 1200,
      date: '2024-01-12',
      rating: 4.8,
      status: 'completed'
    },
    {
      id: '3',
      title: '小程序开发',
      type: 'completed',
      amount: 2000,
      date: '2024-01-08',
      rating: 3.5,
      status: 'completed'
    },
    {
      id: '4',
      title: '品牌策划方案',
      type: 'failed',
      amount: 800,
      date: '2024-01-01',
      status: 'failed'
    }
  ];

  const creditLevels = [
    { range: '95-100', level: '钻石', color: 'text-purple-600 bg-purple-100', benefits: ['优先接单权', '高价值任务', '专属客服'] },
    { range: '85-94', level: '黄金', color: 'text-yellow-600 bg-yellow-100', benefits: ['优先推荐', '快速提现', '任务保障'] },
    { range: '70-84', level: '白银', color: 'text-gray-600 bg-gray-100', benefits: ['正常接单', '标准服务', '基础保障'] },
    { range: '60-69', level: '青铜', color: 'text-orange-600 bg-orange-100', benefits: ['限制接单', '延迟提现', '基础功能'] },
    { range: '0-59', level: '黑名单', color: 'text-red-600 bg-red-100', benefits: ['禁止接单', '账户冻结', '限制功能'] }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-purple-600';
    if (score >= 85) return 'text-yellow-600';
    if (score >= 70) return 'text-gray-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreProgress = (score: number) => {
    return Math.min(score, 100);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 信用评分卡片 */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">信用评分</h2>
            <p className="text-purple-100">您的信用等级</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{userCredit.score}</div>
            <div className="text-lg">{userCredit.level}</div>
          </div>
        </div>
        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${getScoreProgress(userCredit.score)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-purple-100 mt-2">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{userCredit.completionRate}%</div>
              <div className="text-sm text-gray-500">完成率</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{userCredit.averageRating}</div>
              <div className="text-sm text-gray-500">平均评分</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{userCredit.totalTasks}</div>
              <div className="text-sm text-gray-500">总任务数</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{userCredit.onTimeRate}%</div>
              <div className="text-sm text-gray-500">按时率</div>
            </div>
          </div>
        </div>
      </div>

      {/* 信用等级说明 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">信用等级体系</h3>
        <div className="space-y-3">
          {creditLevels.map((level, index) => (
            <div key={index} className={`border rounded-lg p-3 ${
              level.level === userCredit.level ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className={`font-bold text-lg ${level.color.split(' ')[0]}`}>{level.level}</span>
                  <span className="text-sm text-gray-500">({level.range} 分)</span>
                  {level.level === userCredit.level && (
                    <Award className="w-4 h-4 text-purple-600" />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {level.benefits.map((benefit, benefitIndex) => (
                  <span
                    key={benefitIndex}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRecords = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">信用记录</h3>
        <div className="space-y-3">
          {creditRecords.map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    record.type === 'increase' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {record.type === 'increase' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{record.reason}</div>
                    <div className="text-sm text-gray-500">{record.taskTitle}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    record.type === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {record.type === 'increase' ? '+' : ''}{record.amount}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(record.date).toLocaleString()}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">{record.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">任务历史</h3>
        <div className="space-y-3">
          {taskHistory.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    task.status === 'completed' ? 'bg-green-100' : 
                    task.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : task.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(task.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">¥{task.amount}</div>
                  {task.rating && (
                    <div className="flex items-center space-x-1 text-sm text-yellow-600">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{task.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
              <Shield className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">信用中心</h1>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="px-4 pb-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'overview', label: '概览', icon: Award },
              { id: 'records', label: '信用记录', icon: TrendingUp },
              { id: 'history', label: '任务历史', icon: Calendar }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'records' && renderRecords()}
        {activeTab === 'history' && renderHistory()}
      </div>

      {/* 提示信息 */}
      <div className="p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">信用提升建议</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 按时完成任务，避免延期交付</li>
                <li>• 保持良好沟通，及时反馈进度</li>
                <li>• 提供高质量的工作成果</li>
                <li>• 积极响应雇主的反馈和修改要求</li>
                <li>• 诚信接单，不恶意竞标</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}