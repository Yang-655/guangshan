import React, { useState, useEffect } from 'react';
import { Volume2, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { ttsService, TTSConfig } from '../utils/ttsService';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange?: (config: TTSConfig) => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  isOpen,
  onClose,
  onConfigChange
}) => {
  const [config, setConfig] = useState<TTSConfig>(ttsService.getConfig());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(-1);

  // 加载语音列表
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = ttsService.getVoices();
      setVoices(availableVoices);
      
      // 设置当前选中的语音
      if (config.voice && availableVoices.length > 0) {
        const index = availableVoices.findIndex(v => v.name === config.voice?.name);
        setSelectedVoiceIndex(index);
      }
    };

    loadVoices();
    
    // 监听语音列表加载完成
    ttsService.on('voicesLoaded', loadVoices);
    
    return () => {
      ttsService.off('voicesLoaded', loadVoices);
    };
  }, [config.voice]);

  // 更新配置
  const updateConfig = (newConfig: Partial<TTSConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    ttsService.setConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  // 语音选择
  const handleVoiceChange = (voiceIndex: number) => {
    const selectedVoice = voices[voiceIndex];
    setSelectedVoiceIndex(voiceIndex);
    updateConfig({ 
      voice: selectedVoice,
      lang: selectedVoice.lang
    });
  };

  // 语速调节
  const handleRateChange = (rate: number) => {
    updateConfig({ rate });
  };

  // 音调调节
  const handlePitchChange = (pitch: number) => {
    updateConfig({ pitch });
  };

  // 音量调节
  const handleVolumeChange = (volume: number) => {
    updateConfig({ volume });
  };

  // 语言选择
  const handleLanguageChange = (lang: string) => {
    updateConfig({ lang });
    // 自动选择该语言的第一个语音
    const langVoices = voices.filter(v => v.lang.startsWith(lang));
    if (langVoices.length > 0) {
      const voiceIndex = voices.findIndex(v => v.name === langVoices[0].name);
      setSelectedVoiceIndex(voiceIndex);
      updateConfig({ voice: langVoices[0] });
    }
  };

  // 测试语音
  const testVoice = () => {
    if (isTestPlaying) {
      ttsService.stop();
      setIsTestPlaying(false);
    } else {
      const testText = config.lang.startsWith('zh') ? 
        '这是语音测试，您好！' : 
        'This is a voice test, hello!';
      
      setIsTestPlaying(true);
      ttsService.speak(testText, config, 'high');
      
      // 监听播放结束
      const handleEnd = () => {
        setIsTestPlaying(false);
        ttsService.off('itemEnded', handleEnd);
      };
      ttsService.on('itemEnded', handleEnd);
    }
  };

  // 重置为默认设置
  const resetToDefault = () => {
    const defaultConfig: TTSConfig = {
      rate: 1,
      pitch: 1,
      volume: 0.8,
      lang: 'zh-CN'
    };
    setConfig(defaultConfig);
    ttsService.setConfig(defaultConfig);
    onConfigChange?.(defaultConfig);
    setSelectedVoiceIndex(-1);
  };

  // 获取语言选项
  const getLanguageOptions = () => {
    const languages = [
      { code: 'zh-CN', name: '中文（简体）' },
      { code: 'zh-TW', name: '中文（繁体）' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'ja-JP', name: '日本語' },
      { code: 'ko-KR', name: '한국어' },
      { code: 'fr-FR', name: 'Français' },
      { code: 'de-DE', name: 'Deutsch' },
      { code: 'es-ES', name: 'Español' },
      { code: 'it-IT', name: 'Italiano' },
      { code: 'ru-RU', name: 'Русский' },
      { code: 'ar-SA', name: 'العربية' }
    ];
    return languages;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">语音设置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 语言选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            语言
          </label>
          <select
            value={config.lang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            {getLanguageOptions().map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* 语音选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            语音
          </label>
          <select
            value={selectedVoiceIndex}
            onChange={(e) => handleVoiceChange(parseInt(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value={-1}>自动选择</option>
            {voices
              .filter(voice => voice.lang.startsWith(config.lang.split('-')[0]))
              .map((voice, index) => {
                const globalIndex = voices.findIndex(v => v.name === voice.name);
                return (
                  <option key={voice.name} value={globalIndex}>
                    {voice.name} ({voice.lang})
                  </option>
                );
              })
            }
          </select>
        </div>

        {/* 语速调节 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            语速: {config.rate.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={config.rate}
            onChange={(e) => handleRateChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>慢</span>
            <span>正常</span>
            <span>快</span>
          </div>
        </div>

        {/* 音调调节 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            音调: {config.pitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.pitch}
            onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>低</span>
            <span>正常</span>
            <span>高</span>
          </div>
        </div>

        {/* 音量调节 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              音量: {Math.round(config.volume * 100)}%
            </div>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* 测试按钮 */}
        <div className="mb-6">
          <button
            onClick={testVoice}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isTestPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                停止测试
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                测试语音
              </>
            )}
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={resetToDefault}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            确定
          </button>
        </div>

        {/* 浏览器支持提示 */}
        {!ttsService.isSupported() && (
          <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg">
            <p className="text-yellow-300 text-sm">
              ⚠️ 您的浏览器不支持语音合成功能
            </p>
          </div>
        )}
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
        }
      `}</style>
    </div>
  );
};

export default VoiceSettings;