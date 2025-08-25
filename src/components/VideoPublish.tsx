import { useState } from 'react';
import { 
  Globe, 
  Users, 
  Lock, 
  MapPin, 
  Hash, 
  AtSign, 
  MessageCircle, 
  Share2,
  X,
  Check,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import DraftStatusIndicator from './DraftStatusIndicator';

interface VideoPublishProps {
  videoData: any;
  onPublish: (publishData: any) => Promise<void> | void;
  onCancel: () => void;
}

export default function VideoPublish({ videoData, onPublish, onCancel }: VideoPublishProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'friends' | 'private'>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mentions, setMentions] = useState('');
  const [subtitleLanguage, setSubtitleLanguage] = useState('zh-CN');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showDraftMessage, setShowDraftMessage] = useState(false);





  const privacyOptions = [
    { value: 'public', icon: Globe, label: '公开', desc: '所有人都可以看到' },
    { value: 'friends', icon: Users, label: '朋友', desc: '仅关注的人可以看到' },
    { value: 'private', icon: Lock, label: '私密', desc: '仅自己可以看到' }
  ];

  const languages = [
    { code: 'zh-CN', name: '中文' },
    { code: 'en-US', name: 'English' },
    { code: 'ja-JP', name: '日本語' },
    { code: 'ko-KR', name: '한국어' },
    { code: 'es-ES', name: 'Español' },
    { code: 'fr-FR', name: 'Français' }
  ];





  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);
    
    try {
      const publishData = {
        ...videoData,
        title: title.trim(),
        description: description.trim(),
        privacyLevel,
        allowComments,
        allowSharing,
        location: location.trim(),
        hashtags: hashtags.split('#').filter(tag => tag.trim()).map(tag => tag.trim()),
        mentions: mentions.split('@').filter(mention => mention.trim()).map(mention => mention.trim()),
        subtitleLanguage,
        publishedAt: new Date().toISOString()
      };

      // 调用父组件的发布方法
      await onPublish(publishData);
      
    } catch (error) {
      console.error('发布失败:', error);
      const errorMessage = error instanceof Error ? error.message : '发布失败';
      
      // 检查是否是草稿保存的错误消息
      if (errorMessage.includes('已保存为草稿')) {
        setDraftSaved(true);
        setShowDraftMessage(true);
        setPublishError(errorMessage);
        
        // 3秒后隐藏草稿消息
        setTimeout(() => {
          setShowDraftMessage(false);
        }, 3000);
      } else {
        setPublishError(errorMessage);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // 手动保存为草稿
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    
    try {
      const publishData = {
        ...videoData,
        title: title.trim() || '未命名视频',
        description: description.trim(),
        privacyLevel,
        allowComments,
        allowSharing,
        location: location.trim(),
        hashtags: hashtags.split('#').filter(tag => tag.trim()).map(tag => tag.trim()),
        mentions: mentions.split('@').filter(mention => mention.trim()).map(mention => mention.trim()),
        subtitleLanguage
      };

      // 导入草稿服务
      const { databaseRecommendationService } = await import('../services/databaseRecommendationService');
      const draftId = await databaseRecommendationService.saveDraft(publishData);
      
      setDraftSaved(true);
      setShowDraftMessage(true);
      setPublishError(`视频已保存为草稿 (ID: ${draftId})`);
      
      // 3秒后隐藏消息
      setTimeout(() => {
        setShowDraftMessage(false);
      }, 3000);
      
    } catch (error) {
      console.error('保存草稿失败:', error);
      setPublishError('保存草稿失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 顶部操作栏 */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={onCancel}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
            disabled={isPublishing || isSavingDraft}
          >
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-white text-lg font-semibold">发布视频</h2>
          
          <div className="flex items-center space-x-2">
            {/* 保存草稿按钮 */}
            <button
              onClick={handleSaveDraft}
              disabled={isPublishing || isSavingDraft}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                isPublishing || isSavingDraft
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSavingDraft ? '保存中...' : '草稿'}</span>
            </button>
            
            {/* 发布按钮 */}
            <button
              onClick={handlePublish}
              disabled={isPublishing || isSavingDraft || !title.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isPublishing || isSavingDraft || !title.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isPublishing ? '发布中...' : '发布'}
            </button>
          </div>
        </div>
        
        {/* 错误/成功提示 */}
        {publishError && (
          <div className={`px-4 pb-3 flex items-center space-x-2 ${
            draftSaved ? 'text-green-400' : 'text-red-400'
          }`}>
            {draftSaved ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm">{publishError}</span>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto bg-black">
        <div className="p-4 space-y-6">
          {/* 草稿状态指示器 */}
          <div className="bg-gray-900 rounded-lg p-4">
            <DraftStatusIndicator variant="badge" />
          </div>
          
          {/* 标题输入 */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">标题 *</label>
            
            <input
              type="text"
              placeholder="添加标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:outline-none"
              maxLength={100}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {title.length}/100
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">描述</label>
            <textarea
              placeholder="分享你的想法..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {description.length}/500
            </div>
          </div>

          {/* 隐私设置 */}
          <div>
            <label className="block text-white text-sm font-medium mb-3">隐私设置</label>
            <div className="space-y-2">
              {privacyOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setPrivacyLevel(option.value as any)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                      privacyLevel === option.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      privacyLevel === option.value ? 'text-blue-400' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 text-left">
                      <div className={`font-medium ${
                        privacyLevel === option.value ? 'text-blue-400' : 'text-white'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-400">{option.desc}</div>
                    </div>
                    {privacyLevel === option.value && (
                      <Check className="w-5 h-5 text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 互动设置 */}
          <div>
            <label className="block text-white text-sm font-medium mb-3">互动设置</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-white">允许评论</span>
                </div>
                <button
                  onClick={() => setAllowComments(!allowComments)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    allowComments ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    allowComments ? 'translate-x-7' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Share2 className="w-5 h-5 text-gray-400" />
                  <span className="text-white">允许分享</span>
                </div>
                <button
                  onClick={() => setAllowSharing(!allowSharing)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    allowSharing ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    allowSharing ? 'translate-x-7' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* 位置信息 */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">位置</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="添加位置..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 话题标签 */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">话题标签</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="#话题1 #话题2"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* @提及 */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">提及用户</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="@用户1 @用户2"
                value={mentions}
                onChange={(e) => setMentions(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 字幕语言 */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">字幕语言</label>
            <select
              value={subtitleLanguage}
              onChange={(e) => setSubtitleLanguage(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 发布进度覆盖层 */}
      {isPublishing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">正在发布视频...</p>
            <p className="text-sm text-gray-400 mt-1">请稍候，正在处理您的内容</p>
          </div>
        </div>
      )}


    </div>
  );
}