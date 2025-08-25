import React, { useState, useEffect } from 'react';
import { Languages, Settings, Volume2, VolumeX, Type, Palette } from 'lucide-react';

interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  language: string;
}

interface SubtitleDisplayProps {
  videoCurrentTime: number;
  subtitles: Subtitle[];
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const SubtitleDisplay: React.FC<SubtitleDisplayProps> = ({
  videoCurrentTime,
  subtitles,
  isVisible,
  onToggleVisibility
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState('zh-CN');
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState('rgba(0, 0, 0, 0.7)');
  const [position, setPosition] = useState('bottom');
  const [showSettings, setShowSettings] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // 获取当前时间对应的字幕
  const getCurrentSubtitle = () => {
    if (!subtitles || !Array.isArray(subtitles)) {
      return null;
    }
    return subtitles.find(
      subtitle => 
        videoCurrentTime >= subtitle.startTime && 
        videoCurrentTime <= subtitle.endTime &&
        subtitle.language === selectedLanguage
    );
  };

  // 模拟AI翻译功能
  const translateSubtitle = async (targetLanguage: string) => {
    setIsTranslating(true);
    // 模拟翻译延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSelectedLanguage(targetLanguage);
    setIsTranslating(false);
  };

  const currentSubtitle = getCurrentSubtitle();

  const languages = [
    { code: 'zh-CN', name: '中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];

  const fontSizes = [12, 14, 16, 18, 20, 24];
  const colors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
  const positions = [
    { value: 'top', label: '顶部' },
    { value: 'center', label: '中间' },
    { value: 'bottom', label: '底部' }
  ];

  return (
    <div className="relative">
      {/* 字幕控制按钮 - 移动到底部右侧 */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-20">
        <button
          onClick={onToggleVisibility}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          {isVisible ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* 字幕设置面板 - 从底部向上弹出 */}
      {showSettings && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
            onClick={() => setShowSettings(false)}
          />
          
          {/* 设置面板 */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-6 z-50 max-h-[80vh] overflow-y-auto animate-slide-up">
            {/* 拖拽指示器 */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            
            <h3 className="font-semibold mb-6 flex items-center gap-2 text-lg">
              <Type size={24} />
              字幕设置
            </h3>
          
          {/* 语言选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Languages size={16} />
              字幕语言
            </label>
            <div className="grid grid-cols-2 gap-2">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => translateSubtitle(lang.code)}
                  disabled={isTranslating}
                  className={`p-2 text-sm rounded border transition-colors ${
                    selectedLanguage === lang.code
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isTranslating && selectedLanguage !== lang.code ? '翻译中...' : lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* 字体大小 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">字体大小</label>
            <div className="flex gap-2 flex-wrap">
              {fontSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-1 text-sm rounded border transition-colors ${
                    fontSize === size
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* 字体颜色 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Palette size={16} />
              字体颜色
            </label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setFontColor(color)}
                  className={`w-8 h-8 rounded border-2 transition-transform ${
                    fontColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* 位置设置 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">字幕位置</label>
            <div className="flex gap-2">
              {positions.map(pos => (
                <button
                  key={pos.value}
                  onClick={() => setPosition(pos.value)}
                  className={`px-3 py-1 text-sm rounded border transition-colors ${
                    position === pos.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
            
          {/* 关闭按钮 */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              关闭设置
            </button>
          </div>
        </div>
        </>
      )}

      {/* 字幕显示 */}
      {isVisible && currentSubtitle && (
        <div 
          className={`absolute left-1/2 transform -translate-x-1/2 px-4 py-2 rounded max-w-[80%] text-center z-10 ${
            position === 'top' ? 'top-8' : 
            position === 'center' ? 'top-1/2 -translate-y-1/2' : 
            'bottom-8'
          }`}
          style={{
            backgroundColor,
            color: fontColor,
            fontSize: `${fontSize}px`,
            lineHeight: '1.4'
          }}
        >
          {currentSubtitle.text}
        </div>
      )}

      {/* 翻译加载指示器 */}
      {isTranslating && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full z-10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            AI翻译中...
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtitleDisplay;