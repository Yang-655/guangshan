import React, { useState } from 'react';
import { ArrowLeft, Shield, Lock, Eye, EyeOff, Smartphone, Mail, Key, Bell, Globe, Mic, Subtitles, Brain, AlertTriangle, CreditCard, Users, FileText, HelpCircle, LogOut, ChevronRight, BarChart3, Bitcoin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  type: 'toggle' | 'select' | 'button' | 'info';
  value?: boolean | string;
  options?: string[];
  icon?: React.ReactNode;
  action?: () => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, boolean | string>>({
    // 隐私设置
    profileVisibility: 'public',
    allowSearch: true,
    showOnlineStatus: true,
    allowMessageFromStrangers: false,
    dataCollection: false,
    personalizedAds: true,
    locationSharing: false,
    
    // AI功能配置
    voiceRecognition: true,
    autoTranslate: false,
    offlineMode: false,
    subtitleGeneration: true,
    voiceLanguage: 'zh-CN',
    translationLanguage: 'en',
    subtitleStyle: 'default',
    
    // 安全选项
    twoFactorAuth: false,
    biometricAuth: true,
    autoLock: true,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    
    // 反诈骗设置
    fraudDetection: true,
    riskAlerts: true,
    transactionLimits: true,
    securityEducation: true,
    reportSuspicious: true
  });

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingSections: SettingSection[] = [
    {
      title: '隐私设置',
      items: [
        {
          id: 'profileVisibility',
          title: '个人资料可见性',
          description: '控制谁可以查看您的个人资料',
          type: 'select',
          value: settings.profileVisibility,
          options: ['public', 'friends', 'private'],
          icon: <Eye className="w-5 h-5 text-blue-600" />
        },
        {
          id: 'allowSearch',
          title: '允许他人搜索到我',
          description: '其他用户可以通过用户名搜索到您',
          type: 'toggle',
          value: settings.allowSearch,
          icon: <Users className="w-5 h-5 text-green-600" />
        },
        {
          id: 'showOnlineStatus',
          title: '显示在线状态',
          description: '让好友看到您的在线状态',
          type: 'toggle',
          value: settings.showOnlineStatus,
          icon: <Globe className="w-5 h-5 text-blue-600" />
        },
        {
          id: 'allowMessageFromStrangers',
          title: '接收陌生人消息',
          description: '允许非好友用户向您发送消息',
          type: 'toggle',
          value: settings.allowMessageFromStrangers,
          icon: <Mail className="w-5 h-5 text-purple-600" />
        },
        {
          id: 'dataCollection',
          title: '数据收集',
          description: '允许收集使用数据以改善服务',
          type: 'toggle',
          value: settings.dataCollection,
          icon: <FileText className="w-5 h-5 text-orange-600" />
        },
        {
          id: 'personalizedAds',
          title: '个性化广告',
          description: '基于您的兴趣显示相关广告',
          type: 'toggle',
          value: settings.personalizedAds,
          icon: <Eye className="w-5 h-5 text-red-600" />
        },
        {
          id: 'locationSharing',
          title: '位置共享',
          description: '在内容中包含位置信息',
          type: 'toggle',
          value: settings.locationSharing,
          icon: <Globe className="w-5 h-5 text-green-600" />
        }
      ]
    },
    {
      title: 'AI功能配置',
      items: [
        {
          id: 'voiceRecognition',
          title: '语音识别',
          description: '启用语音转文字功能',
          type: 'toggle',
          value: settings.voiceRecognition,
          icon: <Mic className="w-5 h-5 text-blue-600" />
        },
        {
          id: 'autoTranslate',
          title: '自动翻译',
          description: '自动翻译外语消息和内容',
          type: 'toggle',
          value: settings.autoTranslate,
          icon: <Globe className="w-5 h-5 text-green-600" />
        },
        {
          id: 'offlineMode',
          title: '离线模式',
          description: '优先使用本地AI处理，保护隐私',
          type: 'toggle',
          value: settings.offlineMode,
          icon: <Shield className="w-5 h-5 text-purple-600" />
        },
        {
          id: 'subtitleGeneration',
          title: '智能字幕生成',
          description: '为视频自动生成字幕',
          type: 'toggle',
          value: settings.subtitleGeneration,
          icon: <Subtitles className="w-5 h-5 text-orange-600" />
        },
        {
          id: 'voiceLanguage',
          title: '语音识别语言',
          description: '设置语音识别的主要语言',
          type: 'select',
          value: settings.voiceLanguage,
          options: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
          icon: <Mic className="w-5 h-5 text-blue-600" />
        },
        {
          id: 'translationLanguage',
          title: '翻译目标语言',
          description: '设置自动翻译的目标语言',
          type: 'select',
          value: settings.translationLanguage,
          options: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE'],
          icon: <Globe className="w-5 h-5 text-green-600" />
        },
        {
          id: 'subtitleStyle',
          title: '字幕样式',
          description: '自定义字幕显示样式',
          type: 'select',
          value: settings.subtitleStyle,
          options: ['default', 'large', 'bold', 'colorful'],
          icon: <Subtitles className="w-5 h-5 text-purple-600" />
        }
      ]
    },
    {
      title: '安全选项',
      items: [
        {
          id: 'twoFactorAuth',
          title: '两步验证',
          description: '为账户添加额外的安全保护',
          type: 'toggle',
          value: settings.twoFactorAuth,
          icon: <Shield className="w-5 h-5 text-green-600" />
        },
        {
          id: 'biometricAuth',
          title: '生物识别认证',
          description: '使用指纹或面部识别登录',
          type: 'toggle',
          value: settings.biometricAuth,
          icon: <Smartphone className="w-5 h-5 text-blue-600" />
        },
        {
          id: 'autoLock',
          title: '自动锁定',
          description: '应用在后台时自动锁定',
          type: 'toggle',
          value: settings.autoLock,
          icon: <Lock className="w-5 h-5 text-red-600" />
        },
        {
          id: 'loginNotifications',
          title: '登录通知',
          description: '新设备登录时发送通知',
          type: 'toggle',
          value: settings.loginNotifications,
          icon: <Bell className="w-5 h-5 text-orange-600" />
        },
        {
          id: 'suspiciousActivityAlerts',
          title: '可疑活动警报',
          description: '检测到异常活动时立即通知',
          type: 'toggle',
          value: settings.suspiciousActivityAlerts,
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />
        },
        {
          id: 'changePassword',
          title: '修改密码',
          description: '更改您的登录密码',
          type: 'button',
          icon: <Key className="w-5 h-5 text-purple-600" />,
          action: () => console.log('修改密码')
        },
        {
          id: 'manageDevices',
          title: '设备管理',
          description: '查看和管理已登录的设备',
          type: 'button',
          icon: <Smartphone className="w-5 h-5 text-blue-600" />,
          action: () => console.log('设备管理')
        }
      ]
    },
    {
      title: '反诈骗设置',
      items: [
        {
          id: 'fraudDetection',
          title: 'AI反诈骗检测',
          description: '智能识别和拦截诈骗行为',
          type: 'toggle',
          value: settings.fraudDetection,
          icon: <Brain className="w-5 h-5 text-red-600" />
        },
        {
          id: 'riskAlerts',
          title: '风险提醒',
          description: '检测到风险时立即提醒',
          type: 'toggle',
          value: settings.riskAlerts,
          icon: <AlertTriangle className="w-5 h-5 text-orange-600" />
        },
        {
          id: 'transactionLimits',
          title: '交易限额保护',
          description: '设置单笔和日交易限额',
          type: 'toggle',
          value: settings.transactionLimits,
          icon: <CreditCard className="w-5 h-5 text-green-600" />
        },
        {
          id: 'securityEducation',
          title: '安全教育推送',
          description: '定期推送防诈骗知识',
          type: 'toggle',
          value: settings.securityEducation,
          icon: <FileText className="w-5 h-5 text-blue-600" />
        },
        {
          id: 'reportSuspicious',
          title: '可疑行为举报',
          description: '启用一键举报可疑行为',
          type: 'toggle',
          value: settings.reportSuspicious,
          icon: <Shield className="w-5 h-5 text-purple-600" />
        },
        {
          id: 'fraudShieldCenter',
          title: '反诈骗中心',
          description: '查看详细的安全报告和设置',
          type: 'button',
          icon: <Shield className="w-5 h-5 text-red-600" />,
          action: () => navigate('/fraud-shield')
        },
        {
          id: 'analyticsCenter',
          title: '数据分析中心',
          description: '查看详细的数据分析报告',
          type: 'button',
          icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
          action: () => navigate('/analytics')
        },
        {
          id: 'cryptoCenter',
          title: '加密货币中心',
          description: '管理和查看加密货币相关功能',
          type: 'button',
          icon: <Bitcoin className="w-5 h-5 text-yellow-600" />,
          action: () => navigate('/crypto')
        },
        {
          id: 'fraudShieldCenter2',
          title: '反诈骗中心',
          description: '查看详细的安全报告和设置',
          type: 'button',
          icon: <Shield className="w-5 h-5 text-red-600" />,
          action: () => navigate('/fraud-shield')
        }
      ]
    },
    {
      title: '其他设置',
      items: [
        {
          id: 'notifications',
          title: '通知设置',
          description: '管理推送通知偏好',
          type: 'button',
          icon: <Bell className="w-5 h-5 text-blue-600" />,
          action: () => console.log('通知设置')
        },
        {
          id: 'language',
          title: '语言设置',
          description: '更改应用界面语言',
          type: 'button',
          icon: <Globe className="w-5 h-5 text-green-600" />,
          action: () => console.log('语言设置')
        },
        {
          id: 'storage',
          title: '存储管理',
          description: '查看和清理应用存储空间',
          type: 'button',
          icon: <FileText className="w-5 h-5 text-orange-600" />,
          action: () => console.log('存储管理')
        },
        {
          id: 'help',
          title: '帮助与支持',
          description: '获取使用帮助和客服支持',
          type: 'button',
          icon: <HelpCircle className="w-5 h-5 text-purple-600" />,
          action: () => console.log('帮助与支持')
        },
        {
          id: 'about',
          title: '关于应用',
          description: '查看应用版本和相关信息',
          type: 'button',
          icon: <FileText className="w-5 h-5 text-gray-600" />,
          action: () => console.log('关于应用')
        },
        {
          id: 'logout',
          title: '退出登录',
          description: '安全退出当前账户',
          type: 'button',
          icon: <LogOut className="w-5 h-5 text-red-600" />,
          action: () => {
            if (confirm('确定要退出登录吗？')) {
              navigate('/login');
            }
          }
        }
      ]
    }
  ];

  const getLanguageText = (code: string) => {
    const languages: Record<string, string> = {
      'zh-CN': '中文（简体）',
      'en-US': 'English',
      'ja-JP': '日本語',
      'ko-KR': '한국어',
      'fr-FR': 'Français',
      'de-DE': 'Deutsch'
    };
    return languages[code] || code;
  };

  const getStyleText = (style: string) => {
    const styles: Record<string, string> = {
      'default': '默认',
      'large': '大字体',
      'bold': '粗体',
      'colorful': '彩色'
    };
    return styles[style] || style;
  };

  const getVisibilityText = (visibility: string) => {
    const visibilities: Record<string, string> = {
      'public': '公开',
      'friends': '仅好友',
      'private': '私密'
    };
    return visibilities[visibility] || visibility;
  };

  const renderSettingItem = (item: SettingItem) => {
    switch (item.type) {
      case 'toggle':
        return (
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center flex-1">
              {item.icon && <div className="mr-3">{item.icon}</div>}
              <div className="flex-1">
                <div className="font-medium text-gray-800">{item.title}</div>
                {item.description && (
                  <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => updateSetting(item.id, !item.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                item.value ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  item.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        );
      
      case 'select':
        return (
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center flex-1">
              {item.icon && <div className="mr-3">{item.icon}</div>}
              <div className="flex-1">
                <div className="font-medium text-gray-800">{item.title}</div>
                {item.description && (
                  <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">
                {item.id === 'voiceLanguage' || item.id === 'translationLanguage' 
                  ? getLanguageText(item.value as string)
                  : item.id === 'subtitleStyle'
                  ? getStyleText(item.value as string)
                  : item.id === 'profileVisibility'
                  ? getVisibilityText(item.value as string)
                  : item.value}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      
      case 'button':
        return (
          <button
            onClick={item.action}
            className="flex items-center justify-between w-full py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center flex-1">
              {item.icon && <div className="mr-3">{item.icon}</div>}
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-800">{item.title}</div>
                {item.description && (
                  <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        );
      
      case 'info':
        return (
          <div className="flex items-center py-4">
            {item.icon && <div className="mr-3">{item.icon}</div>}
            <div className="flex-1">
              <div className="font-medium text-gray-800">{item.title}</div>
              {item.description && (
                <div className="text-sm text-gray-600 mt-1">{item.description}</div>
              )}
            </div>
            {item.value && (
              <span className="text-sm text-gray-600">{item.value}</span>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe max-md:pb-24 max-sm:pb-28">
      {/* 头部导航 */}
      <div className="bg-white px-3 sm:px-4 py-3 sm:py-4 border-b">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">设置</h1>
        </div>
      </div>

      {/* 设置内容 */}
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {settingSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-xl overflow-hidden">
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">{section.title}</h2>
            </div>
            <div className="px-3 sm:px-4">
              {section.items.map((item, itemIndex) => (
                <div key={item.id}>
                  {renderSettingItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <div className="border-b border-gray-100" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 版本信息 */}
      <div className="px-4 pb-4">
        <div className="text-center text-sm text-gray-500">
          <div>隐私短视频社交平台</div>
          <div className="mt-1">版本 1.0.0</div>
        </div>
      </div>
    </div>
  );
}