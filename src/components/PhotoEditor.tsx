import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Palette, 
  Type, 
  Sparkles, 
  Sun, 
  Moon, 
  Contrast, 
  Zap, 
  Heart, 
  Image,
  Globe,
  Users,
  Lock,
  MapPin,
  Hash,
  AtSign,
  MessageCircle,
  Share2,
  Crop,
  RotateCw,
  RotateCcw,
  Smile,
  Star,
  Camera,
  Aperture,
  Filter,
  Layers,
  Move,
  Square,
  Circle,
  Triangle,
  Undo,
  Redo
} from 'lucide-react';
import { useToast } from './Toast';

interface Filter {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  style: React.CSSProperties;
}

interface PhotoEditorProps {
  imageUrl: string;
  onPublish: (publishData: any) => void;
  onCancel: () => void;
}

interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface EditHistory {
  id: string;
  action: string;
  data: any;
  timestamp: number;
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({ imageUrl, onPublish, onCancel }) => {
  const { success, warning } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [currentStep, setCurrentStep] = useState<'edit' | 'publish'>('edit');
  const [activeEditTab, setActiveEditTab] = useState<'filters' | 'adjust' | 'crop' | 'text' | 'stickers'>('filters');
  
  // 编辑相关状态
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [textOverlays, setTextOverlays] = useState<Array<{id: string, text: string, x: number, y: number, color: string, size: number, font: string, rotation: number}>>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // 发布相关状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'friends' | 'private'>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [location_, setLocation_] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mentions, setMentions] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // 滤镜选项
  const filters: Filter[] = [
    { id: 'none', name: '原图', icon: Image, style: {} },
    { id: 'vintage', name: '复古', icon: Sun, style: { filter: 'sepia(0.5) contrast(1.2) brightness(1.1)' } },
    { id: 'bw', name: '黑白', icon: Moon, style: { filter: 'grayscale(1) contrast(1.1)' } },
    { id: 'vivid', name: '鲜艳', icon: Contrast, style: { filter: 'saturate(1.5) contrast(1.2)' } },
    { id: 'cool', name: '冷色', icon: Zap, style: { filter: 'hue-rotate(180deg) saturate(1.2)' } },
    { id: 'warm', name: '暖色', icon: Heart, style: { filter: 'hue-rotate(30deg) saturate(1.3) brightness(1.1)' } },
    { id: 'dramatic', name: '戏剧', icon: Star, style: { filter: 'contrast(1.5) brightness(0.9) saturate(1.2)' } },
    { id: 'soft', name: '柔和', icon: Sparkles, style: { filter: 'blur(0.5px) brightness(1.1) contrast(0.9)' } },
    { id: 'film', name: '胶片', icon: Camera, style: { filter: 'sepia(0.3) contrast(1.1) brightness(1.05) hue-rotate(5deg)' } },
    { id: 'neon', name: '霓虹', icon: Aperture, style: { filter: 'saturate(2) contrast(1.3) hue-rotate(90deg)' } },
    { id: 'retro', name: '复古', icon: Filter, style: { filter: 'sepia(0.8) contrast(1.4) brightness(0.95)' } },
    { id: 'cyberpunk', name: '赛博朋克', icon: Layers, style: { filter: 'saturate(1.8) contrast(1.2) hue-rotate(270deg) brightness(1.1)' } }
  ];

  // 贴纸选项
  const stickerEmojis = [
    '😀', '😂', '🥰', '😎', '🤔', '😴', '🤩', '😍', '🥳', '😜',
    '❤️', '💕', '💖', '💯', '🔥', '⭐', '✨', '🌟', '💫', '🎉',
    '🎊', '🎈', '🎁', '🌈', '☀️', '🌙', '⚡', '💎', '🏆', '🎯'
  ];

  // 隐私选项
  const privacyOptions = [
    { value: 'public', icon: Globe, label: '公开', desc: '所有人都可以看到' },
    { value: 'friends', icon: Users, label: '好友', desc: '仅好友可见' },
    { value: 'private', icon: Lock, label: '私密', desc: '仅自己可见' }
  ];

  const getImageStyle = () => {
    const filter = filters.find(f => f.id === selectedFilter);
    const baseFilter = filter?.style.filter || '';
    const adjustments = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px)`;
    
    return {
      ...filter?.style,
      filter: `${baseFilter} ${adjustments}`,
      transform: `rotate(${rotation}deg)`,
      transition: 'all 0.3s ease'
    };
  };

  const addToHistory = (action: string, data: any) => {
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push({
      id: Date.now().toString(),
      action,
      data,
      timestamp: Date.now()
    });
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > -1) {
      setHistoryIndex(historyIndex - 1);
      // 这里可以实现具体的撤销逻辑
    }
  };

  const redo = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      // 这里可以实现具体的重做逻辑
    }
  };

  const rotateImage = (degrees: number) => {
    const newRotation = (rotation + degrees) % 360;
    setRotation(newRotation);
    addToHistory('rotate', { rotation: newRotation });
  };

  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: Date.now().toString(),
      emoji,
      x: 50,
      y: 50,
      size: 40,
      rotation: 0
    };
    setStickers([...stickers, newSticker]);
    addToHistory('add_sticker', newSticker);
  };

  const removeSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
    addToHistory('remove_sticker', { id });
  };

  const addTextOverlay = (text: string, color: string = '#ffffff', size: number = 24, font: string = 'Arial') => {
    const newOverlay = {
      id: Date.now().toString(),
      text,
      x: 50,
      y: 50,
      color,
      size,
      font,
      rotation: 0
    };
    setTextOverlays([...textOverlays, newOverlay]);
    addToHistory('add_text', newOverlay);
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays(textOverlays.filter(t => t.id !== id));
    addToHistory('remove_text', { id });
  };

  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
    addToHistory('filter', { filterId });
  };

  const renderEditTabContent = () => {
    switch (activeEditTab) {
      case 'filters':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium mb-2 flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              滤镜效果
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {filters.map(filter => {
                const IconComponent = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterChange(filter.id)}
                    className={`p-2 rounded-lg border transition-colors ${
                      selectedFilter === filter.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 text-white mb-1 mx-auto" />
                    <div className="text-xs text-white text-center">{filter.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
        
      case 'adjust':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium mb-2 flex items-center">
              <Sun className="w-4 h-4 mr-2" />
              图片调整
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-white text-sm mb-1 block">亮度: {brightness}%</label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-white text-sm mb-1 block">对比度: {contrast}%</label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-white text-sm mb-1 block">饱和度: {saturation}%</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-white text-sm mb-1 block">色调: {hue}°</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={hue}
                  onChange={(e) => setHue(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-white text-sm mb-1 block">模糊: {blur}px</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* 旋转控制 */}
            <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => rotateImage(-90)}
                className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>
              <span className="text-white text-sm">旋转: {rotation}°</span>
              <button
                onClick={() => rotateImage(90)}
                className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <RotateCw className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        );
        
      case 'crop':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium mb-2 flex items-center">
              <Crop className="w-4 h-4 mr-2" />
              裁剪工具
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setCropMode(!cropMode)}
                className={`w-full p-3 rounded-lg transition-colors ${
                  cropMode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cropMode ? '完成裁剪' : '开始裁剪'}
              </button>
              
              {cropMode && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setCropArea({ x: 0, y: 0, width: 100, height: 100 })}
                      className="p-2 bg-gray-700 rounded text-white text-xs hover:bg-gray-600"
                    >
                      原始
                    </button>
                    <button
                      onClick={() => setCropArea({ x: 12.5, y: 12.5, width: 75, height: 75 })}
                      className="p-2 bg-gray-700 rounded text-white text-xs hover:bg-gray-600"
                    >
                      1:1
                    </button>
                    <button
                      onClick={() => setCropArea({ x: 0, y: 12.5, width: 100, height: 75 })}
                      className="p-2 bg-gray-700 rounded text-white text-xs hover:bg-gray-600"
                    >
                      4:3
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium mb-2 flex items-center">
              <Type className="w-4 h-4 mr-2" />
              文字工具
            </h3>
            <TextEditor onAddText={addTextOverlay} />
            
            {textOverlays.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-2">已添加的文字</h4>
                <div className="space-y-2">
                  {textOverlays.map(overlay => (
                    <div key={overlay.id} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                      <span className="text-white text-sm truncate">{overlay.text}</span>
                      <button
                        onClick={() => removeTextOverlay(overlay.id)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'stickers':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium mb-2 flex items-center">
              <Smile className="w-4 h-4 mr-2" />
              贴纸表情
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {stickerEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addSticker(emoji)}
                  className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-2xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            {stickers.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-2">已添加的贴纸</h4>
                <div className="grid grid-cols-4 gap-2">
                  {stickers.map(sticker => (
                    <div key={sticker.id} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                      <span className="text-xl">{sticker.emoji}</span>
                      <button
                        onClick={() => removeSticker(sticker.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  const TextEditor: React.FC<{ onAddText: (text: string, color: string, size: number, font: string) => void }> = ({ onAddText }) => {
    const [text, setText] = useState('');
    const [color, setColor] = useState('#ffffff');
    const [size, setSize] = useState(24);
    const [font, setFont] = useState('Arial');
    
    const fonts = ['Arial', 'Helvetica', 'Times New Roman', '微软雅黑', '宋体', 'Impact', 'Comic Sans MS'];
    
    const handleAdd = () => {
      if (text.trim()) {
        onAddText(text.trim(), color, size, font);
        setText('');
      }
    };
    
    return (
      <div className="space-y-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入文字内容"
          className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">字体</label>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 text-sm"
            >
              {fonts.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">大小: {size}px</label>
            <input
              type="range"
              min="12"
              max="72"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-1">颜色</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded border border-gray-600"
          />
        </div>
        
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          添加文字
        </button>
      </div>
    );
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      warning('请输入图片标题');
      return;
    }

    setIsPublishing(true);
    
    const publishData = {
      type: 'photo',
      imageUrl,
      filter: selectedFilter,
      brightness,
      contrast,
      saturation,
      textOverlays,
      title: title.trim(),
      description: description.trim(),
      privacyLevel,
      allowComments,
      allowSharing,
      location: location_.trim(),
      hashtags: hashtags.split('#').filter(tag => tag.trim()).map(tag => tag.trim()),
      mentions: mentions.split('@').filter(mention => mention.trim()).map(mention => mention.trim()),
      publishedAt: new Date().toISOString()
    };
    
    try {
      await onPublish(publishData);
      setIsPublishing(false);
    } catch (error) {
      setIsPublishing(false);
      warning('发布失败，请重试');
    }
  };

  const renderEditStep = () => (
    <div className="flex flex-col h-full bg-black">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <button
          onClick={onCancel}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-white">编辑图片</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            disabled={historyIndex < 0}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= editHistory.length - 1}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <Redo className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentStep('publish')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            下一步
          </button>
        </div>
      </div>

      {/* 图片预览区域 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative max-w-full max-h-full">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="预览"
            className="max-w-full max-h-full object-contain rounded-lg"
            style={getImageStyle()}
          />
          
          {/* 文字叠加层 */}
          {textOverlays.map(overlay => (
            <div
              key={overlay.id}
              className="absolute cursor-move group"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                color: overlay.color,
                fontSize: `${overlay.size}px`,
                fontFamily: overlay.font,
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                transform: `rotate(${overlay.rotation}deg)`
              }}
            >
              {overlay.text}
              <button
                onClick={() => removeTextOverlay(overlay.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
          
          {/* 贴纸叠加层 */}
          {stickers.map(sticker => (
            <div
              key={sticker.id}
              className="absolute cursor-move group"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                fontSize: `${sticker.size}px`,
                transform: `rotate(${sticker.rotation}deg)`
              }}
            >
              {sticker.emoji}
              <button
                onClick={() => removeSticker(sticker.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
          
          {/* 裁剪框 */}
          {cropMode && (
            <div
              className="absolute border-2 border-white border-dashed"
              style={{
                left: `${cropArea.x}%`,
                top: `${cropArea.y}%`,
                width: `${cropArea.width}%`,
                height: `${cropArea.height}%`
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>
          )}
        </div>
      </div>

      {/* 编辑标签页 */}
      <div className="bg-black/90 backdrop-blur-sm">
        <div className="flex border-b border-gray-700">
          {[
            { id: 'filters', icon: Palette, label: '滤镜' },
            { id: 'adjust', icon: Sun, label: '调整' },
            { id: 'crop', icon: Crop, label: '裁剪' },
            { id: 'text', icon: Type, label: '文字' },
            { id: 'stickers', icon: Smile, label: '贴纸' }
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveEditTab(tab.id as any)}
                className={`flex-1 p-3 flex flex-col items-center space-y-1 transition-colors ${
                  activeEditTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* 标签页内容 */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {renderEditTabContent()}
        </div>
      </div>
    </div>
  );

  const renderPublishStep = () => (
    <div className="flex flex-col h-full bg-black">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <button
          onClick={() => setCurrentStep('edit')}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-white">发布图片</h1>
        <button
          onClick={handlePublish}
          disabled={isPublishing || !title.trim()}
          className={`px-4 py-2 rounded-lg transition-colors ${
            isPublishing || !title.trim()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isPublishing ? '发布中...' : '发布'}
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 图片预览 */}
        <div className="flex gap-4">
          <img
            src={imageUrl}
            alt="预览"
            className="w-20 h-20 object-cover rounded-lg"
            style={getImageStyle()}
          />
          <div className="flex-1">
            <input
              type="text"
              placeholder="添加标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-white text-lg font-medium placeholder-gray-400 border-none outline-none"
              maxLength={100}
            />
            <textarea
              placeholder="添加描述..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent text-white text-sm placeholder-gray-400 border-none outline-none resize-none mt-2"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        {/* 隐私设置 */}
        <div>
          <h3 className="text-white font-medium mb-3 flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            隐私设置
          </h3>
          <div className="space-y-2">
            {privacyOptions.map(option => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setPrivacyLevel(option.value as any)}
                  className={`w-full p-3 rounded-lg border transition-colors text-left ${
                    privacyLevel === option.value
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 bg-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <IconComponent className="w-5 h-5 text-white mr-3" />
                    <div>
                      <div className="text-white font-medium">{option.label}</div>
                      <div className="text-gray-400 text-sm">{option.desc}</div>
                    </div>
                    {privacyLevel === option.value && (
                      <Check className="w-5 h-5 text-blue-500 ml-auto" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 互动设置 */}
        <div>
          <h3 className="text-white font-medium mb-3 flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            互动设置
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-white">允许评论</span>
              <input
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-white">允许分享</span>
              <input
                type="checkbox"
                checked={allowSharing}
                onChange={(e) => setAllowSharing(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* 位置和标签 */}
        <div className="space-y-4">
          <div>
            <label className="text-white font-medium mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              位置
            </label>
            <input
              type="text"
              placeholder="添加位置..."
              value={location_}
              onChange={(e) => setLocation_(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="text-white font-medium mb-2 flex items-center">
              <Hash className="w-4 h-4 mr-2" />
              话题标签
            </label>
            <input
              type="text"
              placeholder="#话题1 #话题2"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="text-white font-medium mb-2 flex items-center">
              <AtSign className="w-4 h-4 mr-2" />
              提及好友
            </label>
            <input
              type="text"
              placeholder="@好友1 @好友2"
              value={mentions}
              onChange={(e) => setMentions(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* 编辑界面 */}
      {currentStep === 'edit' && (
        <div className="h-full flex flex-col">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between p-4 bg-black/50">
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= editHistory.length - 1}
                className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Redo className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <button
              onClick={() => setCurrentStep('publish')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              下一步
            </button>
          </div>

          {/* 图片预览区域 */}
          <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="编辑中的图片"
              className="max-w-full max-h-full object-contain"
              style={getImageStyle()}
            />
            
            {/* 文字覆盖层 */}
            {textOverlays.map(overlay => (
              <div
                key={overlay.id}
                className="absolute cursor-move select-none"
                style={{
                  left: `${overlay.x}%`,
                  top: `${overlay.y}%`,
                  color: overlay.color,
                  fontSize: `${overlay.size}px`,
                  fontFamily: overlay.font,
                  transform: `rotate(${overlay.rotation}deg)`,
                  zIndex: 10
                }}
                draggable
                onDragEnd={(e) => {
                  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                  if (rect) {
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setTextOverlays(prev => prev.map(t => 
                      t.id === overlay.id ? { ...t, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : t
                    ));
                  }
                }}
              >
                {overlay.text}
                <button
                  onClick={() => removeTextOverlay(overlay.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* 贴纸覆盖层 */}
            {stickers.map(sticker => (
              <div
                key={sticker.id}
                className="absolute cursor-move select-none"
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  fontSize: `${sticker.size}px`,
                  transform: `rotate(${sticker.rotation}deg)`,
                  zIndex: 10
                }}
                draggable
                onDragEnd={(e) => {
                  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                  if (rect) {
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setStickers(prev => prev.map(s => 
                      s.id === sticker.id ? { ...s, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : s
                    ));
                  }
                }}
              >
                {sticker.emoji}
                <button
                  onClick={() => removeSticker(sticker.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* 裁剪区域 */}
            {cropMode && (
              <div
                className="absolute border-2 border-white border-dashed bg-white/10"
                style={{
                  left: `${cropArea.x}%`,
                  top: `${cropArea.y}%`,
                  width: `${cropArea.width}%`,
                  height: `${cropArea.height}%`,
                  zIndex: 20
                }}
              >
                <div className="absolute inset-0 border border-white/50" />
              </div>
            )}
          </div>

          {/* 底部编辑工具 */}
          <div className="bg-black/80 p-4">
            {/* 标签页导航 */}
            <div className="flex justify-center space-x-1 mb-4">
              {[
                { id: 'filters', label: '滤镜', icon: Palette },
                { id: 'adjust', label: '调整', icon: Sun },
                { id: 'crop', label: '裁剪', icon: Crop },
                { id: 'text', label: '文字', icon: Type },
                { id: 'stickers', label: '贴纸', icon: Smile }
              ].map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveEditTab(tab.id as any)}
                    className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
                      activeEditTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mb-1" />
                    <span className="text-xs">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* 标签页内容 */}
            <div className="max-h-64 overflow-y-auto">
              {renderEditTabContent()}
            </div>
          </div>
        </div>
      )}
      
      {/* 发布界面 */}
       {currentStep === 'publish' && renderPublishStep()}


      
      {/* 发布进度覆盖层 */}
      {isPublishing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-white">正在发布图片...</p>
            <p className="text-sm text-gray-400 mt-2">请稍候，正在处理您的图片...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoEditor;