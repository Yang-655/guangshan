// TTS语音服务 - 集成Web Speech API和第三方TTS服务

export interface TTSConfig {
  voice?: SpeechSynthesisVoice;
  rate: number; // 语速 0.1-10
  pitch: number; // 音调 0-2
  volume: number; // 音量 0-1
  lang: string; // 语言代码
}

export interface TTSQueueItem {
  id: string;
  text: string;
  config: TTSConfig;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

class TTSService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private queue: TTSQueueItem[] = [];
  private isPlaying = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private config: TTSConfig = {
    rate: 1,
    pitch: 1,
    volume: 0.8,
    lang: 'zh-CN'
  };
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    // 监听语音列表变化
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  // 加载可用语音
  private loadVoices(): void {
    this.voices = this.synthesis.getVoices();
    this.emit('voicesLoaded', this.voices);
  }

  // 获取可用语音列表
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  // 获取指定语言的语音
  getVoicesByLang(lang: string): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith(lang));
  }

  // 设置TTS配置
  setConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configChanged', this.config);
  }

  // 获取当前配置
  getConfig(): TTSConfig {
    return { ...this.config };
  }

  // 添加到语音队列
  speak(text: string, config?: Partial<TTSConfig>, priority: 'high' | 'medium' | 'low' = 'medium'): string {
    if (!text.trim()) return '';

    const id = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queueItem: TTSQueueItem = {
      id,
      text: text.trim(),
      config: { ...this.config, ...config },
      priority,
      timestamp: Date.now()
    };

    // 根据优先级插入队列
    if (priority === 'high') {
      this.queue.unshift(queueItem);
    } else {
      this.queue.push(queueItem);
    }

    this.emit('queueUpdated', this.queue);
    
    // 如果当前没有播放，开始播放
    if (!this.isPlaying) {
      this.processQueue();
    }

    return id;
  }

  // 处理语音队列
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    this.emit('playbackStarted');

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      await this.speakItem(item);
    }

    this.isPlaying = false;
    this.emit('playbackEnded');
  }

  // 播放单个语音项
  private speakItem(item: TTSQueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(item.text);
        
        // 设置语音参数
        utterance.rate = Math.max(0.1, Math.min(10, item.config.rate));
        utterance.pitch = Math.max(0, Math.min(2, item.config.pitch));
        utterance.volume = Math.max(0, Math.min(1, item.config.volume));
        utterance.lang = item.config.lang;
        
        // 设置语音
        if (item.config.voice) {
          utterance.voice = item.config.voice;
        } else {
          // 自动选择最佳语音
          const voices = this.getVoicesByLang(item.config.lang);
          if (voices.length > 0) {
            utterance.voice = voices[0];
          }
        }

        // 事件监听
        utterance.onstart = () => {
          this.currentUtterance = utterance;
          this.emit('itemStarted', item);
        };

        utterance.onend = () => {
          this.currentUtterance = null;
          this.emit('itemEnded', item);
          resolve();
        };

        utterance.onerror = (event) => {
          this.currentUtterance = null;
          this.emit('itemError', { item, error: event.error });
          reject(new Error(`TTS Error: ${event.error}`));
        };

        utterance.onpause = () => {
          this.emit('itemPaused', item);
        };

        utterance.onresume = () => {
          this.emit('itemResumed', item);
        };

        // 开始播放
        this.synthesis.speak(utterance);
        
      } catch (error) {
        this.emit('itemError', { item, error });
        reject(error);
      }
    });
  }

  // 暂停播放
  pause(): void {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
      this.emit('paused');
    }
  }

  // 恢复播放
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
      this.emit('resumed');
    }
  }

  // 停止播放
  stop(): void {
    this.synthesis.cancel();
    this.currentUtterance = null;
    this.isPlaying = false;
    this.emit('stopped');
  }

  // 清空队列
  clearQueue(): void {
    this.queue = [];
    this.emit('queueCleared');
  }

  // 移除队列中的特定项
  removeFromQueue(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.emit('queueUpdated', this.queue);
      return true;
    }
    return false;
  }

  // 获取队列状态
  getQueueStatus(): {
    queue: TTSQueueItem[];
    isPlaying: boolean;
    currentItem: TTSQueueItem | null;
  } {
    return {
      queue: [...this.queue],
      isPlaying: this.isPlaying,
      currentItem: this.currentUtterance ? 
        this.queue.find(item => item.text === this.currentUtterance?.text) || null : null
    };
  }

  // 检查浏览器支持
  isSupported(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  // 事件监听器管理
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`TTS Event Error (${event}):`, error);
        }
      });
    }
  }

  // 预设语音配置
  static presets = {
    // 中文配置
    chinese: {
      rate: 1,
      pitch: 1,
      volume: 0.8,
      lang: 'zh-CN'
    },
    // 英文配置
    english: {
      rate: 1,
      pitch: 1,
      volume: 0.8,
      lang: 'en-US'
    },
    // 快速播放
    fast: {
      rate: 1.5,
      pitch: 1,
      volume: 0.8,
      lang: 'zh-CN'
    },
    // 慢速播放
    slow: {
      rate: 0.7,
      pitch: 1,
      volume: 0.8,
      lang: 'zh-CN'
    },
    // 机器人声音
    robot: {
      rate: 1,
      pitch: 0.5,
      volume: 0.8,
      lang: 'zh-CN'
    }
  };
}

// 创建全局TTS服务实例
export const ttsService = new TTSService();

// 导出TTS服务类
export default TTSService;

// 工具函数
export const ttsUtils = {
  // 检测文本语言
  detectLanguage(text: string): string {
    // 简单的语言检测逻辑
    const chineseRegex = /[\u4e00-\u9fff]/;
    const englishRegex = /[a-zA-Z]/;
    
    if (chineseRegex.test(text)) {
      return 'zh-CN';
    } else if (englishRegex.test(text)) {
      return 'en-US';
    }
    return 'zh-CN'; // 默认中文
  },

  // 清理文本（移除特殊字符）
  cleanText(text: string): string {
    return text
      .replace(/[\r\n]+/g, ' ') // 替换换行为空格
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/[#@*[\]()]/g, '') // 移除特殊符号
      .trim();
  },

  // 分割长文本
  splitLongText(text: string, maxLength: number = 200): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const sentences = text.split(/[。！？.!?]/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 0);
  },

  // 格式化时间
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};