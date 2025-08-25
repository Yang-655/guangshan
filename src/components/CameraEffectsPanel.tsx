import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Palette, Smile, Sun, Moon, Zap, Heart, Star, Camera, RotateCcw, Download } from 'lucide-react';
import { useToast } from './Toast';

interface CameraEffectsPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onClose: () => void;
  onEffectApplied: (effectData: any) => void;
}

interface Filter {
  id: string;
  name: string;
  icon: string;
  type: 'filter' | 'beauty' | 'sticker';
  intensity: number;
  params: Record<string, number>;
}

interface BeautyEffect {
  id: string;
  name: string;
  icon: React.ReactNode;
  intensity: number;
  enabled: boolean;
}

interface Sticker {
  id: string;
  emoji: string;
  name: string;
  position: { x: number; y: number };
  size: number;
}

const CameraEffectsPanel: React.FC<CameraEffectsPanelProps> = ({
  videoRef,
  canvasRef,
  onClose,
  onEffectApplied
}) => {
  const { success, info } = useToast();
  const [activeTab, setActiveTab] = useState<'filters' | 'beauty' | 'stickers'>('filters');
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const animationFrameRef = useRef<number>();
  
  // 滤镜列表
  const filters: Filter[] = [
    { id: 'none', name: '原图', icon: '📷', type: 'filter', intensity: 0, params: {} },
    { id: 'vintage', name: '复古', icon: '📸', type: 'filter', intensity: 80, params: { sepia: 0.8, contrast: 1.2 } },
    { id: 'warm', name: '暖色', icon: '🌅', type: 'filter', intensity: 60, params: { temperature: 200, saturation: 1.1 } },
    { id: 'cool', name: '冷色', icon: '❄️', type: 'filter', intensity: 60, params: { temperature: -200, saturation: 1.1 } },
    { id: 'dramatic', name: '戏剧', icon: '🎭', type: 'filter', intensity: 90, params: { contrast: 1.5, brightness: 0.9 } },
    { id: 'soft', name: '柔和', icon: '☁️', type: 'filter', intensity: 50, params: { blur: 1, brightness: 1.1 } },
    { id: 'vivid', name: '鲜艳', icon: '🌈', type: 'filter', intensity: 70, params: { saturation: 1.4, contrast: 1.2 } },
    { id: 'mono', name: '黑白', icon: '⚫', type: 'filter', intensity: 100, params: { grayscale: 1 } },
    { id: 'sunset', name: '日落', icon: '🌇', type: 'filter', intensity: 75, params: { temperature: 300, saturation: 1.2 } },
    { id: 'neon', name: '霓虹', icon: '💫', type: 'filter', intensity: 85, params: { contrast: 1.6, saturation: 1.5 } }
  ];

  // 美颜效果
  const [beautyEffects, setBeautyEffects] = useState<BeautyEffect[]>([
    { id: 'smooth', name: '磨皮', icon: <Sparkles className="w-4 h-4" />, intensity: 0, enabled: false },
    { id: 'brighten', name: '美白', icon: <Sun className="w-4 h-4" />, intensity: 0, enabled: false },
    { id: 'slim', name: '瘦脸', icon: <Smile className="w-4 h-4" />, intensity: 0, enabled: false },
    { id: 'eyes', name: '大眼', icon: <Star className="w-4 h-4" />, intensity: 0, enabled: false },
    { id: 'lips', name: '红唇', icon: <Heart className="w-4 h-4" />, intensity: 0, enabled: false }
  ]);

  // 贴纸列表
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const availableStickers = [
    { id: 'heart', emoji: '❤️', name: '爱心' },
    { id: 'star', emoji: '⭐', name: '星星' },
    { id: 'smile', emoji: '😊', name: '笑脸' },
    { id: 'cool', emoji: '😎', name: '酷' },
    { id: 'kiss', emoji: '😘', name: '飞吻' },
    { id: 'fire', emoji: '🔥', name: '火焰' },
    { id: 'sparkle', emoji: '✨', name: '闪光' },
    { id: 'crown', emoji: '👑', name: '皇冠' }
  ];

  // 应用滤镜效果
  const applyFilter = (filter: Filter) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    setIsProcessing(true);
    
    const processFrame = () => {
      if (!video || !canvas || !ctx) return;
      
      // 设置画布尺寸
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // 绘制原始视频帧
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 应用滤镜效果
      if (filter.id !== 'none') {
        applyFilterEffect(ctx, canvas, filter);
      }
      
      // 应用美颜效果
      applyBeautyEffects(ctx, canvas);
      
      // 绘制贴纸
      drawStickers(ctx, canvas);
      
      // 继续下一帧
      if (selectedFilter === filter.id) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    };
    
    processFrame();
    setIsProcessing(false);
  };

  // 应用滤镜效果到画布
  const applyFilterEffect = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, filter: Filter) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    switch (filter.id) {
      case 'vintage':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;
        
      case 'warm':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.2); // 增强红色
          data[i + 1] = Math.min(255, data[i + 1] * 1.1); // 稍微增强绿色
        }
        break;
        
      case 'cool':
        for (let i = 0; i < data.length; i += 4) {
          data[i + 2] = Math.min(255, data[i + 2] * 1.2); // 增强蓝色
          data[i + 1] = Math.min(255, data[i + 1] * 1.1); // 稍微增强绿色
        }
        break;
        
      case 'mono':
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        break;
        
      case 'vivid':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.3);
          data[i + 1] = Math.min(255, data[i + 1] * 1.3);
          data[i + 2] = Math.min(255, data[i + 2] * 1.3);
        }
        break;
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  // 应用美颜效果
  const applyBeautyEffects = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    beautyEffects.forEach(effect => {
      if (!effect.enabled || effect.intensity === 0) return;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      switch (effect.id) {
        case 'smooth':
          // 简单的磨皮效果（模糊）
          ctx.filter = `blur(${effect.intensity * 0.5}px)`;
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';
          break;
          
        case 'brighten':
          // 美白效果
          for (let i = 0; i < data.length; i += 4) {
            const factor = 1 + (effect.intensity * 0.01);
            data[i] = Math.min(255, data[i] * factor);
            data[i + 1] = Math.min(255, data[i + 1] * factor);
            data[i + 2] = Math.min(255, data[i + 2] * factor);
          }
          ctx.putImageData(imageData, 0, 0);
          break;
          
        case 'lips':
          // 红唇效果（增强红色）
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] > data[i + 1] && data[i] > data[i + 2]) {
              data[i] = Math.min(255, data[i] * (1 + effect.intensity * 0.02));
            }
          }
          ctx.putImageData(imageData, 0, 0);
          break;
      }
    });
  };

  // 绘制贴纸
  const drawStickers = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    stickers.forEach(sticker => {
      ctx.font = `${sticker.size}px Arial`;
      ctx.fillText(
        sticker.emoji,
        sticker.position.x * canvas.width,
        sticker.position.y * canvas.height
      );
    });
  };

  // 选择滤镜
  const selectFilter = (filterId: string) => {
    setSelectedFilter(filterId);
    const filter = filters.find(f => f.id === filterId);
    if (filter) {
      // 停止之前的动画
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      applyFilter(filter);
      success(`已应用${filter.name}滤镜`);
    }
  };

  // 调整美颜强度
  const adjustBeautyIntensity = (effectId: string, intensity: number) => {
    setBeautyEffects(prev => prev.map(effect => 
      effect.id === effectId 
        ? { ...effect, intensity, enabled: intensity > 0 }
        : effect
    ));
  };

  // 添加贴纸
  const addSticker = (stickerData: typeof availableStickers[0]) => {
    const newSticker: Sticker = {
      ...stickerData,
      position: { x: 0.5, y: 0.5 }, // 中心位置
      size: 40
    };
    setStickers(prev => [...prev, newSticker]);
    success(`已添加${stickerData.name}贴纸`);
  };

  // 清除所有效果
  const clearAllEffects = () => {
    setSelectedFilter('none');
    setBeautyEffects(prev => prev.map(effect => ({ ...effect, intensity: 0, enabled: false })));
    setStickers([]);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    success('已清除所有特效');
  };

  // 保存当前效果
  const saveCurrentEffect = () => {
    const effectData = {
      filter: selectedFilter,
      beauty: beautyEffects.filter(e => e.enabled),
      stickers: stickers
    };
    onEffectApplied(effectData);
    success('特效已保存');
  };

  // 清理资源
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[1100]">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">拍摄特效</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearAllEffects}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="清除所有特效"
            >
              <RotateCcw className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={saveCurrentEffect}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="保存特效"
            >
              <Download className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex border-b">
          {[
            { key: 'filters', label: '滤镜', icon: Palette },
            { key: 'beauty', label: '美颜', icon: Sparkles },
            { key: 'stickers', label: '贴纸', icon: Smile }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center py-3 transition-colors ${
                activeTab === key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {activeTab === 'filters' && (
            <div className="grid grid-cols-3 gap-3">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => selectFilter(filter.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedFilter === filter.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{filter.icon}</div>
                  <div className="text-xs font-medium text-gray-900">{filter.name}</div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'beauty' && (
            <div className="space-y-4">
              {beautyEffects.map((effect) => (
                <div key={effect.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {effect.icon}
                      <span className="text-sm font-medium text-gray-900">{effect.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{effect.intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={effect.intensity}
                    onChange={(e) => adjustBeautyIntensity(effect.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stickers' && (
            <div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {availableStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => addSticker(sticker)}
                    className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="text-2xl mb-1">{sticker.emoji}</div>
                    <div className="text-xs text-gray-600">{sticker.name}</div>
                  </button>
                ))}
              </div>
              
              {stickers.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">已添加的贴纸</h4>
                  <div className="flex flex-wrap gap-2">
                    {stickers.map((sticker, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1"
                      >
                        <span className="text-sm">{sticker.emoji}</span>
                        <button
                          onClick={() => setStickers(prev => prev.filter((_, i) => i !== index))}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-center space-x-2 text-gray-500 text-xs">
            <Camera className="w-4 h-4" />
            <span>特效将实时应用到摄像头预览</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraEffectsPanel;