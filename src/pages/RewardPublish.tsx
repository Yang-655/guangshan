import React, { useState } from 'react';
import { ArrowLeft, DollarSign, Shield, Clock, AlertTriangle, Info, Plus, Minus, FileText, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MediaUpload, { MediaFile } from '../components/MediaUpload';
import LoadingSpinner from '../components/LoadingSpinner';
import { ErrorDisplay } from '../components/ErrorBoundary';
import { useToast } from '../components/Toast';

interface RewardForm {
  title: string;
  description: string;
  category: string;
  location: string;
  deadline: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward: number;
  deposit: number;
  autoIncrease: boolean;
  increaseAmount: number;
  increaseInterval: number;
  maxReward: number;
  allowMultipleBids: boolean;
  tags: string[];
  requirementFiles: MediaFile[];
}

export default function RewardPublish() {
  const navigate = useNavigate();
  const { success, error: showError, warning } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showRules, setShowRules] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [form, setForm] = useState<RewardForm>({
    title: '',
    description: '',
    category: 'delivery',
    location: '',
    deadline: '',
    difficulty: 'easy',
    reward: 0,
    deposit: 0,
    autoIncrease: false,
    increaseAmount: 0,
    increaseInterval: 24,
    maxReward: 0,
    allowMultipleBids: true,
    tags: [],
    requirementFiles: []
  });

  const categories = [
    { id: 'delivery', name: '跑腿代购', icon: '🚚' },
    { id: 'design', name: '设计创作', icon: '🎨' },
    { id: 'tech', name: '技术开发', icon: '💻' },
    { id: 'writing', name: '文案写作', icon: '✍️' },
    { id: 'photography', name: '摄影拍照', icon: '📸' },
    { id: 'tutoring', name: '教学辅导', icon: '📚' },
    { id: 'cleaning', name: '清洁服务', icon: '🧹' },
    { id: 'other', name: '其他', icon: '🔧' }
  ];

  const handleInputChange = (field: keyof RewardForm, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // 自动计算质押金额（等于悬赏金额）
      if (field === 'reward') {
        updated.deposit = value;
        if (!updated.maxReward || updated.maxReward < value * 2) {
          updated.maxReward = value * 2;
        }
      }
      
      return updated;
    });
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showError('您的浏览器不支持地理定位功能');
      return;
    }

    setIsGettingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });
      
      const { latitude, longitude } = position.coords;
      // 这里可以调用地理编码API将坐标转换为地址
      // 暂时显示坐标信息
      const locationText = `纬度: ${latitude.toFixed(6)}, 经度: ${longitude.toFixed(6)}`;
      handleInputChange('location', locationText);
      success('位置获取成功');
    } catch (error) {
      console.error('获取位置失败:', error);
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            showError('位置权限被拒绝，请在浏览器设置中允许位置访问');
            break;
          case error.POSITION_UNAVAILABLE:
            showError('位置信息不可用，请检查GPS设置');
            break;
          case error.TIMEOUT:
            showError('获取位置超时，请重试');
            break;
          default:
            showError('获取位置失败，请重试');
        }
      } else {
        showError('获取位置失败，请重试');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    // 验证必填字段
    if (!form.title || !form.description || !form.reward || !form.location || !form.deadline) {
      showError('请填写所有必填字段');
      return;
    }
    
    if (form.reward <= 0) {
      showError('悬赏金额必须大于0');
      return;
    }
    
    if (form.reward < 10) {
      warning('悬赏金额较低，可能影响任务完成效果');
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // 模拟API调用
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // 模拟随机失败
          if (Math.random() > 0.8) {
            reject(new Error('网络连接失败，请重试'));
          } else {
            resolve(true);
          }
        }, 2000);
      });
      
      console.log('发布悬赏任务:', form);
      success('悬赏任务发布成功！');
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/reward');
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发布失败，请重试';
      setSubmitError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepValidation = (step: number) => {
    switch (step) {
      case 1:
        return form.title && form.description && form.location && form.deadline;
      case 2:
        return form.reward > 0;
      case 3:
        return true; // 第三步主要是确认，没有额外必填字段
      default:
        return false;
    }
  };

  const canProceedToNextStep = () => {
    return getStepValidation(currentStep);
  };

  const canSubmit = () => {
    return form.title && form.description && form.reward > 0 && form.location && form.deadline;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">基本信息</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="请输入任务标题"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  !form.title && currentStep > 1 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {!form.title && currentStep > 1 && (
                <p className="text-red-500 text-xs mt-1">请输入任务标题</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="详细描述任务要求、交付标准等"
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  !form.description && currentStep > 1 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {!form.description && currentStep > 1 && (
                <p className="text-red-500 text-xs mt-1">请输入任务描述</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">任务分类</label>
              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleInputChange('category', category.id)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                      form.category === category.id
                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务地点 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="如：线上远程、市中心等"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      !form.location && currentStep > 1 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="获取当前位置"
                  >
                    {isGettingLocation ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {!form.location && currentStep > 1 && (
                  <p className="text-red-500 text-xs mt-1">请输入任务地点</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  截止时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    !form.deadline && currentStep > 1 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {!form.deadline && currentStep > 1 && (
                  <p className="text-red-500 text-xs mt-1">请选择截止时间</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">任务难度</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'easy', label: '简单', color: 'green' },
                  { value: 'medium', label: '中等', color: 'yellow' },
                  { value: 'hard', label: '困难', color: 'red' }
                ].map((difficulty) => (
                  <button
                    key={difficulty.value}
                    onClick={() => handleInputChange('difficulty', difficulty.value)}
                    className={`flex-1 min-w-0 px-4 py-2 rounded-lg border transition-colors ${
                      form.difficulty === difficulty.value
                        ? `bg-${difficulty.color}-100 border-${difficulty.color}-300 text-${difficulty.color}-700`
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {difficulty.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 任务要求文件上传 */}
            <MediaUpload
              onFilesChange={(files) => setForm(prev => ({ ...prev, requirementFiles: files }))}
              maxFiles={10}
              maxSize={50}
              label="任务要求文件"
              className="mt-6"
            />
            <div className="text-xs text-gray-500 mt-2">
              <p>• 可上传图片、视频或办公文档来说明任务要求</p>
              <p>• 支持格式：JPG、PNG、GIF、MP4、MOV、AVI、PPT、Word、Excel</p>
              <p>• 例如：参考样式、具体位置、期望效果、需求文档等</p>
              <p>• 最多上传10个文件，办公文档最大200MB，其他文件最大50MB</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">悬赏设置</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">质押机制说明</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    为保障接单者权益，发布悬赏需要质押等额资金。任务完成后质押金将自动退还。
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">悬赏金额</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={form.reward}
                  onChange={(e) => handleInputChange('reward', Number(e.target.value))}
                  placeholder="0"
                  min="1"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">质押金额</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={form.deposit}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">质押金额自动等于悬赏金额</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">启用自动加价</label>
                <button
                  onClick={() => handleInputChange('autoIncrease', !form.autoIncrease)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.autoIncrease ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.autoIncrease ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {form.autoIncrease && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">每次加价金额</label>
                      <input
                        type="number"
                        value={form.increaseAmount}
                        onChange={(e) => handleInputChange('increaseAmount', Number(e.target.value))}
                        placeholder="0"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">加价间隔（小时）</label>
                      <input
                        type="number"
                        value={form.increaseInterval}
                        onChange={(e) => handleInputChange('increaseInterval', Number(e.target.value))}
                        placeholder="24"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">最高悬赏金额</label>
                    <input
                      type="number"
                      value={form.maxReward}
                      onChange={(e) => handleInputChange('maxReward', Number(e.target.value))}
                      placeholder="0"
                      min={form.reward}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">允许多人竞标</label>
                <p className="text-xs text-gray-500">开启后，多人可同时申请并给出报价</p>
              </div>
              <button
                onClick={() => handleInputChange('allowMultipleBids', !form.allowMultipleBids)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.allowMultipleBids ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.allowMultipleBids ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">标签和规则</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">任务标签</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-purple-500 hover:text-purple-700"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="添加标签"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 mb-2">悬赏任务规则</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 发布任务需要质押等额资金作为保证金</li>
                      <li>• 任务完成并确认后，质押金自动退还</li>
                      <li>• 接单者需要在规定时间内完成任务</li>
                      <li>• 未按时完成任务将扣除信誉分</li>
                      <li>• 连续3次未完成任务将被禁止接单</li>
                      <li>• 雇主有权选择最合适的接单者</li>
                      <li>• 任务纠纷可申请平台仲裁</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/reward/rules')}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">详细规则</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">费用明细</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">悬赏金额:</span>
                  <span className="font-medium">¥{form.reward}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">质押金额:</span>
                  <span className="font-medium">¥{form.deposit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">平台服务费 (5%):</span>
                  <span className="font-medium">¥{(form.reward * 0.05).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span>总计需要支付:</span>
                  <span className="text-purple-600">¥{(form.reward + form.deposit + form.reward * 0.05).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
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
            <h1 className="text-xl font-bold text-gray-900">发布悬赏</h1>
          </div>
          <div className="text-sm text-gray-500">
            {currentStep}/3
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="px-4 pb-4">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      step < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>基本信息</span>
            <span>悬赏设置</span>
            <span>确认发布</span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4 pb-32 max-md:pb-40 max-sm:pb-44">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderStepContent()}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe max-md:pb-28 max-sm:pb-32 z-50">
        <div className="flex space-x-3">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              上一步
            </button>
          )}
          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNextStep()}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  发布中...
                </>
              ) : (
                '发布悬赏'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}