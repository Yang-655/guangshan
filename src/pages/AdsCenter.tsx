import React, { useState } from 'react';
import { ArrowLeft, Plus, BarChart3, Target, Users, Eye, MousePointer, TrendingUp, Calendar, DollarSign, Settings, Play, Pause, Edit, Trash2, Download, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  startDate: string;
  endDate: string;
  targetAudience: string;
  adType: 'video' | 'image' | 'carousel' | 'story';
}

interface AnalyticsData {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface MarketingTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'automation' | 'analytics' | 'creative' | 'targeting';
  isActive: boolean;
}

export default function AdsCenter() {
  const navigate = useNavigate();
  const { success, info, error } = useToast();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics' | 'tools' | 'management'>('campaigns');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // 模拟广告活动数据
  const campaigns: Campaign[] = [
    {
      id: '1',
      name: '春季新品推广',
      status: 'active',
      budget: 5000,
      spent: 3250,
      impressions: 125000,
      clicks: 3750,
      conversions: 187,
      ctr: 3.0,
      cpc: 0.87,
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      targetAudience: '18-35岁女性',
      adType: 'video'
    },
    {
      id: '2',
      name: '品牌知名度提升',
      status: 'active',
      budget: 8000,
      spent: 2100,
      impressions: 89000,
      clicks: 2670,
      conversions: 89,
      ctr: 3.0,
      cpc: 0.79,
      startDate: '2024-01-10',
      endDate: '2024-02-28',
      targetAudience: '25-45岁商务人士',
      adType: 'image'
    },
    {
      id: '3',
      name: '限时促销活动',
      status: 'paused',
      budget: 3000,
      spent: 2850,
      impressions: 67000,
      clicks: 2010,
      conversions: 156,
      ctr: 3.0,
      cpc: 1.42,
      startDate: '2024-01-05',
      endDate: '2024-01-20',
      targetAudience: '全年龄段',
      adType: 'carousel'
    }
  ];

  // 模拟分析数据
  const analyticsData: AnalyticsData[] = [
    { metric: '总展示量', value: 281000, change: 12.5, trend: 'up' },
    { metric: '总点击量', value: 8430, change: 8.3, trend: 'up' },
    { metric: '总转化量', value: 432, change: -2.1, trend: 'down' },
    { metric: '平均CTR', value: 3.0, change: 0.2, trend: 'up' },
    { metric: '平均CPC', value: 0.95, change: -5.8, trend: 'down' },
    { metric: 'ROAS', value: 4.2, change: 15.6, trend: 'up' }
  ];

  // 模拟营销工具
  const marketingTools: MarketingTool[] = [
    {
      id: '1',
      name: '自动出价优化',
      description: '基于AI算法自动调整出价策略',
      icon: '🤖',
      category: 'automation',
      isActive: true
    },
    {
      id: '2',
      name: '受众洞察分析',
      description: '深度分析目标受众行为和偏好',
      icon: '👥',
      category: 'analytics',
      isActive: true
    },
    {
      id: '3',
      name: '创意素材生成',
      description: 'AI辅助生成广告创意和素材',
      icon: '🎨',
      category: 'creative',
      isActive: false
    },
    {
      id: '4',
      name: '精准定向投放',
      description: '多维度精准定向目标用户',
      icon: '🎯',
      category: 'targeting',
      isActive: true
    },
    {
      id: '5',
      name: '实时数据监控',
      description: '24/7实时监控广告投放效果',
      icon: '📊',
      category: 'analytics',
      isActive: true
    },
    {
      id: '6',
      name: '预算智能分配',
      description: '根据效果自动分配广告预算',
      icon: '💰',
      category: 'automation',
      isActive: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '投放中';
      case 'paused': return '已暂停';
      case 'completed': return '已完成';
      case 'draft': return '草稿';
      default: return '未知';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      case 'stable': return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
      default: return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'automation': return 'bg-blue-100 text-blue-800';
      case 'analytics': return 'bg-green-100 text-green-800';
      case 'creative': return 'bg-purple-100 text-purple-800';
      case 'targeting': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 事件处理函数
  const handlePauseCampaign = (campaignId: string) => {
    info(`广告活动 ${campaignId} 已暂停`);
    // 这里可以添加暂停广告活动的逻辑
  };

  const handlePlayCampaign = (campaignId: string) => {
    success(`广告活动 ${campaignId} 已启动`);
    // 这里可以添加启动广告活动的逻辑
  };

  const handleEditCampaign = (campaignId: string) => {
    info(`编辑广告活动 ${campaignId}`);
    // 这里可以添加编辑广告活动的逻辑
  };

  const handleDeleteCampaign = (campaignId: string) => {
    error(`删除广告活动 ${campaignId}`);
    // 这里可以添加删除广告活动的逻辑
  };

  const handleTimeFilter = (period: string) => {
    info(`切换到${period}数据视图`);
    // 这里可以添加时间筛选的逻辑
  };

  const handleToolFilter = () => {
    info('打开工具筛选');
    // 这里可以添加工具筛选的逻辑
  };

  const handleToggleTool = (toolId: string, isActive: boolean) => {
    if (isActive) {
      info(`工具 ${toolId} 已停用`);
    } else {
      success(`工具 ${toolId} 已启用`);
    }
    // 这里可以添加切换工具状态的逻辑
  };

  const handleRecharge = () => {
    info('跳转到充值页面');
    // 这里可以添加跳转到充值页面的逻辑
  };

  const handleViewBill = () => {
    info('查看账单详情');
    // 这里可以添加查看账单的逻辑
  };

  const handleUploadMaterial = () => {
    info('打开素材上传');
    // 这里可以添加上传素材的逻辑
  };

  const handleViewMaterial = (materialId: string) => {
    info(`查看素材 ${materialId}`);
    // 这里可以添加查看素材的逻辑
  };

  const handleDownloadMaterial = (materialId: string) => {
    success(`素材 ${materialId} 下载成功`);
    // 这里可以添加下载素材的逻辑
  };

  const handleDeleteMaterial = (materialId: string) => {
    error(`删除素材 ${materialId}`);
    // 这里可以添加删除素材的逻辑
  };

  const handleFAQ = () => {
    info('打开常见问题页面');
    // 这里可以添加跳转到FAQ页面的逻辑
  };

  const handleOnlineSupport = () => {
    info('连接在线客服');
    // 这里可以添加连接在线客服的逻辑
  };

  const handleFeedback = () => {
    info('打开意见反馈');
    // 这里可以添加打开意见反馈的逻辑
  };

  const handleCreateCampaign = () => {
    success('广告活动创建成功！');
    setShowCreateCampaign(false);
    // 这里可以添加创建广告活动的逻辑
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
            <h1 className="text-xl font-semibold text-gray-800">广告中心</h1>
          </div>
          <button 
            onClick={() => setShowCreateCampaign(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建广告
          </button>
        </div>

        {/* 标签切换 */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'campaigns'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            广告投放
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            数据分析
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tools'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            营销工具
          </button>
          <button
            onClick={() => setActiveTab('management')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'management'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            推广管理
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'campaigns' && (
          <div>
            {/* 概览卡片 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">活跃广告</span>
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{campaigns.filter(c => c.status === 'active').length}</div>
                <div className="text-sm text-green-600">+2 本周</div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">总预算</span>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">¥{campaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}</div>
                <div className="text-sm text-blue-600">已花费 ¥{campaigns.reduce((sum, c) => sum + c.spent, 0).toLocaleString()}</div>
              </div>
            </div>

            {/* 广告活动列表 */}
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-gray-800 mr-3">{campaign.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusText(campaign.status)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'active' ? (
                        <button 
                          onClick={() => handlePauseCampaign(campaign.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Pause className="w-4 h-4 text-gray-600" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handlePlayCampaign(campaign.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Play className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditCampaign(campaign.id)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">预算使用</div>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          ¥{campaign.spent.toLocaleString()} / ¥{campaign.budget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">投放时间</div>
                      <div className="text-sm font-medium text-gray-800">
                        {campaign.startDate} 至 {campaign.endDate}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-800">{campaign.impressions.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">展示量</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">{campaign.clicks.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">点击量</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">{campaign.ctr}%</div>
                      <div className="text-xs text-gray-600">点击率</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">¥{campaign.cpc}</div>
                      <div className="text-xs text-gray-600">单次点击</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            {/* 数据概览 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {analyticsData.map((data, index) => (
                <div key={index} className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{data.metric}</span>
                    {getTrendIcon(data.trend)}
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">
                    {data.metric.includes('率') || data.metric.includes('ROAS') ? 
                      `${data.value}${data.metric.includes('率') ? '%' : ''}` : 
                      data.value.toLocaleString()
                    }
                  </div>
                  <div className={`text-sm ${
                    data.change > 0 ? 'text-green-600' : data.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {data.change > 0 ? '+' : ''}{data.change}% 较上周
                  </div>
                </div>
              ))}
            </div>

            {/* 图表区域 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">投放趋势</h3>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleTimeFilter('7天')}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    7天
                  </button>
                  <button 
                    onClick={() => handleTimeFilter('30天')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg"
                  >
                    30天
                  </button>
                  <button 
                    onClick={() => handleTimeFilter('90天')}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    90天
                  </button>
                </div>
              </div>
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <div className="text-sm">投放趋势图表</div>
                </div>
              </div>
            </div>

            {/* 受众分析 */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">受众分析</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">年龄分布</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">18-24岁</span>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                        </div>
                        <span className="text-sm font-medium">35%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">25-34岁</span>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">35-44岁</span>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                        <span className="text-sm font-medium">20%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">地域分布</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">北京</span>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">上海</span>
                      <span className="text-sm font-medium">22%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">广州</span>
                      <span className="text-sm font-medium">18%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">深圳</span>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">其他</span>
                      <span className="text-sm font-medium">17%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div>
            {/* 工具分类 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">营销工具</h3>
                <button 
                  onClick={handleToolFilter}
                  className="flex items-center text-blue-600 text-sm hover:text-blue-700"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  筛选
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {marketingTools.map((tool) => (
                  <div key={tool.id} className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{tool.icon}</div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{tool.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getCategoryColor(tool.category)}`}>
                            {tool.category === 'automation' ? '自动化' :
                             tool.category === 'analytics' ? '分析' :
                             tool.category === 'creative' ? '创意' : '定向'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          tool.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <button 
                          onClick={() => handleToggleTool(tool.id, tool.isActive)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tool.isActive 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {tool.isActive ? '停用' : '启用'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 工具使用统计 */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">工具使用统计</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{marketingTools.filter(t => t.isActive).length}</div>
                  <div className="text-sm text-gray-600">已启用工具</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">85%</div>
                  <div className="text-sm text-gray-600">效率提升</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'management' && (
          <div>
            {/* 账户管理 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">账户管理</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">账户余额</div>
                  <div className="text-2xl font-bold text-gray-800 mb-2">¥12,580.50</div>
                  <button 
                    onClick={handleRecharge}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    充值
                  </button>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">本月消费</div>
                  <div className="text-2xl font-bold text-gray-800 mb-2">¥8,200.00</div>
                  <button 
                    onClick={handleViewBill}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    查看账单
                  </button>
                </div>
              </div>
            </div>

            {/* 素材管理 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">素材管理</h3>
                <button 
                  onClick={handleUploadMaterial}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  上传素材
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={`https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=advertisement%20creative%20design%20${item}&image_size=square`}
                      alt={`素材 ${item}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewMaterial(item.toString())}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => handleDownloadMaterial(item.toString())}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMaterial(item.toString())}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 客服支持 */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">客服支持</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleFAQ}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">常见问题</div>
                  <div className="text-sm text-gray-600 mt-1">查看广告投放相关的常见问题解答</div>
                </button>
                <button 
                  onClick={handleOnlineSupport}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">在线客服</div>
                  <div className="text-sm text-gray-600 mt-1">7x24小时在线客服支持</div>
                </button>
                <button 
                  onClick={handleFeedback}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">意见反馈</div>
                  <div className="text-sm text-gray-600 mt-1">提交您的宝贵意见和建议</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 创建广告弹窗 */}
      {showCreateCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">创建广告活动</h3>
              <button 
                onClick={() => setShowCreateCampaign(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Plus className="w-5 h-5 text-gray-600 rotate-45" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">活动名称</label>
                <input
                  type="text"
                  placeholder="输入广告活动名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">广告目标</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>提升品牌知名度</option>
                  <option>增加网站流量</option>
                  <option>促进应用安装</option>
                  <option>提高转化率</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">预算设置</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      placeholder="日预算"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="总预算"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">投放时间</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowCreateCampaign(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreateCampaign}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  创建活动
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}