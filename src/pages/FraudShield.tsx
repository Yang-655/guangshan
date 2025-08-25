import React, { useState } from 'react';
import { ArrowLeft, Shield, AlertTriangle, Eye, TrendingUp, Users, MessageSquare, Phone, Mail, Globe, CheckCircle, XCircle, Clock, Flag, BookOpen, FileText, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface RiskAlert {
  id: string;
  type: 'login' | 'transaction' | 'message' | 'profile';
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
  userId?: string;
  details: string;
}

interface FraudReport {
  id: string;
  reportType: 'scam' | 'phishing' | 'fake_profile' | 'financial_fraud' | 'other';
  reportedUser: string;
  reportedBy: string;
  description: string;
  evidence: string[];
  status: 'pending' | 'investigating' | 'confirmed' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  investigatedBy?: string;
  resolution?: string;
}

interface SecurityTip {
  id: string;
  category: 'general' | 'financial' | 'privacy' | 'communication';
  title: string;
  content: string;
  importance: 'info' | 'warning' | 'critical';
  readCount: number;
}

interface ThreatStatistics {
  totalThreats: number;
  blockedAttacks: number;
  protectedUsers: number;
  riskScore: number;
  trends: {
    threats: number;
    blocks: number;
    reports: number;
  };
}

export default function FraudShield() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'reports' | 'education'>('dashboard');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedReportType, setSelectedReportType] = useState<string>('all');

  // 模拟风险警报数据
  const riskAlerts: RiskAlert[] = [
    {
      id: 'ALERT001',
      type: 'transaction',
      level: 'critical',
      title: '异常大额转账',
      description: '检测到用户尝试进行超出正常范围的大额转账',
      timestamp: '2024-01-15 14:30',
      status: 'active',
      userId: 'user123',
      details: '转账金额: ¥50,000，超出用户历史平均转账金额10倍'
    },
    {
      id: 'ALERT002',
      type: 'login',
      level: 'high',
      title: '异地登录',
      description: '检测到来自异常地理位置的登录尝试',
      timestamp: '2024-01-15 12:15',
      status: 'investigating',
      userId: 'user456',
      details: '登录IP: 192.168.1.100，地理位置: 海外，与用户常用地址不符'
    },
    {
      id: 'ALERT003',
      type: 'message',
      level: 'medium',
      title: '可疑消息内容',
      description: 'AI检测到可能包含诈骗信息的消息',
      timestamp: '2024-01-15 10:45',
      status: 'resolved',
      userId: 'user789',
      details: '消息包含"投资理财"、"高收益"等敏感词汇'
    },
    {
      id: 'ALERT004',
      type: 'profile',
      level: 'low',
      title: '资料异常修改',
      description: '用户频繁修改个人资料',
      timestamp: '2024-01-14 16:20',
      status: 'resolved',
      userId: 'user101',
      details: '24小时内修改资料5次，包括头像、昵称、个人简介'
    }
  ];

  // 模拟诈骗举报数据
  const fraudReports: FraudReport[] = [
    {
      id: 'RPT001',
      reportType: 'financial_fraud',
      reportedUser: '诈骗用户A',
      reportedBy: '用户B',
      description: '该用户冒充投资顾问，诱导我进行虚假投资',
      evidence: ['聊天记录截图', '转账记录', '虚假投资平台链接'],
      status: 'investigating',
      priority: 'urgent',
      submittedAt: '2024-01-15 09:30',
      investigatedBy: '调查员1'
    },
    {
      id: 'RPT002',
      reportType: 'phishing',
      reportedUser: '钓鱼用户C',
      reportedBy: '用户D',
      description: '收到虚假的银行验证链接，要求输入银行卡信息',
      evidence: ['钓鱼链接', '虚假页面截图'],
      status: 'confirmed',
      priority: 'high',
      submittedAt: '2024-01-14 15:45',
      investigatedBy: '调查员2',
      resolution: '已确认为钓鱼攻击，已封禁相关账户'
    },
    {
      id: 'RPT003',
      reportType: 'fake_profile',
      reportedUser: '虚假用户E',
      reportedBy: '用户F',
      description: '该用户使用他人照片和信息创建虚假档案',
      evidence: ['对比照片', '身份信息不符'],
      status: 'pending',
      priority: 'medium',
      submittedAt: '2024-01-14 11:20'
    }
  ];

  // 模拟安全教育内容
  const securityTips: SecurityTip[] = [
    {
      id: 'TIP001',
      category: 'financial',
      title: '如何识别投资诈骗',
      content: '警惕承诺高收益、低风险的投资项目。正规投资都有风险，收益与风险成正比。',
      importance: 'critical',
      readCount: 1250
    },
    {
      id: 'TIP002',
      category: 'communication',
      title: '防范钓鱼信息',
      content: '不要点击来源不明的链接，不要在非官方页面输入个人敏感信息。',
      importance: 'warning',
      readCount: 980
    },
    {
      id: 'TIP003',
      category: 'privacy',
      title: '保护个人隐私',
      content: '不要随意透露个人身份信息、银行卡号、密码等敏感信息。',
      importance: 'warning',
      readCount: 1560
    },
    {
      id: 'TIP004',
      category: 'general',
      title: '安全使用社交平台',
      content: '谨慎添加陌生人，不要轻信网友的投资建议或借款请求。',
      importance: 'info',
      readCount: 750
    }
  ];

  // 模拟威胁统计数据
  const threatStats: ThreatStatistics = {
    totalThreats: 1247,
    blockedAttacks: 892,
    protectedUsers: 15680,
    riskScore: 2.3,
    trends: {
      threats: -12.5,
      blocks: 18.7,
      reports: 5.2
    }
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelText = (level: string): string => {
    switch (level) {
      case 'critical': return '严重';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'investigating': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      case 'confirmed': return 'text-red-600 bg-red-100';
      case 'dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active': return '活跃';
      case 'investigating': return '调查中';
      case 'resolved': return '已解决';
      case 'pending': return '待处理';
      case 'confirmed': return '已确认';
      case 'dismissed': return '已驳回';
      default: return '未知';
    }
  };

  const getReportTypeText = (type: string): string => {
    switch (type) {
      case 'scam': return '诈骗';
      case 'phishing': return '钓鱼';
      case 'fake_profile': return '虚假资料';
      case 'financial_fraud': return '金融诈骗';
      case 'other': return '其他';
      default: return '未知';
    }
  };

  const getImportanceColor = (importance: string): string => {
    switch (importance) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login': return <Users className="w-4 h-4" />;
      case 'transaction': return <BarChart3 className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'profile': return <Users className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredAlerts = riskAlerts.filter(alert => {
    return selectedRiskLevel === 'all' || alert.level === selectedRiskLevel;
  });

  const filteredReports = fraudReports.filter(report => {
    return selectedReportType === 'all' || report.reportType === selectedReportType;
  });

  // 事件处理函数
  const handleSettings = () => {
    toast.success('打开设置页面');
  };

  const handleViewAllAlerts = () => {
    setActiveTab('alerts');
    toast.success('查看全部警报');
  };

  const handleStartInvestigation = (alertId: string) => {
    toast.success(`开始调查警报 ${alertId}`);
  };

  const handleImmediateAction = (alertId: string) => {
    toast.success(`立即处理警报 ${alertId}`);
  };

  const handleMarkResolved = (alertId: string) => {
    toast.success(`警报 ${alertId} 已标记为解决`);
  };

  const handleViewDetails = (id: string) => {
    toast.success(`查看详情 ${id}`);
  };

  const handleStartReportInvestigation = (reportId: string) => {
    toast.success(`开始调查举报 ${reportId}`);
  };

  const handleConfirmViolation = (reportId: string) => {
    toast.success(`确认举报 ${reportId} 违规`);
  };

  const handleDismissReport = (reportId: string) => {
    toast.success(`驳回举报 ${reportId}`);
  };

  const handleViewResult = (reportId: string) => {
    toast.success(`查看举报 ${reportId} 结果`);
  };

  const handleReadFullText = (tipId: string) => {
    toast.success(`阅读安全提示 ${tipId} 全文`);
  };

  const handleReportSuspicious = () => {
    toast.success('打开举报页面');
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
            <h1 className="text-xl font-semibold text-gray-800">反诈骗中心</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleSettings}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            监控面板
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            风险警报
          </button>
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
            onClick={() => setActiveTab('education')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'education'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            安全教育
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'dashboard' && (
          <div>
            {/* 威胁统计概览 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">检测威胁</span>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{threatStats.totalThreats}</div>
                <div className={`text-sm ${
                  threatStats.trends.threats >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {threatStats.trends.threats >= 0 ? '+' : ''}{threatStats.trends.threats}% 较上期
                </div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">拦截攻击</span>
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{threatStats.blockedAttacks}</div>
                <div className="text-sm text-green-600">
                  +{threatStats.trends.blocks}% 较上期
                </div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">保护用户</span>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{threatStats.protectedUsers.toLocaleString()}</div>
                <div className="text-sm text-blue-600">累计保护</div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">风险评分</span>
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{threatStats.riskScore}</div>
                <div className="text-sm text-yellow-600">低风险</div>
              </div>
            </div>

            {/* 实时威胁监控 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">实时威胁监控</h3>
              <div className="space-y-3">
                {riskAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      {getTypeIcon(alert.type)}
                      <div className="ml-3">
                        <div className="font-medium text-gray-800">{alert.title}</div>
                        <div className="text-sm text-gray-500">{alert.timestamp}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(alert.level)}`}>
                        {getRiskLevelText(alert.level)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {getStatusText(alert.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleViewAllAlerts}
                className="w-full mt-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
              >
                查看全部警报
              </button>
            </div>

            {/* 安全状态 */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">安全状态</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI反诈骗引擎</span>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">运行正常</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">实时监控系统</span>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">运行正常</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">威胁情报更新</span>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">最新版本</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">用户举报处理</span>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-yellow-600 mr-1" />
                    <span className="text-sm text-yellow-600">3个待处理</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div>
            {/* 筛选器 */}
            <div className="bg-white rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-4">
                <select 
                  value={selectedRiskLevel}
                  onChange={(e) => setSelectedRiskLevel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部风险等级</option>
                  <option value="critical">严重</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
            </div>

            {/* 风险警报列表 */}
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {getTypeIcon(alert.type)}
                      <span className="ml-2 text-sm font-medium text-gray-700">{alert.id}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(alert.level)}`}>
                        {getRiskLevelText(alert.level)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {getStatusText(alert.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-800 mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <div className="text-xs text-gray-500">
                      <span>时间：{alert.timestamp}</span>
                      {alert.userId && <span className="ml-4">用户：{alert.userId}</span>}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg mb-3">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">详细信息：</span>{alert.details}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    {alert.status === 'active' && (
                      <>
                        <button 
                          onClick={() => handleStartInvestigation(alert.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          开始调查
                        </button>
                        <button 
                          onClick={() => handleImmediateAction(alert.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                        >
                          立即处理
                        </button>
                      </>
                    )}
                    {alert.status === 'investigating' && (
                      <button 
                        onClick={() => handleMarkResolved(alert.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        标记解决
                      </button>
                    )}
                    <button 
                      onClick={() => handleViewDetails(alert.id)}
                      className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            {/* 筛选器 */}
            <div className="bg-white rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-4">
                <select 
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部举报类型</option>
                  <option value="scam">诈骗</option>
                  <option value="phishing">钓鱼</option>
                  <option value="fake_profile">虚假资料</option>
                  <option value="financial_fraud">金融诈骗</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>

            {/* 举报列表 */}
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Flag className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">{report.id}</span>
                      <span className="ml-2 text-xs text-gray-500">{getReportTypeText(report.reportType)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(report.priority)}`}>
                        {getRiskLevelText(report.priority)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {getStatusText(report.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">被举报用户：</span>{report.reportedUser}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">举报人：</span>{report.reportedBy}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">举报描述：</span>{report.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      提交时间：{report.submittedAt}
                      {report.investigatedBy && <span className="ml-4">调查员：{report.investigatedBy}</span>}
                    </div>
                  </div>
                  
                  {report.evidence.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">证据材料：</div>
                      <div className="flex flex-wrap gap-2">
                        {report.evidence.map((evidence, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {evidence}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {report.resolution && (
                    <div className="p-3 bg-green-50 rounded-lg mb-3">
                      <div className="text-sm text-green-700">
                        <span className="font-medium">处理结果：</span>{report.resolution}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    {report.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleStartReportInvestigation(report.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          开始调查
                        </button>
                        <button 
                          onClick={() => handleViewDetails(report.id)}
                          className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors"
                        >
                          查看详情
                        </button>
                      </>
                    )}
                    {report.status === 'investigating' && (
                      <>
                        <button 
                          onClick={() => handleConfirmViolation(report.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          确认违规
                        </button>
                        <button 
                          onClick={() => handleDismissReport(report.id)}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                        >
                          驳回举报
                        </button>
                      </>
                    )}
                    {(report.status === 'confirmed' || report.status === 'dismissed') && (
                      <button 
                        onClick={() => handleViewResult(report.id)}
                        className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors"
                      >
                        查看结果
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div>
            {/* 安全教育内容 */}
            <div className="space-y-4">
              {securityTips.map((tip) => (
                <div key={tip.id} className={`rounded-xl p-4 border-l-4 ${getImportanceColor(tip.importance)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{tip.title}</h4>
                    <div className="flex items-center text-xs text-gray-500">
                      <Eye className="w-3 h-3 mr-1" />
                      <span>{tip.readCount}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{tip.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">{tip.category}</span>
                    <button 
                      onClick={() => handleReadFullText(tip.id)}
                      className="text-blue-600 text-xs hover:text-blue-700"
                    >
                      阅读全文
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 举报入口 */}
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 mb-2">发现可疑行为？</h4>
                  <p className="text-sm text-red-700 mb-3">
                    如果您遇到诈骗、钓鱼或其他可疑行为，请立即举报。我们会认真调查每一个举报。
                  </p>
                  <button 
                    onClick={handleReportSuspicious}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    立即举报
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}