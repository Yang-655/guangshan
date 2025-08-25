import React, { useState } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, Share, DollarSign, Calendar, Filter, Download, RefreshCw, PieChart, LineChart, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  revenue: number;
  growth: {
    users: number;
    views: number;
    revenue: number;
  };
}

interface ContentMetrics {
  id: string;
  title: string;
  type: 'video' | 'live' | 'post';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  duration: string;
  publishedAt: string;
  engagement: number;
}

interface UserDemographic {
  ageGroup: string;
  percentage: number;
  count: number;
}

interface RevenueData {
  date: string;
  ads: number;
  gifts: number;
  premium: number;
  total: number;
}

export default function AnalyticsCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'users' | 'revenue'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // 模拟分析数据
  const analyticsData: AnalyticsData = {
    totalUsers: 125680,
    activeUsers: 89420,
    newUsers: 3240,
    totalViews: 2456780,
    totalLikes: 456890,
    totalComments: 123450,
    totalShares: 67890,
    revenue: 89650,
    growth: {
      users: 12.5,
      views: 18.3,
      revenue: 24.7
    }
  };

  // 模拟内容指标
  const contentMetrics: ContentMetrics[] = [
    {
      id: 'V001',
      title: '春季穿搭分享',
      type: 'video',
      views: 45680,
      likes: 3240,
      comments: 567,
      shares: 234,
      duration: '2:34',
      publishedAt: '2024-01-15',
      engagement: 8.9
    },
    {
      id: 'L001',
      title: '美食制作直播',
      type: 'live',
      views: 23450,
      likes: 1890,
      comments: 890,
      shares: 156,
      duration: '1:45:20',
      publishedAt: '2024-01-14',
      engagement: 12.3
    },
    {
      id: 'V002',
      title: '旅行Vlog',
      type: 'video',
      views: 34560,
      likes: 2340,
      comments: 456,
      shares: 189,
      duration: '5:12',
      publishedAt: '2024-01-13',
      engagement: 8.6
    },
    {
      id: 'P001',
      title: '生活感悟分享',
      type: 'post',
      views: 12340,
      likes: 890,
      comments: 234,
      shares: 67,
      duration: '-',
      publishedAt: '2024-01-12',
      engagement: 9.7
    }
  ];

  // 模拟用户画像数据
  const userDemographics: UserDemographic[] = [
    { ageGroup: '18-24', percentage: 35, count: 43988 },
    { ageGroup: '25-34', percentage: 28, count: 35190 },
    { ageGroup: '35-44', percentage: 22, count: 27650 },
    { ageGroup: '45-54', percentage: 10, count: 12568 },
    { ageGroup: '55+', percentage: 5, count: 6284 }
  ];

  // 模拟收益数据
  const revenueData: RevenueData[] = [
    { date: '01-01', ads: 2340, gifts: 1890, premium: 890, total: 5120 },
    { date: '01-02', ads: 2560, gifts: 2100, premium: 950, total: 5610 },
    { date: '01-03', ads: 2890, gifts: 2340, premium: 1020, total: 6250 },
    { date: '01-04', ads: 3120, gifts: 2560, premium: 1150, total: 6830 },
    { date: '01-05', ads: 2780, gifts: 2230, premium: 980, total: 5990 },
    { date: '01-06', ads: 3340, gifts: 2890, premium: 1280, total: 7510 },
    { date: '01-07', ads: 3560, gifts: 3120, premium: 1340, total: 8020 }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getGrowthColor = (growth: number): string => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getEngagementColor = (engagement: number): string => {
    if (engagement >= 10) return 'text-green-600';
    if (engagement >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Eye className="w-4 h-4" />;
      case 'live': return <Activity className="w-4 h-4" />;
      case 'post': return <MessageCircle className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getTypeText = (type: string): string => {
    switch (type) {
      case 'video': return '视频';
      case 'live': return '直播';
      case 'post': return '动态';
      default: return '未知';
    }
  };

  // 事件处理函数
  const handleRefresh = () => {
    toast.success('数据已刷新');
  };

  const handleDownload = () => {
    toast.success('报告下载中...');
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
            <h1 className="text-xl font-semibold text-gray-800">数据分析中心</h1>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">最近7天</option>
              <option value="30d">最近30天</option>
              <option value="90d">最近90天</option>
              <option value="1y">最近1年</option>
            </select>
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            总览
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'content'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            内容分析
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            用户画像
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'revenue'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            收益报告
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div>
            {/* 核心指标 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">总用户数</span>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{formatNumber(analyticsData.totalUsers)}</div>
                <div className={`text-sm ${getGrowthColor(analyticsData.growth.users)}`}>
                  +{analyticsData.growth.users}% 较上期
                </div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">活跃用户</span>
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{formatNumber(analyticsData.activeUsers)}</div>
                <div className="text-sm text-gray-500">
                  {((analyticsData.activeUsers / analyticsData.totalUsers) * 100).toFixed(1)}% 活跃率
                </div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">总播放量</span>
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{formatNumber(analyticsData.totalViews)}</div>
                <div className={`text-sm ${getGrowthColor(analyticsData.growth.views)}`}>
                  +{analyticsData.growth.views}% 较上期
                </div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">总收益</span>
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">¥{formatNumber(analyticsData.revenue)}</div>
                <div className={`text-sm ${getGrowthColor(analyticsData.growth.revenue)}`}>
                  +{analyticsData.growth.revenue}% 较上期
                </div>
              </div>
            </div>

            {/* 互动数据 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">互动数据</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="text-xl font-bold text-gray-800">{formatNumber(analyticsData.totalLikes)}</div>
                  <div className="text-sm text-gray-600">点赞数</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MessageCircle className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-xl font-bold text-gray-800">{formatNumber(analyticsData.totalComments)}</div>
                  <div className="text-sm text-gray-600">评论数</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Share className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="text-xl font-bold text-gray-800">{formatNumber(analyticsData.totalShares)}</div>
                  <div className="text-sm text-gray-600">分享数</div>
                </div>
              </div>
            </div>

            {/* 趋势图表 */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">增长趋势</h3>
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">趋势图表</p>
                  <p className="text-sm text-gray-400">集成图表库后显示</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            {/* 内容表现排行 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">内容表现排行</h3>
              <div className="space-y-4">
                {contentMetrics.map((content, index) => (
                  <div key={content.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          {getTypeIcon(content.type)}
                          <span className="ml-1 text-xs text-gray-500">{getTypeText(content.type)}</span>
                          <span className="ml-2 font-medium text-gray-800">{content.title}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {content.publishedAt} · {content.duration !== '-' ? content.duration : '图文'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800">{formatNumber(content.views)} 播放</div>
                      <div className={`text-xs ${getEngagementColor(content.engagement)}`}>
                        {content.engagement}% 互动率
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 内容类型分析 */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">内容类型分析</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">短视频</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">直播</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">图文动态</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            {/* 用户增长 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">用户增长</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{formatNumber(analyticsData.newUsers)}</div>
                  <div className="text-sm text-gray-600">新增用户</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{formatNumber(analyticsData.activeUsers)}</div>
                  <div className="text-sm text-gray-600">活跃用户</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {((analyticsData.activeUsers / analyticsData.totalUsers) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">留存率</div>
                </div>
              </div>
            </div>

            {/* 年龄分布 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">年龄分布</h3>
              <div className="space-y-3">
                {userDemographics.map((demo) => (
                  <div key={demo.ageGroup} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{demo.ageGroup}岁</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${demo.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12">{demo.percentage}%</span>
                      <span className="text-xs text-gray-500 w-16">{formatNumber(demo.count)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 地域分布 */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">地域分布</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">北京</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">上海</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">广州</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">深圳</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                    <span className="text-sm font-medium">12%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">其他</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '28%' }}></div>
                    </div>
                    <span className="text-sm font-medium">28%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div>
            {/* 收益概览 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">总收益</span>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">¥{formatNumber(analyticsData.revenue)}</div>
                <div className={`text-sm ${getGrowthColor(analyticsData.growth.revenue)}`}>
                  +{analyticsData.growth.revenue}% 较上期
                </div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">日均收益</span>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">¥{(analyticsData.revenue / 30).toFixed(0)}</div>
                <div className="text-sm text-gray-500">过去30天平均</div>
              </div>
            </div>

            {/* 收益来源 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">收益来源</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">广告收益</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '55%' }}></div>
                    </div>
                    <span className="text-sm font-medium">55%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">礼物打赏</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">会员订阅</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 收益趋势 */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">收益趋势</h3>
              <div className="space-y-3">
                {revenueData.slice(-7).map((data) => (
                  <div key={data.date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{data.date}</span>
                    <div className="flex items-center space-x-4">
                      <div className="text-xs text-gray-500">
                        广告: ¥{data.ads}
                      </div>
                      <div className="text-xs text-gray-500">
                        礼物: ¥{data.gifts}
                      </div>
                      <div className="text-xs text-gray-500">
                        会员: ¥{data.premium}
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        ¥{data.total}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}