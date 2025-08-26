import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Scissors, Music, Type, Sparkles, Palette, Volume2, VolumeX, RotateCcw, RotateCw, Crop, Filter, Download, Save, Undo, Redo, Play, Pause, SkipBack, SkipForward, Zap, Star, Heart, Smile, Sun, Moon, Move, Square, Circle, Triangle, Layers, Eye, EyeOff, Lock, Unlock, Copy, Trash2, Settings, Maximize, Minimize, ArrowRightLeft, Clock } from 'lucide-react';

interface VideoEditorProps {
  videoSrc: string;
  onSave: (editedVideo: any) => void;
  onCancel: () => void;
}

interface EditAction {
  type: 'filter' | 'text' | 'effect' | 'trim' | 'adjustment' | 'transition' | 'speed';
  data: any;
  timestamp: number;
  id: string;
}

interface Transition {
  id: string;
  name: string;
  type: 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve';
  duration: number;
  position: number;
}

interface Keyframe {
  time: number;
  properties: Record<string, any>;
}

interface AnimatedProperty {
  property: string;
  keyframes: Keyframe[];
}

interface Filter {
  id: string;
  name: string;
  icon: React.ReactNode;
  preview: string;
  intensity: number;
}

interface Effect {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: number;
  position: number;
  intensity?: number;
  visible?: boolean;
  locked?: boolean;
  animations?: AnimatedProperty[];
}

const AdvancedVideoEditor: React.FC<VideoEditorProps> = ({
  videoSrc,
  onSave,
  onCancel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('trim');
  const [editHistory, setEditHistory] = useState<EditAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Trim settings
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  
  // Filter settings
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  
  // Text overlay
  const [textOverlays, setTextOverlays] = useState<any[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const [textFont, setTextFont] = useState('Arial');
  const [textStroke, setTextStroke] = useState({ width: 0, color: '#000000' });
  const [textShadow, setTextShadow] = useState({ x: 2, y: 2, blur: 4, color: 'rgba(0,0,0,0.8)' });
  const [textAnimation, setTextAnimation] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  
  // Music settings
  const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(50);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  
  // Effects
  const [appliedEffects, setAppliedEffects] = useState<Effect[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  
  // Advanced features
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewQuality, setPreviewQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Cover settings
  const [coverType, setCoverType] = useState<'auto' | 'frame' | 'upload'>('auto');
  const [coverFrameTime, setCoverFrameTime] = useState(1);
  const [customCover, setCustomCover] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [showCoverPreview, setShowCoverPreview] = useState(false);
  const coverCanvasRef = useRef<HTMLCanvasElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  
  // Performance optimization
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  
  const filters: Filter[] = [
    { id: 'none', name: '原始', icon: <Sun className="w-4 h-4" />, preview: '', intensity: 0 },
    { id: 'vintage', name: '复古', icon: <Star className="w-4 h-4" />, preview: 'sepia(0.8) contrast(1.2)', intensity: 80 },
    { id: 'bw', name: '黑白', icon: <Moon className="w-4 h-4" />, preview: 'grayscale(1)', intensity: 100 },
    { id: 'warm', name: '暖色', icon: <Sun className="w-4 h-4" />, preview: 'hue-rotate(15deg) saturate(1.3)', intensity: 70 },
    { id: 'cool', name: '冷色', icon: <Sparkles className="w-4 h-4" />, preview: 'hue-rotate(-15deg) saturate(1.1)', intensity: 60 },
    { id: 'dramatic', name: '戏剧', icon: <Zap className="w-4 h-4" />, preview: 'contrast(1.5) brightness(0.9)', intensity: 90 },
    { id: 'cinematic', name: '电影', icon: <Square className="w-4 h-4" />, preview: 'contrast(1.3) brightness(0.8) saturate(1.2)', intensity: 85 },
    { id: 'neon', name: '霓虹', icon: <Circle className="w-4 h-4" />, preview: 'hue-rotate(90deg) saturate(2) contrast(1.4)', intensity: 95 },
    { id: 'retro', name: '怀旧', icon: <Triangle className="w-4 h-4" />, preview: 'sepia(0.6) hue-rotate(-30deg) saturate(1.4)', intensity: 75 },
    { id: 'cyberpunk', name: '赛博朋克', icon: <Zap className="w-4 h-4" />, preview: 'hue-rotate(180deg) saturate(1.8) contrast(1.6)', intensity: 90 },
    { id: 'soft', name: '柔和', icon: <Heart className="w-4 h-4" />, preview: 'brightness(1.1) contrast(0.9) saturate(0.8)', intensity: 60 },
    { id: 'vivid', name: '鲜艳', icon: <Smile className="w-4 h-4" />, preview: 'saturate(1.6) contrast(1.2) brightness(1.05)', intensity: 80 }
  ];
  
  const effects: Effect[] = [
    { id: 'zoom', name: '缩放', icon: <Sparkles className="w-4 h-4" />, duration: 2, position: 0, intensity: 50, visible: true, locked: false },
    { id: 'fade', name: '淡入淡出', icon: <Sun className="w-4 h-4" />, duration: 1, position: 0, intensity: 100, visible: true, locked: false },
    { id: 'shake', name: '震动', icon: <Zap className="w-4 h-4" />, duration: 0.5, position: 0, intensity: 30, visible: true, locked: false },
    { id: 'glow', name: '发光', icon: <Star className="w-4 h-4" />, duration: 3, position: 0, intensity: 70, visible: true, locked: false },
    { id: 'blur', name: '模糊', icon: <Circle className="w-4 h-4" />, duration: 1.5, position: 0, intensity: 40, visible: true, locked: false },
    { id: 'rotate', name: '旋转', icon: <RotateCw className="w-4 h-4" />, duration: 2, position: 0, intensity: 60, visible: true, locked: false },
    { id: 'slide', name: '滑动', icon: <Move className="w-4 h-4" />, duration: 1, position: 0, intensity: 80, visible: true, locked: false },
    { id: 'pulse', name: '脉冲', icon: <Heart className="w-4 h-4" />, duration: 0.8, position: 0, intensity: 50, visible: true, locked: false }
  ];
  
  const musicTracks = [
    { id: '1', name: '轻快节拍', artist: '流行音乐', url: '/music/upbeat.mp3', duration: '3:00' },
    { id: '2', name: '抒情背景', artist: '轻音乐', url: '/music/emotional.mp3', duration: '3:20' },
    { id: '3', name: '电子音乐', artist: 'EDM', url: '/music/electronic.mp3', duration: '2:30' },
    { id: '4', name: '古典音乐', artist: '古典', url: '/music/classical.mp3', duration: '4:00' }
  ];
  
  const fonts = ['Arial', 'Helvetica', 'Times New Roman', '微软雅黑', '宋体', 'Impact', 'Comic Sans MS', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Oswald'];
  
  const textAnimations = [
    { id: 'none', name: '无动画' },
    { id: 'fadeIn', name: '淡入' },
    { id: 'slideUp', name: '上滑' },
    { id: 'slideDown', name: '下滑' },
    { id: 'slideLeft', name: '左滑' },
    { id: 'slideRight', name: '右滑' },
    { id: 'zoomIn', name: '放大' },
    { id: 'zoomOut', name: '缩小' },
    { id: 'bounce', name: '弹跳' },
    { id: 'typewriter', name: '打字机' },
    { id: 'glow', name: '发光' },
    { id: 'shake', name: '震动' }
  ];
  
  const transitionTypes = [
    { id: 'fade', name: '淡入淡出', type: 'fade' as const, duration: 1, position: 0 },
    { id: 'slide', name: '滑动', type: 'slide' as const, duration: 0.8, position: 0 },
    { id: 'zoom', name: '缩放', type: 'zoom' as const, duration: 1.2, position: 0 },
    { id: 'wipe', name: '擦除', type: 'wipe' as const, duration: 1, position: 0 },
    { id: 'dissolve', name: '溶解', type: 'dissolve' as const, duration: 1.5, position: 0 }
  ];
  
  const speedOptions = [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
    { value: 3, label: '3x' }
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      // 确保duration是有效的数值
      const videoDuration = video.duration;
      if (isFinite(videoDuration) && videoDuration > 0) {
        setDuration(videoDuration);
        setTrimEnd(videoDuration);
      } else {
        console.warn('Video duration is not valid:', videoDuration);
        // 设置默认值
        setDuration(1);
        setTrimEnd(1);
      }
    };

    const handleTimeUpdate = () => {
      const currentVideoTime = video.currentTime;
      if (isFinite(currentVideoTime) && currentVideoTime >= 0) {
        setCurrentTime(currentVideoTime);
      }
    };

    const handleLoadStart = () => {
      // 重置状态
      setDuration(0);
      setCurrentTime(0);
      setTrimStart(0);
      setTrimEnd(0);
    };

    const handleError = () => {
      console.error('Video loading error');
      // 设置安全的默认值
      setDuration(1);
      setTrimEnd(1);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);

    // 如果视频已经加载，立即处理
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
    };
  }, []);

  const addToHistory = useCallback((action: Omit<EditAction, 'id' | 'timestamp'>) => {
    const newAction: EditAction = {
      ...action,
      id: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    
    // Limit history to 50 actions for performance
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Auto-save after each action
    if (autoSave) {
      setTimeout(() => {
        setLastSaved(new Date());
      }, 1000);
    }
  }, [editHistory, historyIndex, autoSave]);

  const applyHistoryAction = useCallback((action: EditAction, reverse: boolean) => {
    switch (action.type) {
      case 'filter':
        if (reverse) {
          setSelectedFilter('none');
        } else {
          setSelectedFilter(action.data.filterId);
        }
        break;
      case 'text':
        if (reverse) {
          setTextOverlays(prev => prev.filter(t => t.id !== action.data.id));
        } else {
          setTextOverlays(prev => [...prev, action.data]);
        }
        break;
      case 'effect':
        if (reverse) {
          setAppliedEffects(prev => prev.filter(e => e.id !== action.data.id));
        } else {
          setAppliedEffects(prev => [...prev, action.data]);
        }
        break;
      case 'speed':
        if (reverse) {
          setPlaybackSpeed(1);
        } else {
          setPlaybackSpeed(action.data.speed);
        }
        break;
      case 'transition':
        if (reverse) {
          setTransitions(prev => prev.filter(t => t.id !== action.data.id));
        } else {
          setTransitions(prev => [...prev, action.data]);
        }
        break;
    }
  }, []);

  const undo = useCallback(() => {
    if (historyIndex > -1) {
      const previousIndex = historyIndex - 1;
      setHistoryIndex(previousIndex);
      
      // Apply previous state by reversing the current action
      if (previousIndex >= 0) {
        const actionToReverse = editHistory[historyIndex];
        applyHistoryAction(actionToReverse, true);
      }
    }
  }, [historyIndex, editHistory, applyHistoryAction]);

  const redo = useCallback(() => {
    if (historyIndex < editHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      
      // Apply next state
      const actionToApply = editHistory[nextIndex];
      applyHistoryAction(actionToApply, false);
    }
  }, [historyIndex, editHistory, applyHistoryAction]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.playbackRate = playbackSpeed;
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, playbackSpeed]);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    // 验证输入的时间值是否有效
    if (!isFinite(time) || isNaN(time)) {
      console.warn('Invalid time value provided to seekTo:', time);
      return;
    }
    
    // 验证duration是否有效
    if (!isFinite(duration) || isNaN(duration) || duration <= 0) {
      console.warn('Invalid duration for seekTo operation:', duration);
      return;
    }
    
    const clampedTime = Math.max(0, Math.min(duration, time));
    video.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }, [duration]);

  const applyFilter = useCallback((filter: Filter) => {
    setSelectedFilter(filter.id);
    addToHistory({
      type: 'filter',
      data: { filterId: filter.id, intensity: filter.intensity }
    });
  }, [addToHistory]);

  const addTextOverlay = useCallback(() => {
    if (!currentText.trim()) return;
    
    const newOverlay = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: currentText,
      color: textColor,
      size: textSize,
      font: textFont,
      position: { x: 50, y: 50 },
      startTime: currentTime,
      duration: 3,
      animation: textAnimation,
      stroke: textStroke,
      shadow: textShadow,
      visible: true,
      locked: false
    };
    
    setTextOverlays(prev => [...prev, newOverlay]);
    setCurrentText('');
    
    addToHistory({
      type: 'text',
      data: newOverlay
    });
  }, [currentText, textColor, textSize, textFont, currentTime, textAnimation, textStroke, textShadow, addToHistory]);

  // Cover functions
  const generateCoverFromFrame = useCallback((timeInSeconds: number) => {
    const video = videoRef.current;
    const canvas = coverCanvasRef.current;
    
    if (!video || !canvas) return;
    
    const originalTime = video.currentTime;
    video.currentTime = timeInSeconds;
    
    const handleSeeked = () => {
      const ctx = canvas.getContext('2d');
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const coverDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCoverPreview(coverDataUrl);
        setShowCoverPreview(true);
      }
      video.currentTime = originalTime;
      video.removeEventListener('seeked', handleSeeked);
    };
    
    video.addEventListener('seeked', handleSeeked);
  }, []);

  const handleCoverUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCustomCover(result);
        setCoverPreview(result);
        setShowCoverPreview(true);
        setCoverType('upload');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const selectFrameAsCover = useCallback((timeInSeconds: number) => {
    setCoverFrameTime(timeInSeconds);
    setCoverType('frame');
    generateCoverFromFrame(timeInSeconds);
  }, [generateCoverFromFrame]);

  const getCurrentCover = useCallback(() => {
    switch (coverType) {
      case 'upload':
        return customCover;
      case 'frame':
        return coverPreview;
      case 'auto':
      default:
        return coverPreview || '';
    }
  }, [coverType, customCover, coverPreview]);

  // Auto-generate cover when video loads
  useEffect(() => {
    if (duration > 0 && coverType === 'auto') {
      const frameTime = duration > 1 ? 1 : duration / 2;
      setCoverFrameTime(frameTime);
      setTimeout(() => generateCoverFromFrame(frameTime), 500);
    }
  }, [duration, coverType, generateCoverFromFrame]);

  const addEffect = useCallback((effect: Effect) => {
    const newEffect = {
      ...effect,
      position: currentTime,
      id: `${effect.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setAppliedEffects(prev => [...prev, newEffect]);
    
    addToHistory({
      type: 'effect',
      data: newEffect
    });
  }, [currentTime, addToHistory]);
  
  const updateTextOverlay = useCallback((id: string, updates: Partial<any>) => {
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  }, []);
  
  const removeTextOverlay = useCallback((id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
  }, []);
  
  const duplicateTextOverlay = useCallback((id: string) => {
    const overlay = textOverlays.find(t => t.id === id);
    if (overlay) {
      const newOverlay = {
        ...overlay,
        id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: { x: overlay.position.x + 10, y: overlay.position.y + 10 }
      };
      setTextOverlays(prev => [...prev, newOverlay]);
    }
  }, [textOverlays]);
  
  const toggleEffectVisibility = useCallback((id: string) => {
    setAppliedEffects(prev => prev.map(effect => 
      effect.id === id ? { ...effect, visible: !effect.visible } : effect
    ));
  }, []);
  
  const toggleTextVisibility = useCallback((id: string) => {
     setTextOverlays(prev => prev.map(overlay => 
       overlay.id === id ? { ...overlay, visible: !overlay.visible } : overlay
     ));
   }, []);
  
  const updateEffectIntensity = useCallback((id: string, intensity: number) => {
    setAppliedEffects(prev => prev.map(effect => 
      effect.id === id ? { ...effect, intensity } : effect
    ));
  }, []);
  
  const changePlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
    }
    
    addToHistory({
      type: 'speed',
      data: { speed }
    });
  }, [addToHistory]);
  
  const addTransition = useCallback((type: string, position: number, duration: number = 1.0) => {
    const transitionType = transitionTypes.find(t => t.id === type);
    const newTransition: Transition = {
      id: Date.now().toString(),
      type: transitionType?.type || 'fade',
      name: transitionType?.name || type,
      duration,
      position
    };
    setTransitions(prev => [...prev, newTransition]);
    addToHistory({
      type: 'transition',
      data: newTransition
    });
  }, [addToHistory]);
  
  const removeTransition = useCallback((id: string) => {
    setTransitions(prev => prev.filter(t => t.id !== id));
    addToHistory({
      type: 'transition',
      data: { id }
    });
  }, [addToHistory]);
  
  const updateTransition = useCallback((id: string, updates: Partial<Transition>) => {
    setTransitions(prev => prev.map(transition => 
      transition.id === id ? { ...transition, ...updates } : transition
    ));
  }, []);
  
  const duplicateTransition = useCallback((transition: Transition) => {
    const duplicated = {
      ...transition,
      id: Date.now().toString(),
      position: currentTime
    };
    setTransitions(prev => [...prev, duplicated]);
    addToHistory({
      type: 'transition',
      data: duplicated
    });
  }, [currentTime, addToHistory]);

  const formatTime = (time: number) => {
    // 确保时间值是有效的
    const safeTime = isFinite(time) && time >= 0 ? time : 0;
    const minutes = Math.floor(safeTime / 60);
    const seconds = Math.floor(safeTime % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVideoStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    
    // Base adjustments
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
    
    // Apply selected filter
    if (selectedFilter && selectedFilter !== 'none') {
      const filter = filters.find(f => f.id === selectedFilter);
      if (filter) {
        filterString = `${filter.preview} ${filterString}`;
      }
    }
    
    // Apply active effects
    const activeEffects = appliedEffects.filter(effect => 
      effect.visible && 
      currentTime >= effect.position && 
      currentTime <= effect.position + effect.duration
    );
    
    activeEffects.forEach(effect => {
      const progress = (currentTime - effect.position) / effect.duration;
      const intensity = (effect.intensity || 50) / 100;
      
      switch (effect.id.split('_')[0]) {
        case 'glow':
          style.boxShadow = `0 0 ${20 * intensity}px rgba(255, 255, 255, ${0.8 * intensity})`;
          break;
        case 'blur':
          filterString += ` blur(${5 * intensity}px)`;
          break;
        case 'zoom':
          const scale = 1 + (0.2 * intensity * Math.sin(progress * Math.PI));
          style.transform = `scale(${scale})`;
          break;
        case 'shake':
          const shakeX = Math.sin(progress * 20) * 5 * intensity;
          const shakeY = Math.cos(progress * 20) * 5 * intensity;
          style.transform = `translate(${shakeX}px, ${shakeY}px)`;
          break;
        case 'rotate':
          const rotation = progress * 360 * intensity;
          style.transform = `rotate(${rotation}deg)`;
          break;
        case 'pulse':
          const pulseScale = 1 + (0.1 * intensity * Math.sin(progress * Math.PI * 4));
          style.transform = `scale(${pulseScale})`;
          break;
      }
    });
    
    style.filter = filterString;
    style.transition = 'all 0.1s ease-out';
    
    return style;
  }, [selectedFilter, brightness, contrast, saturation, blur, appliedEffects, currentTime, filters]);

  const renderTimeline = useCallback(() => {
    // 安全计算百分比，确保所有值都是有限的
    const safeCurrentTime = isFinite(currentTime) ? currentTime : 0;
    const safeDuration = isFinite(duration) && duration > 0 ? duration : 1;
    const safeTrimStart = isFinite(trimStart) ? trimStart : 0;
    const safeTrimEnd = isFinite(trimEnd) ? trimEnd : safeDuration;
    
    const progressPercentage = (safeCurrentTime / safeDuration) * 100;
    const trimStartPercentage = (safeTrimStart / safeDuration) * 100;
    const trimEndPercentage = (safeTrimEnd / safeDuration) * 100;
    
    const handleTimelineClick = (e: React.MouseEvent) => {
      // 首先检查视频是否已加载且duration有效
      if (!isFinite(duration) || duration <= 0) {
        console.warn('Cannot interact with timeline: invalid duration', duration);
        return;
      }
      
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      
      // 验证点击位置和容器宽度
      if (!isFinite(clickX) || rect.width <= 0) {
        console.warn('Invalid click position or container width');
        return;
      }
      
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = percentage * duration;
      
      // 最终验证计算出的时间值
      if (!isFinite(newTime) || newTime < 0) {
        console.warn('Calculated time is not valid:', newTime);
        return;
      }
      
      seekTo(newTime);
    };
    
    return (
      <div 
        className="relative h-20 bg-gray-800 rounded-lg overflow-hidden cursor-pointer select-none"
        onClick={handleTimelineClick}
      >
        {/* Timeline background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-purple-900 opacity-30"></div>
        
        {/* Trim indicators */}
        <div 
          className="absolute top-0 bottom-0 bg-yellow-500 opacity-40 border-l-2 border-r-2 border-yellow-400"
          style={{ left: `${trimStartPercentage}%`, width: `${trimEndPercentage - trimStartPercentage}%` }}
        >
          <div className="absolute top-1 left-1 text-xs text-yellow-200 font-medium">剪辑区域</div>
        </div>
        
        {/* Transitions on timeline */}
        {transitions.map((transition) => {
          const safePosition = isFinite(transition.position) ? transition.position : 0;
          const safeDur = isFinite(transition.duration) ? transition.duration : 1;
          const transitionStart = (safePosition / safeDuration) * 100;
          const transitionWidth = (safeDur / safeDuration) * 100;
          const transitionName = transitionTypes.find(t => t.id === transition.type)?.name || transition.type;
          
          // 确保百分比值是有效的
          if (!isFinite(transitionStart) || !isFinite(transitionWidth)) {
            return null;
          }
          
          return (
            <div
              key={transition.id}
              className="absolute top-1 h-2 bg-purple-500 rounded opacity-90 border border-purple-400"
              style={{ left: `${Math.max(0, Math.min(100, transitionStart))}%`, width: `${Math.max(0, Math.min(100, transitionWidth))}%` }}
              title={`转场: ${transitionName}`}
            />
          );
        })}
        
        {/* Effects on timeline */}
        {appliedEffects.map((effect) => {
          const safeEffectPosition = isFinite(effect.position) ? effect.position : 0;
          const safeEffectDuration = isFinite(effect.duration) ? effect.duration : 1;
          const effectStart = (safeEffectPosition / safeDuration) * 100;
          const effectWidth = (safeEffectDuration / safeDuration) * 100;
          const isActive = safeCurrentTime >= safeEffectPosition && safeCurrentTime <= safeEffectPosition + safeEffectDuration;
          
          // 确保百分比值是有效的
          if (!isFinite(effectStart) || !isFinite(effectWidth)) {
            return null;
          }
          
          return (
            <div
              key={effect.id}
              className={`absolute top-4 h-3 rounded opacity-90 border ${
                isActive ? 'bg-green-400 border-green-300 shadow-lg' : 'bg-green-500 border-green-400'
              } ${!effect.visible ? 'opacity-40' : ''}`}
              style={{ left: `${Math.max(0, Math.min(100, effectStart))}%`, width: `${Math.max(0, Math.min(100, effectWidth))}%` }}
              title={`特效: ${effect.name} (${effect.intensity || 50}%)`}
            />
          );
        })}
        
        {/* Text overlays on timeline */}
        {textOverlays.map((overlay) => {
          const safeStartTime = isFinite(overlay.startTime) ? overlay.startTime : 0;
          const safeOverlayDuration = isFinite(overlay.duration) ? overlay.duration : 1;
          const overlayStart = (safeStartTime / safeDuration) * 100;
          const overlayWidth = (safeOverlayDuration / safeDuration) * 100;
          const isActive = safeCurrentTime >= safeStartTime && safeCurrentTime <= safeStartTime + safeOverlayDuration;
          
          // 确保百分比值是有效的
          if (!isFinite(overlayStart) || !isFinite(overlayWidth)) {
            return null;
          }
          
          return (
            <div
              key={overlay.id}
              className={`absolute bottom-4 h-3 rounded opacity-90 border ${
                isActive ? 'bg-blue-400 border-blue-300 shadow-lg' : 'bg-blue-500 border-blue-400'
              } ${!overlay.visible ? 'opacity-40' : ''}`}
              style={{ left: `${Math.max(0, Math.min(100, overlayStart))}%`, width: `${Math.max(0, Math.min(100, overlayWidth))}%` }}
              title={`文字: ${overlay.text}`}
            />
          );
        })}
        
        {/* Current time indicator */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-red-500 shadow-lg z-10"
          style={{ left: `${Math.max(0, Math.min(100, isFinite(progressPercentage) ? progressPercentage : 0))}%` }}
        >
          <div className="absolute -top-6 -left-8 bg-red-500 text-white text-xs px-2 py-1 rounded">
            {formatTime(safeCurrentTime)}
          </div>
        </div>
        
        {/* Time markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-300 px-2 py-1 bg-gray-900 bg-opacity-50">
          <span>{formatTime(0)}</span>
          <span>{formatTime(safeDuration / 4)}</span>
          <span>{formatTime(safeDuration / 2)}</span>
          <span>{formatTime(3 * safeDuration / 4)}</span>
          <span>{formatTime(safeDuration)}</span>
        </div>
        
        {/* Playback speed indicator */}
        {playbackSpeed !== 1 && (
          <div className="absolute top-1 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            {playbackSpeed}x
          </div>
        )}
      </div>
    );
  }, [duration, currentTime, trimStart, trimEnd, transitions, appliedEffects, textOverlays, playbackSpeed, seekTo, transitionTypes]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trim':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">视频剪辑</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">播放速度</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => changePlaybackSpeed(parseFloat(e.target.value))}
                  className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
                >
                  {speedOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">开始时间</label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{formatTime(trimStart)}</span>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">结束时间</label>
                <input
                  type="range"
                  min={trimStart}
                  max={duration}
                  step="0.1"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{formatTime(trimEnd)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">剪辑长度: {formatTime(trimEnd - trimStart)}</span>
                <button
                  onClick={() => {
                    setTrimStart(0);
                    setTrimEnd(duration);
                  }}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  重置
                </button>
              </div>
              
              {/* Quick trim presets */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button
                  onClick={() => {
                    setTrimStart(0);
                    setTrimEnd(duration * 0.25);
                  }}
                  className="bg-gray-700 text-white text-xs py-1 px-2 rounded hover:bg-gray-600"
                >
                  前25%
                </button>
                <button
                  onClick={() => {
                    setTrimStart(duration * 0.25);
                    setTrimEnd(duration * 0.75);
                  }}
                  className="bg-gray-700 text-white text-xs py-1 px-2 rounded hover:bg-gray-600"
                >
                  中间50%
                </button>
                <button
                  onClick={() => {
                    setTrimStart(duration * 0.75);
                    setTrimEnd(duration);
                  }}
                  className="bg-gray-700 text-white text-xs py-1 px-2 rounded hover:bg-gray-600"
                >
                  后25%
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'filters':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium">滤镜效果</h3>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => applyFilter(filter)}
                  className={`p-2 rounded-lg border transition-all relative ${
                    selectedFilter === filter.id
                      ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                      : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    {filter.icon}
                    <span className="text-xs text-white">{filter.name}</span>
                    {filter.intensity > 0 && (
                      <span className="text-xs text-gray-400">{filter.intensity}%</span>
                    )}
                  </div>
                  {selectedFilter === filter.id && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">亮度</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{brightness}%</span>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">对比度</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{contrast}%</span>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">饱和度</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{saturation}%</span>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">模糊</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={blur}
                  onChange={(e) => setBlur(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{blur}px</span>
              </div>
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium">文字叠加</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="输入文字内容"
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">字体</label>
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="w-full bg-gray-700 text-white px-2 py-1 text-sm rounded border border-gray-600"
                  >
                    {fonts.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">大小</label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={textSize}
                    onChange={(e) => setTextSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{textSize}px</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">文字颜色</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-8 rounded border border-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-1">动画效果</label>
                  <select
                    value={textAnimation || 'none'}
                    onChange={(e) => setTextAnimation(e.target.value === 'none' ? null : e.target.value)}
                    className="w-full bg-gray-700 text-white px-2 py-1 text-sm rounded border border-gray-600"
                  >
                    {textAnimations.map(animation => (
                      <option key={animation.id} value={animation.id}>{animation.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Text stroke settings */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">描边设置</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">宽度</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={textStroke.width}
                      onChange={(e) => setTextStroke(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{textStroke.width}px</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">颜色</label>
                    <input
                      type="color"
                      value={textStroke.color}
                      onChange={(e) => setTextStroke(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-6 rounded border border-gray-600"
                    />
                  </div>
                </div>
              </div>
              
              {/* Text shadow settings */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">阴影设置</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">X偏移</label>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      value={textShadow.x}
                      onChange={(e) => setTextShadow(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{textShadow.x}px</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Y偏移</label>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      value={textShadow.y}
                      onChange={(e) => setTextShadow(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{textShadow.y}px</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">模糊</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={textShadow.blur}
                      onChange={(e) => setTextShadow(prev => ({ ...prev, blur: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{textShadow.blur}px</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">颜色</label>
                    <input
                      type="color"
                      value={textShadow.color.replace('rgba(0,0,0,0.8)', '#000000')}
                      onChange={(e) => setTextShadow(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-6 rounded border border-gray-600"
                    />
                  </div>
                </div>
              </div>
              
              <button
                onClick={addTextOverlay}
                disabled={!currentText.trim()}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Type className="w-4 h-4" />
                <span>添加文字</span>
              </button>
            </div>
            
            {textOverlays.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-2">已添加的文字</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {textOverlays.map((overlay) => (
                    <div key={overlay.id} className={`bg-gray-700 p-2 rounded border ${
                      selectedTextId === overlay.id ? 'border-blue-500' : 'border-gray-600'
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white text-sm font-medium truncate flex-1">{overlay.text}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => toggleTextVisibility(overlay.id)}
                            className={`p-1 rounded ${overlay.visible ? 'text-blue-400' : 'text-gray-500'}`}
                            title={overlay.visible ? '隐藏' : '显示'}
                          >
                            {overlay.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => duplicateTextOverlay(overlay.id)}
                            className="p-1 text-green-400 hover:text-green-300 rounded"
                            title="复制"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeTextOverlay(overlay.id)}
                            className="p-1 text-red-400 hover:text-red-300 rounded"
                            title="删除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>@{formatTime(overlay.startTime)}</span>
                        <span>{overlay.font} {overlay.size}px</span>
                        {overlay.animation && <span>{overlay.animation}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'music':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium flex items-center space-x-2">
              <Music className="w-4 h-4" />
              <span>背景音乐</span>
            </h3>
            
            {/* Music upload */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">上传音乐文件</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Handle music file upload
                    console.log('Music file uploaded:', file.name);
                  }
                }}
                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {musicTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedMusic(track.id)}
                    className={`p-3 rounded border text-left transition-colors relative ${
                      selectedMusic === track.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{track.name}</div>
                        <div className="text-sm opacity-75">{track.artist}</div>
                        <div className="text-xs opacity-60 mt-1">{track.duration}</div>
                      </div>
                      {selectedMusic === track.id && (
                        <div className="flex items-center space-x-1">
                          <Volume2 className="w-3 h-3" />
                          <span className="text-xs">{musicVolume}%</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Simple waveform visualization */}
                    {selectedMusic === track.id && (
                      <div className="mt-2 flex items-center space-x-1 h-6">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={i}
                            className="bg-blue-400 rounded-full"
                            style={{
                              width: '2px',
                              height: `${Math.random() * 20 + 4}px`,
                              opacity: 0.7
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {selectedMusic && (
                <div className="space-y-3 p-3 bg-gray-800 rounded border border-gray-600">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2 flex items-center space-x-2">
                      <Volume2 className="w-4 h-4" />
                      <span>音量控制</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>静音</span>
                      <span>{musicVolume}%</span>
                      <span>最大</span>
                    </div>
                  </div>
                  
                  {/* Fade effects */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">淡入时长</label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        defaultValue="1"
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">1.0s</span>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">淡出时长</label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        defaultValue="1"
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">1.0s</span>
                    </div>
                  </div>
                  
                  {/* Audio timing */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">开始时间</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        defaultValue="0"
                        className="w-full bg-gray-700 text-white px-2 py-1 text-sm rounded border border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">循环播放</label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-600 bg-gray-700 text-blue-600"
                        />
                        <span className="text-sm text-gray-300">启用</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Music controls */}
                  <div className="flex justify-center space-x-2 pt-2">
                    <button className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                      <Play className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                      <Pause className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'effects':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>视觉特效</span>
            </h3>
            
            {/* Effect categories */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded">全部</button>
              <button className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">动画</button>
              <button className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">滤镜</button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {effects.map((effect) => (
                <button
                  key={effect.id}
                  onClick={() => addEffect(effect)}
                  className="bg-gray-700 text-white p-3 rounded hover:bg-gray-600 transition-colors text-sm relative group"
                >
                  <div className="flex flex-col items-center space-y-1">
                    {effect.icon}
                    <span className="text-xs">{effect.name}</span>
                    <span className="text-xs text-gray-400">{effect.duration}s</span>
                  </div>
                  
                  {/* Preview indicator */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </button>
              ))}
            </div>
            
            {appliedEffects.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>已应用的特效</span>
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {appliedEffects.map((effect) => (
                    <div key={effect.id} className={`bg-gray-700 p-3 rounded border ${
                      effect.visible ? 'border-gray-600' : 'border-gray-700 opacity-60'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white text-sm font-medium">{effect.name}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => toggleEffectVisibility(effect.id)}
                            className={`p-1 rounded ${effect.visible ? 'text-blue-400' : 'text-gray-500'}`}
                            title={effect.visible ? '隐藏' : '显示'}
                          >
                            {effect.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => {
                              const newEffect = { ...effect, id: Date.now().toString() };
                              setAppliedEffects(prev => [...prev, newEffect]);
                            }}
                            className="p-1 text-green-400 hover:text-green-300 rounded"
                            title="复制"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setAppliedEffects(appliedEffects.filter(e => e.id !== effect.id))}
                            className="p-1 text-red-400 hover:text-red-300 rounded"
                            title="删除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Effect intensity control */}
                      <div className="mb-2">
                        <label className="block text-xs text-gray-400 mb-1">强度</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={effect.intensity || 50}
                          onChange={(e) => updateEffectIntensity(effect.id, parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>0%</span>
                          <span>{effect.intensity || 50}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      
                      {/* Effect timing */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">开始时间</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            defaultValue={effect.position || 0}
                            className="w-full bg-gray-800 text-white px-2 py-1 text-xs rounded border border-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">持续时间</label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            defaultValue={effect.duration || 2}
                            className="w-full bg-gray-800 text-white px-2 py-1 text-xs rounded border border-gray-600"
                          />
                        </div>
                      </div>
                      
                      {/* Effect preview */}
                      <div className="mt-2 flex justify-between items-center">
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>@{formatTime(effect.position || 0)}</span>
                        </div>
                        <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                          预览
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'transitions':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium">转场效果</h3>
            
            {/* Transition categories */}
            <div className="flex space-x-2">
              {['全部', '淡入淡出', '滑动', '缩放', '擦除'].map((category) => (
                <button
                  key={category}
                  className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Available transitions */}
            <div className="space-y-3">
              <h4 className="text-sm text-gray-300">可用转场</h4>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {transitionTypes.map((transition) => (
                   <button
                     key={transition.id}
                     onClick={() => addTransition(transition.id, currentTime, 1.0)}
                     className="p-2 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors flex items-center space-x-2"
                   >
                     <ArrowRightLeft className="w-3 h-3" />
                     <span>{transition.name}</span>
                   </button>
                 ))}
              </div>
            </div>
            
            {/* Transition settings */}
            <div className="space-y-3">
              <h4 className="text-sm text-gray-300">转场设置</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">默认时长</label>
                  <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    defaultValue="1.0"
                    className="w-full bg-gray-800 text-white px-2 py-1 text-xs rounded border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">位置</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={currentTime.toFixed(1)}
                    className="w-full bg-gray-800 text-white px-2 py-1 text-xs rounded border border-gray-600"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-transitions"
                  className="rounded"
                />
                <label htmlFor="auto-transitions" className="text-xs text-gray-300">
                  自动添加转场
                </label>
              </div>
            </div>
            
            {/* Applied transitions */}
            {transitions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm text-gray-300">已添加转场</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {transitions.map((transition) => (
                    <div key={transition.id} className="bg-gray-800 p-2 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-xs font-medium">
                          {transitionTypes.find(t => t.id === transition.type)?.name || transition.type}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                             onClick={() => duplicateTransition(transition)}
                             className="p-1 text-green-400 hover:text-green-300 rounded"
                             title="复制"
                           >
                             <Copy className="w-3 h-3" />
                           </button>
                           <button
                             onClick={() => removeTransition(transition.id)}
                             className="p-1 text-red-400 hover:text-red-300 rounded"
                             title="删除"
                           >
                             <Trash2 className="w-3 h-3" />
                           </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label className="block text-xs text-gray-400 mb-1">位置</label>
                           <input
                             type="number"
                             min="0"
                             step="0.1"
                             value={transition.position}
                             onChange={(e) => updateTransition(transition.id, { position: parseFloat(e.target.value) })}
                             className="w-full bg-gray-700 text-white px-2 py-1 text-xs rounded border border-gray-600"
                           />
                         </div>
                         <div>
                           <label className="block text-xs text-gray-400 mb-1">时长</label>
                           <input
                             type="number"
                             min="0.1"
                             max="5"
                             step="0.1"
                             value={transition.duration}
                             onChange={(e) => updateTransition(transition.id, { duration: parseFloat(e.target.value) })}
                             className="w-full bg-gray-700 text-white px-2 py-1 text-xs rounded border border-gray-600"
                           />
                         </div>
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>@{formatTime(transition.position)}</span>
                        </div>
                        <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                          预览
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'cover':
        return (
          <div className="space-y-4">
            <h3 className="text-white font-medium">封面设置</h3>
            
            {/* Cover type selection */}
            <div className="space-y-3">
              <h4 className="text-sm text-gray-300">封面类型</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCoverType('auto');
                    if (duration > 0) {
                      const frameTime = duration > 1 ? 1 : duration / 2;
                      setCoverFrameTime(frameTime);
                      generateCoverFromFrame(frameTime);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    coverType === 'auto'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${
                    coverType === 'auto' ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${
                      coverType === 'auto' ? 'text-blue-400' : 'text-white'
                    }`}>
                      自动封面
                    </div>
                    <div className="text-sm text-gray-400">使用视频第1秒作为封面</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setCoverType('frame')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    coverType === 'frame'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <SkipForward className={`w-4 h-4 ${
                    coverType === 'frame' ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${
                      coverType === 'frame' ? 'text-blue-400' : 'text-white'
                    }`}>
                      选择帧
                    </div>
                    <div className="text-sm text-gray-400">从视频中选择特定帧</div>
                  </div>
                </button>
                
                <button
                  onClick={() => coverFileInputRef.current?.click()}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    coverType === 'upload'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <Download className={`w-4 h-4 ${
                    coverType === 'upload' ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${
                      coverType === 'upload' ? 'text-blue-400' : 'text-white'
                    }`}>
                      上传封面
                    </div>
                    <div className="text-sm text-gray-400">上传自定义图片</div>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Frame selection for 'frame' type */}
            {coverType === 'frame' && duration > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm text-gray-300">选择时间点</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={coverFrameTime}
                    onChange={(e) => {
                      const time = parseFloat(e.target.value);
                      setCoverFrameTime(time);
                      generateCoverFromFrame(time);
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0s</span>
                    <span className="text-white">{formatTime(coverFrameTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const newTime = Math.max(0, coverFrameTime - 1);
                      setCoverFrameTime(newTime);
                      generateCoverFromFrame(newTime);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    <SkipBack className="w-4 h-4" />
                    <span className="text-sm">-1s</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const newTime = Math.min(duration, coverFrameTime + 1);
                      setCoverFrameTime(newTime);
                      generateCoverFromFrame(newTime);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-sm">+1s</span>
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setCoverFrameTime(currentTime);
                    generateCoverFromFrame(currentTime);
                  }}
                  className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  使用当前时间点
                </button>
              </div>
            )}
            
            {/* Cover preview */}
            {showCoverPreview && coverPreview && (
              <div className="space-y-3">
                <h4 className="text-sm text-gray-300">封面预览</h4>
                <div className="relative">
                  <img
                    src={coverPreview}
                    alt="封面预览"
                    className="w-full h-32 object-cover rounded-lg bg-gray-800"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {coverType === 'auto' ? '自动' : coverType === 'frame' ? `@${formatTime(coverFrameTime)}` : '自定义'}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowCoverPreview(false)}
                    className="flex-1 p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    隐藏预览
                  </button>
                  <button
                    onClick={() => {
                      if (coverType === 'frame') {
                        generateCoverFromFrame(coverFrameTime);
                      } else if (coverType === 'auto') {
                        const frameTime = duration > 1 ? 1 : duration / 2;
                        generateCoverFromFrame(frameTime);
                      }
                    }}
                    className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    刷新预览
                  </button>
                </div>
              </div>
            )}
            
            {/* Cover settings */}
            <div className="space-y-3">
              <h4 className="text-sm text-gray-300">封面设置</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">显示封面预览</span>
                  <button
                    onClick={() => setShowCoverPreview(!showCoverPreview)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      showCoverPreview ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      showCoverPreview ? 'translate-x-7' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
                
                <div className="text-xs text-gray-400">
                  封面将在视频发布时使用，建议选择能代表视频内容的画面。
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden" style={{ height: '100vh', maxHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
          <h1 className="text-white text-lg font-semibold">视频编辑器</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            disabled={historyIndex < 0}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= editHistory.length - 1}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <Redo className="w-5 h-5" />
          </button>
          <button
            onClick={async () => {
              try {
                // 检查是否有实际的编辑操作
                const hasEdits = trimStart > 0 || trimEnd < duration || 
                               brightness !== 1 || contrast !== 1 || saturation !== 1 || blur !== 0 ||
                               selectedFilter !== 'none' || textOverlays.length > 0 || 
                               appliedEffects.length > 0 || volume !== 1 || isMuted;
                
                let finalVideoUrl = videoSrc;
                
                // 如果有编辑操作，尝试生成编辑后的视频
                if (hasEdits) {
                  console.log('检测到视频编辑，准备应用编辑效果...');
                  
                  // 这里应该调用视频处理服务来生成编辑后的视频
                  // 由于浏览器限制，我们暂时保持原始URL，但标记为已编辑
                  console.log('编辑参数:', {
                    trimStart, trimEnd, brightness, contrast, saturation, blur,
                    selectedFilter, textOverlays: textOverlays.length, 
                    effects: appliedEffects.length, volume, isMuted
                  });
                  
                  // 在实际应用中，这里应该:
                  // 1. 将视频和编辑参数发送到服务器
                  // 2. 服务器处理视频并返回新的URL
                  // 3. 或者使用WebAssembly在客户端处理
                  
                  // 目前我们保持原始URL，但在VideoPublish中会应用编辑效果
                  finalVideoUrl = videoSrc;
                }
                
                // 构建编辑后的视频数据
                const editedVideoData = {
                  videoUrl: finalVideoUrl,
                  originalVideoUrl: videoSrc,
                  duration: duration,
                  trimStart: trimStart,
                  trimEnd: trimEnd,
                  filters: {
                    brightness: brightness,
                    contrast: contrast,
                    saturation: saturation,
                    blur: blur,
                    selectedFilter: selectedFilter
                  },
                  textOverlays: textOverlays,
                  effects: appliedEffects,
                  transitions: transitions,
                  editHistory: editHistory,
                  volume: volume,
                  isMuted: isMuted,
                  cover: {
                    type: coverType,
                    frameTime: coverFrameTime,
                    customCover: customCover,
                    preview: getCurrentCover()
                  },
                  hasEdits: hasEdits,
                  editedAt: new Date().toISOString()
                };
                
                console.log('保存编辑后的视频数据:', editedVideoData);
                onSave(editedVideoData);
              } catch (error) {
                console.error('保存编辑失败:', error);
                // 即使出错也要保存基本数据
                const basicVideoData = {
                  videoUrl: videoSrc,
                  originalVideoUrl: videoSrc,
                  duration: duration,
                  hasEdits: false,
                  editedAt: new Date().toISOString()
                };
                onSave(basicVideoData);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Video Preview */}
        <div className="flex-1 flex flex-col bg-black overflow-hidden min-h-0">
          <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-hidden min-h-[200px] md:min-h-0">
            <div className="relative max-w-full max-h-full">
              <video
                ref={videoRef}
                src={videoSrc}
                style={getVideoStyle}
                className="max-w-full max-h-full rounded-lg"
                onClick={togglePlay}
              />
              
              {/* Text overlays preview */}
              {textOverlays.map((overlay) => {
                if (currentTime >= overlay.startTime && currentTime <= overlay.startTime + overlay.duration) {
                  return (
                    <div
                      key={overlay.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${overlay.position.x}%`,
                        top: `${overlay.position.y}%`,
                        color: overlay.color,
                        fontSize: `${overlay.size}px`,
                        fontFamily: overlay.font,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                      }}
                    >
                      {overlay.text}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
          
          {/* Video Controls */}
          <div className="p-2 md:p-4 bg-gray-900 flex-shrink-0">
            <div className="mb-4">
              {renderTimeline()}
            </div>
            
            <div className="flex items-center justify-center space-x-2 md:space-x-4">
              <button
                onClick={() => {
                  const safeCurrentTime = isFinite(currentTime) ? currentTime : 0;
                  seekTo(Math.max(0, safeCurrentTime - 10));
                }}
                className="text-white hover:text-blue-400 transition-colors"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button
                onClick={togglePlay}
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              
              <button
                onClick={() => {
                  const safeCurrentTime = isFinite(currentTime) ? currentTime : 0;
                  const safeDuration = isFinite(duration) ? duration : 0;
                  seekTo(Math.min(safeDuration, safeCurrentTime + 10));
                }}
                className="text-white hover:text-blue-400 transition-colors"
              >
                <SkipForward className="w-6 h-6" />
              </button>
              
              <div className="flex items-center space-x-1 md:space-x-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 md:w-20"
                />
              </div>
              
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Editing Panel */}
        <div className="w-full md:w-80 bg-gray-900 border-l md:border-l border-t md:border-t-0 border-gray-700 flex flex-col overflow-hidden min-h-0">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700 flex-shrink-0 overflow-x-auto">
            {[
              { id: 'trim', icon: <Scissors className="w-4 h-4" />, label: '剪辑' },
              { id: 'filters', icon: <Filter className="w-4 h-4" />, label: '滤镜' },
              { id: 'text', icon: <Type className="w-4 h-4" />, label: '文字' },
              { id: 'music', icon: <Music className="w-4 h-4" />, label: '音乐' },
              { id: 'effects', icon: <Sparkles className="w-4 h-4" />, label: '特效' },
              { id: 'transitions', icon: <ArrowRightLeft className="w-4 h-4" />, label: '转场' },
              { id: 'cover', icon: <Square className="w-4 h-4" />, label: '封面' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[60px] p-2 md:p-3 flex flex-col items-center space-y-1 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.icon}
                <span className="text-xs whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="p-4 pb-20 md:pb-4">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden elements for cover functionality */}
      <canvas ref={coverCanvasRef} className="hidden" />
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverUpload}
        className="hidden"
      />
    </div>
  );
};

export default AdvancedVideoEditor;