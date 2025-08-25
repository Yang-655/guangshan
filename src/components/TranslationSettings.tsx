import React, { useState, useEffect } from 'react';
import { Languages, Settings, ToggleLeft, ToggleRight, Volume2, MessageCircle, Subtitles, Globe, MapPin, Monitor, History, Zap } from 'lucide-react';
import { translationService } from '../utils/translationService';

interface TranslationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TranslationConfig;
  onSettingsChange: (settings: TranslationConfig) => void;
}

export interface TranslationConfig {
  enabled: boolean;
  danmakuTranslation: boolean;
  voiceTranslation: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  showOriginal: boolean;
  autoDetect: boolean;
  translationSpeed: 'fast' | 'accurate';
  displayMode: 'overlay' | 'side' | 'bottom';
}

const TranslationSettings: React.FC<TranslationSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<TranslationConfig>(settings);
  const [smartRecommendation, setSmartRecommendation] = useState<any>(null);
  const [showSmartPanel, setShowSmartPanel] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 获取智能推荐
      const recommendation = translationService.getSmartLanguageRecommendation();
      setSmartRecommendation(recommendation);
      
      // 检查是否为首次用户
      setIsFirstTimeUser(translationService.isFirstTimeUser());
      
      // 如果是首次用户，自动应用智能推荐
      if (translationService.isFirstTimeUser()) {
        const autoConfig = translationService.getAutoLanguageConfig();
        const newSettings = {
          ...localSettings,
          sourceLanguage: autoConfig.sourceLanguage,
          targetLanguage: autoConfig.targetLanguage
        };
        setLocalSettings(newSettings);
        onSettingsChange(newSettings);
      }
    }
  }, [isOpen]);

  const languages = [
    { code: 'auto', name: '自动检测', flag: '🌐' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
  ];

  const updateSetting = (key: keyof TranslationConfig, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  // 应用智能推荐
  const applySmartRecommendation = () => {
    if (smartRecommendation) {
      const newSettings = {
        ...localSettings,
        sourceLanguage: smartRecommendation.recommendedSource,
        targetLanguage: smartRecommendation.recommendedTarget
      };
      setLocalSettings(newSettings);
      onSettingsChange(newSettings);
      setShowSmartPanel(false);
    }
  };

  // 获取推荐原因的显示文本
  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'geolocation': return '基于您的地理位置';
      case 'system': return '基于您的系统语言';
      case 'history': return '基于您的使用历史';
      default: return '智能推荐';
    }
  };

  // 获取推荐原因的图标
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'geolocation': return <MapPin className="w-4 h-4" />;
      case 'system': return <Monitor className="w-4 h-4" />;
      case 'history': return <History className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const ToggleButton: React.FC<{ enabled: boolean; onClick: () => void; children: React.ReactNode }> = ({ enabled, onClick, children }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${
        enabled ? 'bg-blue-600/20 border border-blue-500' : 'bg-gray-800 border border-gray-600'
      }`}
    >
      <span className="text-white text-sm">{children}</span>
      {enabled ? (
        <ToggleRight className="w-5 h-5 text-blue-400" />
      ) : (
        <ToggleLeft className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md max-h-[80vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-medium">翻译设置</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 智能推荐面板 */}
          {smartRecommendation && smartRecommendation.confidence > 0.6 && (
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm font-medium">智能推荐</span>
                  {isFirstTimeUser && (
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">首次使用</span>
                  )}
                </div>
                <button
                  onClick={() => setShowSmartPanel(!showSmartPanel)}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                >
                  {showSmartPanel ? '收起' : '展开'}
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-gray-300 text-xs mb-2">
                {getReasonIcon(smartRecommendation.reason)}
                <span>{getReasonText(smartRecommendation.reason)}</span>
                <span className="text-blue-400">({Math.round(smartRecommendation.confidence * 100)}% 匹配)</span>
              </div>
              
              {showSmartPanel && (
                <div className="space-y-2">
                  <div className="text-gray-300 text-xs">
                    推荐语言对：
                    <span className="text-white ml-1">
                      {languages.find(l => l.code === smartRecommendation.recommendedSource)?.name || smartRecommendation.recommendedSource}
                    </span>
                    <span className="text-gray-400 mx-1">→</span>
                    <span className="text-white">
                      {languages.find(l => l.code === smartRecommendation.recommendedTarget)?.name || smartRecommendation.recommendedTarget}
                    </span>
                  </div>
                  
                  <button
                    onClick={applySmartRecommendation}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-lg transition-colors"
                  >
                    应用推荐设置
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 总开关 */}
          <div className="space-y-3">
            <h4 className="text-white font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" />
              翻译功能
            </h4>
            <ToggleButton
              enabled={localSettings.enabled}
              onClick={() => updateSetting('enabled', !localSettings.enabled)}
            >
              启用实时翻译
            </ToggleButton>
          </div>

          {localSettings.enabled && (
            <>
              {/* 翻译类型 */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">翻译类型</h4>
                <ToggleButton
                  enabled={localSettings.danmakuTranslation}
                  onClick={() => updateSetting('danmakuTranslation', !localSettings.danmakuTranslation)}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    弹幕翻译
                  </div>
                </ToggleButton>
                <ToggleButton
                  enabled={localSettings.voiceTranslation}
                  onClick={() => updateSetting('voiceTranslation', !localSettings.voiceTranslation)}
                >
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    语音翻译
                  </div>
                </ToggleButton>
              </div>

              {/* 语言设置 */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">语言设置</h4>
                
                {/* 源语言 */}
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">源语言</label>
                  <select
                    value={localSettings.sourceLanguage}
                    onChange={(e) => updateSetting('sourceLanguage', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 目标语言 */}
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">目标语言</label>
                  <select
                    value={localSettings.targetLanguage}
                    onChange={(e) => updateSetting('targetLanguage', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {languages.filter(lang => lang.code !== 'auto').map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 显示选项 */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">显示选项</h4>
                <ToggleButton
                  enabled={localSettings.showOriginal}
                  onClick={() => updateSetting('showOriginal', !localSettings.showOriginal)}
                >
                  同时显示原文
                </ToggleButton>
                <ToggleButton
                  enabled={localSettings.autoDetect}
                  onClick={() => updateSetting('autoDetect', !localSettings.autoDetect)}
                >
                  自动检测语言
                </ToggleButton>
              </div>

              {/* 翻译模式 */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">翻译模式</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSetting('translationSpeed', 'fast')}
                    className={`p-2 rounded-lg text-sm transition-colors ${
                      localSettings.translationSpeed === 'fast'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    快速翻译
                  </button>
                  <button
                    onClick={() => updateSetting('translationSpeed', 'accurate')}
                    className={`p-2 rounded-lg text-sm transition-colors ${
                      localSettings.translationSpeed === 'accurate'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    精准翻译
                  </button>
                </div>
              </div>

              {/* 显示位置 */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">显示位置</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'overlay', label: '覆盖显示', icon: <Subtitles className="w-4 h-4" /> },
                    { value: 'side', label: '侧边显示', icon: <MessageCircle className="w-4 h-4" /> },
                    { value: 'bottom', label: '底部显示', icon: <Settings className="w-4 h-4" /> }
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => updateSetting('displayMode', mode.value)}
                      className={`p-2 rounded-lg text-xs transition-colors flex flex-col items-center gap-1 ${
                        localSettings.displayMode === mode.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {mode.icon}
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationSettings;