import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Download, Play, Pause, RotateCcw, Save, Trash2, Edit3, Globe, Volume2, VolumeX, Settings, FileText, Video, Mic, Languages, Clock, User, Calendar, Search, Filter, MoreHorizontal, CheckSquare, Square, Eye, Share, Copy, Archive, Tag, SortAsc, SortDesc, RefreshCw, X, Plus, Folder, Star, AlertCircle, Brain, Palette, Type } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SubtitleFile {
  id: string;
  name: string;
  language: string;
  duration: string;
  size: string;
  createdAt: string;
  isAIGenerated: boolean;
}

interface LanguagePair {
  from: string;
  to: string;
  accuracy: number;
}

const SubtitleCenter: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('files');
  const [selectedLanguage, setSelectedLanguage] = useState('zh-CN');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [voiceRecognition, setVoiceRecognition] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('list');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [exportFormat, setExportFormat] = useState('srt');
  const [exportOptions, setExportOptions] = useState({
    includeTimestamps: true,
    includeTranslations: true,
    includeMetadata: false
  });

  // 模拟字幕文件数据
  const subtitleFiles: SubtitleFile[] = [
    {
      id: '1',
      name: '我的第一个视频',
      language: '中文',
      duration: '2:30',
      size: '2.1KB',
      createdAt: '2024-01-15',
      isAIGenerated: true
    },
    {
      id: '2',
      name: '英语学习视频',
      language: 'English',
      duration: '5:45',
      size: '4.8KB',
      createdAt: '2024-01-14',
      isAIGenerated: true
    },
    {
      id: '3',
      name: '日语对话练习',
      language: '日本語',
      duration: '3:20',
      size: '3.2KB',
      createdAt: '2024-01-13',
      isAIGenerated: false
    }
  ];

  const mockSubtitles = [
    {
      id: '1',
      title: '旅行Vlog - 巴黎之旅',
      videoUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=paris%20travel%20vlog%20video&image_size=landscape_16_9',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=paris%20eiffel%20tower%20travel&image_size=landscape_16_9',
      duration: '05:32',
      language: 'zh-CN',
      targetLanguages: ['en', 'ja', 'ko'],
      status: 'completed',
      accuracy: 95,
      createdAt: '2024-01-15',
      author: '旅行达人',
      category: 'travel',
      tags: ['旅行', '巴黎', 'vlog'],
      isStarred: true,
      fileSize: '2.3 MB',
      subtitles: [
        { start: 0, end: 3, text: '大家好，欢迎来到我的巴黎旅行Vlog' },
        { start: 3, end: 7, text: '今天我们要去参观著名的埃菲尔铁塔' },
        { start: 7, end: 12, text: '这里的风景真的太美了，让我们一起来看看吧' }
      ]
    },
    {
      id: '2',
      title: '美食制作教程',
      videoUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20tutorial%20video&image_size=landscape_16_9',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20food%20preparation&image_size=landscape_16_9',
      duration: '08:45',
      language: 'zh-CN',
      targetLanguages: ['en', 'es'],
      status: 'processing',
      accuracy: 0,
      createdAt: '2024-01-14',
      author: '美食家小王',
      category: 'food',
      tags: ['美食', '教程', '烹饪'],
      isStarred: false,
      fileSize: '4.1 MB',
      subtitles: []
    },
    {
      id: '3',
      title: '科技产品评测',
      videoUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20product%20review%20video&image_size=landscape_16_9',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=technology%20gadget%20review&image_size=landscape_16_9',
      duration: '12:18',
      language: 'en',
      targetLanguages: ['zh-CN', 'ja'],
      status: 'failed',
      accuracy: 0,
      createdAt: '2024-01-13',
      author: 'TechReviewer',
      category: 'tech',
      tags: ['科技', '评测', '数码'],
      isStarred: false,
      fileSize: '8.7 MB',
      subtitles: []
    },
    {
      id: '4',
      title: '音乐MV制作幕后',
      videoUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=music%20mv%20behind%20scenes&image_size=landscape_16_9',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=music%20video%20production&image_size=landscape_16_9',
      duration: '15:22',
      language: 'zh-CN',
      targetLanguages: ['en', 'ko', 'ja'],
      status: 'completed',
      accuracy: 88,
      createdAt: '2024-01-12',
      author: '音乐制作人',
      category: 'music',
      tags: ['音乐', 'MV', '制作'],
      isStarred: true,
      fileSize: '12.5 MB',
      subtitles: [
        { start: 0, end: 4, text: '今天带大家看看MV的制作过程' },
        { start: 4, end: 8, text: '从前期策划到后期制作的每一个环节' }
      ]
    },
    {
      id: '5',
      title: '健身训练指导',
      videoUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=fitness%20training%20workout&image_size=landscape_16_9',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=gym%20workout%20exercise&image_size=landscape_16_9',
      duration: '20:15',
      language: 'en',
      targetLanguages: ['zh-CN', 'es', 'fr'],
      status: 'pending',
      accuracy: 0,
      createdAt: '2024-01-11',
      author: 'FitnessCoach',
      category: 'fitness',
      tags: ['健身', '训练', '运动'],
      isStarred: false,
      fileSize: '18.9 MB',
      subtitles: []
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20';
      case 'processing': return 'bg-yellow-500/20';
      case 'failed': return 'bg-red-500/20';
      case 'pending': return 'bg-blue-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '处理中';
      case 'failed': return '失败';
      case 'pending': return '等待中';
      default: return '未知';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'travel': return '旅行';
      case 'food': return '美食';
      case 'tech': return '科技';
      case 'music': return '音乐';
      case 'fitness': return '健身';
      default: return '其他';
    }
  };

  const getLanguageText = (lang: string) => {
    switch (lang) {
      case 'zh-CN': return '中文';
      case 'en': return '英文';
      case 'ja': return '日文';
      case 'ko': return '韩文';
      case 'es': return '西班牙文';
      case 'fr': return '法文';
      default: return lang;
    }
  };

  const filteredSubtitles = mockSubtitles.filter(subtitle => {
    const matchesSearch = subtitle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         subtitle.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         subtitle.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || subtitle.status === filterStatus;
    const matchesLanguage = filterLanguage === 'all' || subtitle.language === filterLanguage;
    const matchesType = filterType === 'all' || subtitle.category === filterType;
    
    return matchesSearch && matchesStatus && matchesLanguage && matchesType;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'duration':
        const aDuration = a.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
        const bDuration = b.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
        comparison = bDuration - aDuration;
        break;
      case 'accuracy':
        comparison = b.accuracy - a.accuracy;
        break;
      case 'size':
        const aSize = parseFloat(a.fileSize);
        const bSize = parseFloat(b.fileSize);
        comparison = bSize - aSize;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'desc' ? comparison : -comparison;
  });

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredSubtitles.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredSubtitles.map(item => item.id));
    }
  };

  const handleBatchDelete = () => {
    console.log('批量删除:', selectedItems);
    setSelectedItems([]);
    setShowBatchActions(false);
    toast.success('已删除选中的字幕文件');
  };

  const handleBatchExport = () => {
    setShowExportModal(true);
  };

  const handleBatchArchive = () => {
    console.log('批量归档:', selectedItems);
    setSelectedItems([]);
    setShowBatchActions(false);
    toast.success('已归档选中的字幕文件');
  };

  const handleExport = () => {
    console.log('导出字幕:', {
      items: selectedItems,
      format: exportFormat,
      options: exportOptions
    });
    setShowExportModal(false);
    setSelectedItems([]);
    toast.success('字幕文件导出成功');
  };

  const toggleStar = (id: string) => {
    console.log('切换收藏:', id);
    toast.success('已更新收藏状态');
  };

  // 新增事件处理函数
  const handleImportSubtitle = () => {
    toast.success('打开字幕导入窗口');
  };

  const handleExportAll = () => {
    toast.success('导出全部字幕文件');
  };

  // 支持的语言
  const languages = [
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ];

  // 翻译准确度数据
  const translationAccuracy: LanguagePair[] = [
    { from: '中文', to: 'English', accuracy: 95 },
    { from: 'English', to: '中文', accuracy: 93 },
    { from: '中文', to: '日本語', accuracy: 88 },
    { from: 'English', to: '日本語', accuracy: 90 }
  ];

  const tabs = [
    { id: 'files', label: '字幕文件', icon: Type },
    { id: 'languages', label: '语言设置', icon: Languages },
    { id: 'ai', label: 'AI功能', icon: Brain },
    { id: 'settings', label: '显示设置', icon: Settings }
  ];

  const renderFilesTab = () => (
    <div className="space-y-4">
      {/* 搜索和筛选栏 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">我的字幕文件</h3>
          <div className="flex gap-2">
            <button 
              onClick={handleImportSubtitle}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Upload size={16} />
              导入字幕
            </button>
            <button 
              onClick={handleExportAll}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              导出全部
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索字幕文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilterPanel ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>筛选</span>
          </button>
          
          {/* 排序 */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date-desc">最新创建</option>
            <option value="date-asc">最早创建</option>
            <option value="title-asc">标题 A-Z</option>
            <option value="title-desc">标题 Z-A</option>
            <option value="duration-desc">时长最长</option>
            <option value="duration-asc">时长最短</option>
            <option value="accuracy-desc">准确率最高</option>
            <option value="size-desc">文件最大</option>
          </select>
          
          {/* 视图切换 */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Folder className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* 筛选面板 */}
        {showFilterPanel && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部状态</option>
                  <option value="completed">已完成</option>
                  <option value="processing">处理中</option>
                  <option value="failed">失败</option>
                  <option value="pending">等待中</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">语言</label>
                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部语言</option>
                  <option value="zh-CN">中文</option>
                  <option value="en">英文</option>
                  <option value="ja">日文</option>
                  <option value="ko">韩文</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部类型</option>
                  <option value="travel">旅行</option>
                  <option value="food">美食</option>
                  <option value="tech">科技</option>
                  <option value="music">音乐</option>
                  <option value="fitness">健身</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 批量操作栏 */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-800">
                已选择 {selectedItems.length} 个文件
              </span>
              <button
                onClick={() => setSelectedItems([])}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                取消选择
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBatchExport}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>导出</span>
              </button>
              
              <button
                onClick={handleBatchArchive}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <Archive className="w-4 h-4" />
                <span>归档</span>
              </button>
              
              <button
                onClick={handleBatchDelete}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 字幕文件列表 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 表头 */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSelectAll}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {selectedItems.length === filteredSubtitles.length && filteredSubtitles.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-500" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            
            <div className="flex-1 grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-1">标题</div>
              <div className="col-span-1">状态</div>
              <div className="col-span-1">语言</div>
              <div className="col-span-1">时长</div>
              <div className="col-span-1">准确率</div>
              <div className="col-span-1">操作</div>
            </div>
          </div>
        </div>
        
        {/* 文件列表 */}
        <div className="divide-y divide-gray-200">
          {filteredSubtitles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>没有找到匹配的字幕文件</p>
              <p className="text-sm mt-1">尝试调整搜索条件或筛选器</p>
            </div>
          ) : (
            filteredSubtitles.map(subtitle => (
              <div key={subtitle.id} className={`p-4 hover:bg-gray-50 transition-colors ${
                selectedItems.includes(subtitle.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleSelectItem(subtitle.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {selectedItems.includes(subtitle.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  
                  <img 
                    src={subtitle.thumbnail} 
                    alt={subtitle.title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  
                  <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                    {/* 标题列 */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium truncate">{subtitle.title}</h3>
                        {subtitle.isStarred && (
                          <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{getCategoryText(subtitle.category)}</span>
                        <div className="flex space-x-1">
                          {subtitle.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* 状态列 */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusBg(subtitle.status)} ${getStatusColor(subtitle.status)}`}>
                          {getStatusText(subtitle.status)}
                        </span>
                        {subtitle.status === 'processing' && (
                          <RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" />
                        )}
                        {subtitle.status === 'failed' && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                      {subtitle.status === 'completed' && (
                        <div className="text-xs text-green-600 mt-1">{subtitle.accuracy}% 准确率</div>
                      )}
                    </div>
                    
                    {/* 语言列 */}
                    <div className="col-span-1">
                      <div className="text-sm">{getLanguageText(subtitle.language)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        → {subtitle.targetLanguages.map(lang => getLanguageText(lang)).join(', ')}
                      </div>
                    </div>
                    
                    {/* 时长列 */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Clock className="w-3 h-3" />
                        <span>{subtitle.duration}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{subtitle.fileSize}</div>
                    </div>
                    
                    {/* 准确率列 */}
                    <div className="col-span-1">
                      {subtitle.status === 'completed' ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${subtitle.accuracy}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-green-600">{subtitle.accuracy}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {subtitle.author} · {subtitle.createdAt}
                      </div>
                    </div>
                    
                    {/* 操作列 */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleStar(subtitle.id)}
                          className={`p-1 rounded transition-colors ${
                            subtitle.isStarred 
                              ? 'text-yellow-500 hover:text-yellow-600' 
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                        >
                          <Star className="w-3 h-3" />
                        </button>
                        
                        {subtitle.status === 'completed' && (
                          <>
                            <button className="text-blue-500 hover:text-blue-600 p-1 hover:bg-blue-50 rounded transition-colors">
                              <Download className="w-3 h-3" />
                            </button>
                            <button className="text-green-500 hover:text-green-600 p-1 hover:bg-green-50 rounded transition-colors">
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button className="text-purple-500 hover:text-purple-600 p-1 hover:bg-purple-50 rounded transition-colors">
                              <Share className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        
                        {subtitle.status === 'failed' && (
                          <button className="text-yellow-500 hover:text-yellow-600 p-1 hover:bg-yellow-50 rounded transition-colors">
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                        
                        <button className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                        
                        <button className="text-red-500 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* 导出模态框 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">导出字幕文件</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="srt">SRT (SubRip)</option>
                  <option value="vtt">VTT (WebVTT)</option>
                  <option value="ass">ASS (Advanced SSA)</option>
                  <option value="txt">TXT (纯文本)</option>
                  <option value="json">JSON (结构化数据)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">导出选项</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTimestamps}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">包含时间戳</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTranslations}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeTranslations: e.target.checked }))}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">包含翻译</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">包含元数据</span>
                  </label>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <div className="text-sm text-gray-700 mb-2">将导出以下文件：</div>
                <div className="text-xs text-gray-500">
                  {selectedItems.length} 个字幕文件 · {exportFormat.toUpperCase()} 格式
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>导出</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLanguagesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">支持的语言</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {languages.map(lang => (
            <div
              key={lang.code}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedLanguage === lang.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedLanguage(lang.code)}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{lang.flag}</div>
                <div className="text-sm font-medium">{lang.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">翻译准确度</h3>
        <div className="space-y-3">
          {translationAccuracy.map((pair, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{pair.from}</span>
                  <Globe size={16} className="text-gray-400" />
                  <span className="font-medium">{pair.to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pair.accuracy}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-green-600">{pair.accuracy}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAITab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="text-purple-600" size={20} />
          <h3 className="text-lg font-semibold text-purple-800">AI智能功能</h3>
        </div>
        <p className="text-purple-700 text-sm">利用先进的AI技术，为您提供智能字幕生成和翻译服务</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Mic className="text-blue-500" size={20} />
              <div>
                <h4 className="font-medium">智能语音识别</h4>
                <p className="text-sm text-gray-500">自动将语音转换为字幕文本</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={voiceRecognition}
                onChange={(e) => setVoiceRecognition(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Globe className="text-green-500" size={20} />
              <div>
                <h4 className="font-medium">自动翻译</h4>
                <p className="text-sm text-gray-500">实时翻译字幕到多种语言</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Star className="text-orange-500" size={20} />
              <div>
                <h4 className="font-medium">离线AI处理</h4>
                <p className="text-sm text-gray-500">本地处理，保护隐私安全</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={offlineMode}
                onChange={(e) => setOfflineMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Star className="text-yellow-600" size={16} />
          <span className="font-medium text-yellow-800">隐私保护</span>
        </div>
        <p className="text-yellow-700 text-sm">
          所有AI处理优先在本地设备上进行，确保您的语音和文本数据不会上传到服务器，最大程度保护您的隐私安全。
        </p>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">字幕显示设置</h3>
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Type className="text-blue-500" size={20} />
              <h4 className="font-medium">字体设置</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">字体大小</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option>12px</option>
                  <option>14px</option>
                  <option selected>16px</option>
                  <option>18px</option>
                  <option>20px</option>
                  <option>24px</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">字体粗细</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option>细体</option>
                  <option selected>正常</option>
                  <option>粗体</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Palette className="text-purple-500" size={20} />
              <h4 className="font-medium">颜色设置</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">字体颜色</label>
                <div className="flex gap-2">
                  {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map(color => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">背景颜色</label>
                <div className="flex gap-2">
                  {['rgba(0,0,0,0.7)', 'rgba(255,255,255,0.7)', 'rgba(0,0,255,0.7)', 'rgba(255,0,0,0.7)'].map((color, index) => (
                    <button
                      key={index}
                      className="w-8 h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Settings className="text-gray-500" size={20} />
              <h4 className="font-medium">位置设置</h4>
            </div>
            <div className="flex gap-3">
              {['顶部', '中间', '底部'].map(position => (
                <button
                  key={position}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    position === '底部'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {position}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold">AI字幕中心</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">智能字幕生成与管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="text-purple-500 w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-3 sm:p-4 pb-safe max-md:pb-24 max-sm:pb-28">
        {activeTab === 'files' && renderFilesTab()}
        {activeTab === 'languages' && renderLanguagesTab()}
        {activeTab === 'ai' && renderAITab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default SubtitleCenter;