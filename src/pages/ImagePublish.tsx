import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Camera, 
  Image, 
  Palette, 
  Type, 
  Sparkles, 
  Sun, 
  Moon, 
  Contrast, 
  Zap, 
  Heart, 
  Smile, 
  Star, 
  Download, 
  Share, 
  Send,
  Plus,
  X,
  Globe,
  Users,
  Lock,
  MapPin,
  Hash,
  AtSign,
  MessageCircle,
  Share2,
  Check,
  Grid3X3
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Filter {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  style: React.CSSProperties;
}

interface Sticker {
  id: string;
  emoji: string;
  category: string;
}

interface ImageData {
  id: string;
  url: string;
  file?: File;
  filter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  textOverlays: Array<{id: string, text: string, x: number, y: number, color: string, size: number}>;
  stickers: Array<{id: string, emoji: string, x: number, y: number, size: number}>;
}

const ImagePublish: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 图片相关状态
  const [images, setImages] = useState<ImageData[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<'select' | 'edit' | 'publish'>('select');
  
  // 编辑相关状态
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [textOverlays, setTextOverlays] = useState<Array<{id: string, text: string, x: number, y: number, color: string, size: number}>>([]);
  const [stickers, setStickers] = useState<Array<{id: string, emoji: string, x: number, y: number, size: number}>>([]);
  
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
    { id: 'warm', name: '暖色', icon: Heart, style: { filter: 'hue-rotate(30deg) saturate(1.3) brightness(1.1)' } }
  ];

  // 隐私选项
  const privacyOptions = [
    { value: 'public', icon: Globe, label: '公开', desc: '所有人都可以看到' },
    { value: 'friends', icon: Users, label: '朋友', desc: '仅关注的人可以看到' },
    { value: 'private', icon: Lock, label: '私密', desc: '仅自己可以看到' }
  ];

  // 贴纸选项
  const stickerCategories = {
    emotions: ['😀', '😍', '🥰', '😎', '🤔', '😴', '🤩', '😜'],
    hearts: ['❤️', '💕', '💖', '💗', '💝', '💘', '💞', '💓'],
    stars: ['⭐', '🌟', '✨', '💫', '🌠', '⚡', '🔥', '💥'],
    nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🍀', '🌿', '🌱']
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    // 限制最多9张图片
    const remainingSlots = 9 - images.length;
    const filesToProcess = files.slice(0, remainingSlots);
    
    filesToProcess.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImageData = {
          id: Date.now().toString() + index,
          url: e.target?.result as string,
          file,
          filter: 'none',
          brightness: 100,
          contrast: 100,
          saturation: 100,
          textOverlays: [],
          stickers: []
        };
        
        setImages(prev => {
          const updated = [...prev, newImage];
          if (updated.length === 1) {
            setCurrentStep('edit');
          }
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      if (updated.length === 0) {
        setCurrentStep('select');
      } else if (currentImageIndex >= updated.length) {
        setCurrentImageIndex(updated.length - 1);
      }
      return updated;
    });
  };

  const getCurrentImage = () => images[currentImageIndex];

  const updateCurrentImage = (updates: Partial<ImageData>) => {
    setImages(prev => prev.map((img, index) => 
      index === currentImageIndex ? { ...img, ...updates } : img
    ));
  };

  const applyFilter = (filter: Filter) => {
    setSelectedFilter(filter.id);
    updateCurrentImage({ filter: filter.id });
  };

  const addTextOverlay = () => {
    const newText = {
      id: Date.now().toString(),
      text: '添加文字',
      x: 50,
      y: 50,
      color: '#FFFFFF',
      size: 24
    };
    const updatedOverlays = [...textOverlays, newText];
    setTextOverlays(updatedOverlays);
    updateCurrentImage({ textOverlays: updatedOverlays });
  };

  const addSticker = (emoji: string) => {
    const newSticker = {
      id: Date.now().toString(),
      emoji,
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 50,
      size: 32
    };
    const updatedStickers = [...stickers, newSticker];
    setStickers(updatedStickers);
    updateCurrentImage({ stickers: updatedStickers });
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
    const publishData = {
      images: images.map(img => ({
        url: img.url,
        filter: img.filter,
        brightness: img.brightness,
        contrast: img.contrast,
        saturation: img.saturation,
        textOverlays: img.textOverlays,
        stickers: img.stickers
      })),
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
    
    // 模拟发布过程
    setTimeout(() => {
      setIsPublishing(false);
      navigate('/');
    }, 2000);
  };

  const getImageStyle = (image?: ImageData) => {
    const img = image || getCurrentImage();
    if (!img) return {};
    
    const filter = filters.find(f => f.id === img.filter);
    return {
      ...filter?.style,
      filter: `${filter?.style.filter || ''} brightness(${img.brightness}%) contrast(${img.contrast}%) saturate(${img.saturation}%)`
    };
  };

  // 检查从其他页面传递的图片参数
  useEffect(() => {
    const state = location.state as { imageFile?: File; imageUrl?: string } | null;
    if (state?.imageUrl) {
      const newImage: ImageData = {
        id: Date.now().toString(),
        url: state.imageUrl,
        filter: 'none',
        brightness: 100,
        contrast: 100,
        saturation: 100,
        textOverlays: [],
        stickers: []
      };
      setImages([newImage]);
      setCurrentStep('edit');
    }
  }, [location.state]);

  // 同步当前图片的编辑状态
  useEffect(() => {
    const currentImage = getCurrentImage();
    if (currentImage) {
      setSelectedFilter(currentImage.filter);
      setBrightness(currentImage.brightness);
      setContrast(currentImage.contrast);
      setSaturation(currentImage.saturation);
      setTextOverlays(currentImage.textOverlays);
      setStickers(currentImage.stickers);
    }
  }, [currentImageIndex, images]);

  const renderSelectStep = () => (
    <div className="flex-1 bg-black flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <Grid3X3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">选择图片</h2>
        <p className="text-gray-400">最多可选择9张图片</p>
      </div>
      
      <div className="space-y-4 w-full max-w-sm">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
        >
          <Image className="w-6 h-6" />
          从相册选择
        </button>
        
        <button
          className="w-full bg-gray-800 text-white py-4 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-3"
        >
          <Camera className="w-6 h-6" />
          拍照
        </button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );

  const renderEditStep = () => (
    <div className="flex-1 bg-black flex flex-col">
      {/* 图片预览区域 */}
      <div className="flex-1 relative">
        {/* 当前图片显示 */}
        <div className="h-full flex items-center justify-center p-4">
          {getCurrentImage() && (
            <div className="relative max-w-full max-h-full">
              <img
                src={getCurrentImage().url}
                alt="编辑中的图片"
                className="max-w-full max-h-full object-contain rounded-lg"
                style={getImageStyle()}
              />
              
              {/* 文字和贴纸覆盖层 */}
              {textOverlays.map(text => (
                <div
                  key={text.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${text.x}px`,
                    top: `${text.y}px`,
                    color: text.color,
                    fontSize: `${text.size}px`,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                  }}
                >
                  {text.text}
                </div>
              ))}
              
              {stickers.map(sticker => (
                <div
                  key={sticker.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${sticker.x}px`,
                    top: `${sticker.y}px`,
                    fontSize: `${sticker.size}px`
                  }}
                >
                  {sticker.emoji}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 图片导航 */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? 'border-blue-500' : 'border-gray-600'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`图片 ${index + 1}`}
                    className="w-full h-full object-cover"
                    style={getImageStyle(image)}
                  />
                </button>
              ))}
              
              {images.length < 9 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 编辑工具栏 */}
      <div className="bg-gray-900 border-t border-gray-700 p-4">
        <div className="flex space-x-4 overflow-x-auto">
          {/* 滤镜 */}
          <div className="flex-shrink-0">
            <h3 className="text-white text-sm font-medium mb-2">滤镜</h3>
            <div className="flex space-x-2">
              {filters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => applyFilter(filter)}
                    className={`p-3 rounded-lg transition-colors ${
                      selectedFilter === filter.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* 调整 */}
          <div className="flex-shrink-0">
            <h3 className="text-white text-sm font-medium mb-2">调整</h3>
            <div className="space-y-2 w-48">
              <div>
                <label className="text-xs text-gray-400">亮度: {brightness}%</label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setBrightness(value);
                    updateCurrentImage({ brightness: value });
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">对比度: {contrast}%</label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setContrast(value);
                    updateCurrentImage({ contrast: value });
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">饱和度: {saturation}%</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setSaturation(value);
                    updateCurrentImage({ saturation: value });
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* 文字 */}
          <div className="flex-shrink-0">
            <h3 className="text-white text-sm font-medium mb-2">文字</h3>
            <button
              onClick={addTextOverlay}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              添加文字
            </button>
          </div>
          
          {/* 贴纸 */}
          <div className="flex-shrink-0">
            <h3 className="text-white text-sm font-medium mb-2">贴纸</h3>
            <div className="grid grid-cols-4 gap-1 w-32">
              {Object.entries(stickerCategories).slice(0, 2).map(([category, emojis]) => 
                emojis.slice(0, 4).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => addSticker(emoji)}
                    className="text-lg p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 底部按钮 */}
      <div className="bg-gray-900 border-t border-gray-700 p-4 pb-24">
        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentStep('select')}
            className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回选择
          </button>
          <button
            onClick={() => setCurrentStep('publish')}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );

  const renderPublishStep = () => (
    <div className="flex-1 bg-black flex flex-col">
      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 图片预览网格 */}
        <div>
          <label className="block text-white text-sm font-medium mb-3">图片预览 ({images.length}/9)</label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((image, index) => (
              <div key={image.id} className="relative aspect-square">
                <img
                  src={image.url}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                  style={getImageStyle(image)}
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* 标题 */}
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
              value={location_}
              onChange={(e) => setLocation_(e.target.value)}
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
      </div>
      
      {/* 底部按钮 */}
      <div className="bg-gray-900 border-t border-gray-700 p-4 pb-24">
        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentStep('edit')}
            className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
            disabled={isPublishing}
          >
            返回编辑
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || !title.trim()}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isPublishing || !title.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                发布中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                发布图片
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (currentStep === 'select') {
                navigate(-1);
              } else if (currentStep === 'edit') {
                setCurrentStep('select');
              } else {
                setCurrentStep('edit');
              }
            }}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            disabled={isPublishing}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-lg font-semibold">
            {currentStep === 'select' && '选择图片'}
            {currentStep === 'edit' && '编辑图片'}
            {currentStep === 'publish' && '发布图片'}
          </h1>
        </div>
        
        {currentStep === 'publish' && (
          <button
            onClick={handlePublish}
            disabled={isPublishing || !title.trim()}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isPublishing || !title.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isPublishing ? '发布中...' : '发布'}
          </button>
        )}
      </div>

      {/* 主要内容 */}
      {currentStep === 'select' && renderSelectStep()}
      {currentStep === 'edit' && renderEditStep()}
      {currentStep === 'publish' && renderPublishStep()}
      
      {/* 发布进度覆盖层 */}
      {isPublishing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">正在发布图片...</p>
            <p className="text-sm text-gray-400 mt-1">请稍候，正在处理您的内容</p>
          </div>
        </div>
      )}
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImagePublish;