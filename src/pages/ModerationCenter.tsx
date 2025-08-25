import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, Shield, Eye, CheckCircle, XCircle, Clock, Flag, FileText, User, MessageSquare, Image, Video, Search, Filter, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

interface Report {
  id: string;
  type: 'video' | 'comment' | 'user' | 'message';
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reportedBy: string;
  reportedUser: string;
  reportedContent: string;
  description: string;
  timestamp: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
}

interface Appeal {
  id: string;
  originalReportId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  response?: string;
}

interface ViolationRule {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  autoAction: string;
  isActive: boolean;
}

export default function ModerationCenter() {
  const navigate = useNavigate();
  const { success, info, error } = useToast();
  const [activeTab, setActiveTab] = useState<'reports' | 'appeals' | 'rules' | 'statistics'>('reports');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 模拟举报数据
  const reports: Report[] = [
    {
      id: 'RPT001',
      type: 'video',
      reason: '不当内容',
      status: 'pending',
      priority: 'high',
      reportedBy: '用户A',
      reportedUser: '创作者B',
      reportedContent: '视频：春季穿搭分享',
      description: '视频中包含不适宜的内容，违反社区准则',
      timestamp: '2024-01-15 14:30',
    },
    {
      id: 'RPT002',
      type: 'comment',
      reason: '恶意骚扰',
      status: 'reviewing',
      priority: 'medium',
      reportedBy: '用户C',
      reportedUser: '用户D',
      reportedContent: '评论：你这个视频真的很无聊...',
      description: '用户在评论区进行恶意攻击和骚扰',
      timestamp: '2024-01-15 12:15',
      reviewedBy: '审核员1',
    },
    {
      id: 'RPT003',
      type: 'user',
      reason: '虚假信息',
      status: 'resolved',
      priority: 'urgent',
      reportedBy: '用户E',
      reportedUser: '用户F',
      reportedContent: '用户资料：虚假身份信息',
      description: '用户使用虚假身份信息注册账户',
      timestamp: '2024-01-14 16:45',
      reviewedBy: '审核员2',
      reviewedAt: '2024-01-15 09:30',
      resolution: '已封禁账户，要求重新验证身份'
    },
    {
      id: 'RPT004',
      type: 'message',
      reason: '垃圾信息',
      status: 'rejected',
      priority: 'low',
      reportedBy: '用户G',
      reportedUser: '用户H',
      reportedContent: '私信：推广信息',
      description: '发送垃圾推广信息',
      timestamp: '2024-01-14 10:20',
      reviewedBy: '审核员1',
      reviewedAt: '2024-01-14 15:45',
      resolution: '经审核，内容未违反社区准则'
    }
  ];

  // 模拟申诉数据
  const appeals: Appeal[] = [
    {
      id: 'APL001',
      originalReportId: 'RPT003',
      userId: '用户F',
      reason: '误判申诉',
      status: 'pending',
      submittedAt: '2024-01-15 10:30'
    },
    {
      id: 'APL002',
      originalReportId: 'RPT001',
      userId: '创作者B',
      reason: '内容合规申诉',
      status: 'reviewing',
      submittedAt: '2024-01-15 08:15',
      reviewedBy: '审核主管'
    }
  ];

  // 模拟违规规则
  const violationRules: ViolationRule[] = [
    {
      id: 'RULE001',
      category: '内容安全',
      title: '暴力血腥内容',
      description: '禁止发布包含暴力、血腥、恐怖等内容',
      severity: 'critical',
      autoAction: '立即下架',
      isActive: true
    },
    {
      id: 'RULE002',
      category: '用户行为',
      title: '恶意骚扰',
      description: '禁止对其他用户进行恶意骚扰、威胁或攻击',
      severity: 'severe',
      autoAction: '警告处理',
      isActive: true
    },
    {
      id: 'RULE003',
      category: '内容质量',
      title: '垃圾信息',
      description: '禁止发布垃圾信息、广告推广等无关内容',
      severity: 'moderate',
      autoAction: '限制发布',
      isActive: true
    },
    {
      id: 'RULE004',
      category: '知识产权',
      title: '版权侵犯',
      description: '禁止未经授权使用他人版权内容',
      severity: 'severe',
      autoAction: '下架处理',
      isActive: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'reviewing': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'approved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'reviewing': return '审核中';
      case 'resolved': return '已处理';
      case 'rejected': return '已驳回';
      case 'approved': return '已通过';
      default: return '未知';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return '紧急';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'severe': return 'text-orange-600 bg-orange-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'minor': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return '严重';
      case 'severe': return '重度';
      case 'moderate': return '中度';
      case 'minor': return '轻微';
      default: return '未知';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'comment': return <MessageSquare className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || report.priority === selectedPriority;
    const matchesSearch = report.reportedUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.reportedContent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // 事件处理函数
  const handleStartReview = (reportId: string) => {
    info(`开始审核举报 ${reportId}`);
    // 这里可以添加实际的审核逻辑
  };

  const handleViewDetails = (reportId: string) => {
    info(`查看举报详情 ${reportId}`);
    // 这里可以添加跳转到详情页的逻辑
  };

  const handleApproveReport = (reportId: string) => {
    success(`举报 ${reportId} 已通过审核`);
    // 这里可以添加更新举报状态的逻辑
  };

  const handleRejectReport = (reportId: string) => {
    error(`举报 ${reportId} 已被驳回`);
    // 这里可以添加更新举报状态的逻辑
  };

  const handleViewResult = (reportId: string) => {
    info(`查看举报 ${reportId} 的处理结果`);
    // 这里可以添加查看结果的逻辑
  };

  const handleStartAppealReview = (appealId: string) => {
    info(`开始审核申诉 ${appealId}`);
    // 这里可以添加申诉审核逻辑
  };

  const handleApproveAppeal = (appealId: string) => {
    success(`申诉 ${appealId} 已批准`);
    // 这里可以添加批准申诉的逻辑
  };

  const handleRejectAppeal = (appealId: string) => {
    error(`申诉 ${appealId} 已驳回`);
    // 这里可以添加驳回申诉的逻辑
  };

  const handleAddRule = () => {
    info('添加新的违规检测规则');
    // 这里可以添加打开添加规则模态框的逻辑
  };

  const handleEditRule = (ruleId: string) => {
    info(`编辑规则 ${ruleId}`);
    // 这里可以添加编辑规则的逻辑
  };

  const handleSearch = () => {
    info('打开搜索功能');
    // 这里可以添加搜索功能的逻辑
  };

  const handleFilter = () => {
    info('打开筛选功能');
    // 这里可以添加筛选功能的逻辑
  };

  const handleMoreOptions = (id: string) => {
    info(`查看更多选项 ${id}`);
    // 这里可以添加更多选项的逻辑
  };

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
            <h1 className="text-xl font-semibold text-gray-800">内容审核中心</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleSearch}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={handleFilter}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            举报处理
          </button>
          <button
            onClick={() => setActiveTab('appeals')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'appeals'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            申诉管理
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'rules'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            违规检测
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'statistics'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            统计分析
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'reports' && (
          <div>
            {/* 筛选器 */}
            <div className="bg-white rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="搜索用户或内容..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="reviewing">审核中</option>
                  <option value="resolved">已处理</option>
                  <option value="rejected">已驳回</option>
                </select>
                <select 
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部优先级</option>
                  <option value="urgent">紧急</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
            </div>

            {/* 举报列表 */}
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex items-center mr-3">
                        {getTypeIcon(report.type)}
                        <span className="ml-2 text-sm font-medium text-gray-700">{report.id}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {getStatusText(report.status)}
                      </span>
                      <span className={`ml-2 text-xs font-medium ${getPriorityColor(report.priority)}`}>
                        {getPriorityText(report.priority)}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleMoreOptions(report.id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">举报原因：</span>{report.reason}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">被举报用户：</span>{report.reportedUser}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">被举报内容：</span>{report.reportedContent}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">举报描述：</span>{report.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      <span>举报时间：{report.timestamp}</span>
                      {report.reviewedAt && (
                        <span className="ml-4">处理时间：{report.reviewedAt}</span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {report.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStartReview(report.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                          >
                            开始审核
                          </button>
                          <button 
                            onClick={() => handleViewDetails(report.id)}
                            className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors"
                          >
                            查看详情
                          </button>
                        </>
                      )}
                      {report.status === 'reviewing' && (
                        <>
                          <button 
                            onClick={() => handleApproveReport(report.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                          >
                            通过
                          </button>
                          <button 
                            onClick={() => handleRejectReport(report.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                          >
                            驳回
                          </button>
                        </>
                      )}
                      {(report.status === 'resolved' || report.status === 'rejected') && (
                        <button 
                          onClick={() => handleViewResult(report.id)}
                          className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors"
                        >
                          查看结果
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {report.resolution && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">处理结果：</span>{report.resolution}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'appeals' && (
          <div>
            <div className="space-y-4">
              {appeals.map((appeal) => (
                <div key={appeal.id} className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 mr-3">{appeal.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appeal.status)}`}>
                        {getStatusText(appeal.status)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{appeal.submittedAt}</span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">原举报ID：</span>{appeal.originalReportId}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">申诉用户：</span>{appeal.userId}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">申诉理由：</span>{appeal.reason}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    {appeal.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleStartAppealReview(appeal.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          开始审核
                        </button>
                        <button 
                          onClick={() => handleViewDetails(appeal.id)}
                          className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors"
                        >
                          查看详情
                        </button>
                      </>
                    )}
                    {appeal.status === 'reviewing' && (
                      <>
                        <button 
                          onClick={() => handleApproveAppeal(appeal.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          批准申诉
                        </button>
                        <button 
                          onClick={() => handleRejectAppeal(appeal.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                        >
                          驳回申诉
                        </button>
                      </>
                    )}
                  </div>
                  
                  {appeal.response && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">审核回复：</span>{appeal.response}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div>
            <div className="bg-white rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">违规检测规则</h3>
                <button 
                  onClick={handleAddRule}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  添加规则
                </button>
              </div>
              
              <div className="space-y-4">
                {violationRules.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-800 mr-3">{rule.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(rule.severity)}`}>
                          {getSeverityText(rule.severity)}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">{rule.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          rule.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <button 
                          onClick={() => handleEditRule(rule.id)}
                          className="text-blue-600 text-sm hover:text-blue-700"
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                    
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">自动处理：</span>{rule.autoAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div>
            {/* 统计概览 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">待处理举报</span>
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{reports.filter(r => r.status === 'pending').length}</div>
                <div className="text-sm text-orange-600">需要关注</div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">今日处理</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">12</div>
                <div className="text-sm text-green-600">+3 较昨日</div>
              </div>
            </div>

            {/* 处理效率 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">处理效率统计</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">平均处理时间</span>
                  <span className="text-sm font-medium text-gray-800">2.5小时</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">处理准确率</span>
                  <span className="text-sm font-medium text-gray-800">94.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">申诉成功率</span>
                  <span className="text-sm font-medium text-gray-800">8.5%</span>
                </div>
              </div>
            </div>

            {/* 违规类型分布 */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">违规类型分布</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">不当内容</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">恶意骚扰</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">垃圾信息</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">虚假信息</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}