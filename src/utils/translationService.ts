// 翻译服务模块
import { TranslationConfig } from '../components/TranslationSettings';

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  originalText: string;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  mode: 'fast' | 'accurate';
}

export interface GeolocationInfo {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface LanguagePreference {
  sourceLanguage: string;
  targetLanguage: string;
  lastUsed: number;
  usageCount: number;
}

export interface SmartLanguageRecommendation {
  recommendedSource: string;
  recommendedTarget: string;
  confidence: number;
  reason: 'geolocation' | 'system' | 'history' | 'auto';
}

class TranslationService {
  private apiKey: string = '';
  private baseUrl: string = 'https://api.translate.service.com';
  private cache: Map<string, TranslationResult> = new Map();
  private rateLimitQueue: Array<() => void> = [];
  private isProcessingQueue: boolean = false;
  private geolocationInfo: GeolocationInfo | null = null;
  private systemLanguage: string = '';
  private languagePreferences: LanguagePreference[] = [];
  private readonly STORAGE_KEY = 'translation_preferences';

  constructor() {
    // 初始化翻译服务
    this.initializeService();
    this.loadLanguagePreferences();
    this.detectSystemLanguage();
    this.detectGeolocation();
  }

  private async initializeService() {
    // 这里可以初始化翻译API密钥等配置
    // 实际项目中应该从环境变量或配置文件中读取
    console.log('Translation service initialized');
  }

  // 检测系统语言
  private detectSystemLanguage(): void {
    try {
      // 获取浏览器语言设置
      const language = navigator.language || navigator.languages?.[0] || 'en';
      this.systemLanguage = language.split('-')[0]; // 只取语言代码，忽略地区
      console.log('System language detected:', this.systemLanguage);
    } catch (error) {
      console.error('Failed to detect system language:', error);
      this.systemLanguage = 'en';
    }
  }

  // 检测地理位置
  private async detectGeolocation(): Promise<void> {
    try {
      // 首先尝试通过浏览器地理位置API
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            this.geolocationInfo = await this.getLocationInfo(latitude, longitude);
            console.log('Geolocation detected:', this.geolocationInfo);
          },
          (error) => {
            console.warn('Geolocation permission denied, trying IP-based detection');
            this.detectLocationByIP();
          },
          { timeout: 5000, enableHighAccuracy: false }
        );
      } else {
        // 浏览器不支持地理位置API，使用IP检测
        this.detectLocationByIP();
      }
    } catch (error) {
      console.error('Geolocation detection failed:', error);
    }
  }

  // 通过IP地址检测位置
  private async detectLocationByIP(): Promise<void> {
    try {
      // 模拟IP地理位置检测（实际项目中应该调用真实的IP地理位置API）
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        this.geolocationInfo = {
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || 'US',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone
        };
        console.log('IP-based location detected:', this.geolocationInfo);
      } else {
        // 如果IP检测失败，使用默认值
        this.geolocationInfo = {
          country: 'China',
          countryCode: 'CN',
          region: 'Unknown',
          city: 'Unknown'
        };
      }
    } catch (error) {
      console.error('IP-based location detection failed:', error);
      // 使用默认值
      this.geolocationInfo = {
        country: 'China',
        countryCode: 'CN',
        region: 'Unknown',
        city: 'Unknown'
      };
    }
  }

  // 根据经纬度获取位置信息
  private async getLocationInfo(latitude: number, longitude: number): Promise<GeolocationInfo> {
    try {
      // 模拟反向地理编码（实际项目中应该调用真实的地理编码API）
      // 这里简化处理，根据经纬度范围判断大致位置
      let country = 'Unknown';
      let countryCode = 'US';
      
      // 简单的地理位置判断逻辑
      if (latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135) {
        country = 'China';
        countryCode = 'CN';
      } else if (latitude >= 24 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
        country = 'United States';
        countryCode = 'US';
      } else if (latitude >= 30 && latitude <= 46 && longitude >= 129 && longitude <= 146) {
        country = 'Japan';
        countryCode = 'JP';
      } else if (latitude >= 33 && latitude <= 43 && longitude >= 124 && longitude <= 132) {
        country = 'South Korea';
        countryCode = 'KR';
      }
      
      return {
        country,
        countryCode,
        region: 'Unknown',
        city: 'Unknown',
        latitude,
        longitude
      };
    } catch (error) {
      console.error('Failed to get location info:', error);
      return {
        country: 'Unknown',
        countryCode: 'US',
        region: 'Unknown',
        city: 'Unknown',
        latitude,
        longitude
      };
    }
  }

  // 加载语言偏好设置
  private loadLanguagePreferences(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.languagePreferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load language preferences:', error);
      this.languagePreferences = [];
    }
  }

  // 保存语言偏好设置
  private saveLanguagePreferences(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.languagePreferences));
    } catch (error) {
      console.error('Failed to save language preferences:', error);
    }
  }

  // 更新语言偏好
  private updateLanguagePreference(sourceLanguage: string, targetLanguage: string): void {
    const existing = this.languagePreferences.find(
      p => p.sourceLanguage === sourceLanguage && p.targetLanguage === targetLanguage
    );
    
    if (existing) {
      existing.lastUsed = Date.now();
      existing.usageCount++;
    } else {
      this.languagePreferences.push({
        sourceLanguage,
        targetLanguage,
        lastUsed: Date.now(),
        usageCount: 1
      });
    }
    
    // 限制偏好记录数量
    if (this.languagePreferences.length > 20) {
      this.languagePreferences.sort((a, b) => b.lastUsed - a.lastUsed);
      this.languagePreferences = this.languagePreferences.slice(0, 20);
    }
    
    this.saveLanguagePreferences();
  }

  // 检测语言
  async detectLanguage(text: string): Promise<string> {
    try {
      // 简单的语言检测逻辑
      const chineseRegex = /[\u4e00-\u9fff]/;
      const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
      const koreanRegex = /[\uac00-\ud7af]/;
      const arabicRegex = /[\u0600-\u06ff]/;
      const russianRegex = /[\u0400-\u04ff]/;
      
      if (chineseRegex.test(text)) return 'zh';
      if (japaneseRegex.test(text)) return 'ja';
      if (koreanRegex.test(text)) return 'ko';
      if (arabicRegex.test(text)) return 'ar';
      if (russianRegex.test(text)) return 'ru';
      
      // 默认返回英文
      return 'en';
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'en';
    }
  }

  // 智能语言推荐
  getSmartLanguageRecommendation(): SmartLanguageRecommendation {
    let recommendedSource = 'auto';
    let recommendedTarget = 'en';
    let confidence = 0.5;
    let reason: 'geolocation' | 'system' | 'history' | 'auto' = 'auto';

    // 1. 优先使用历史偏好
    if (this.languagePreferences.length > 0) {
      const mostUsed = this.languagePreferences
        .sort((a, b) => b.usageCount - a.usageCount)[0];
      recommendedSource = mostUsed.sourceLanguage;
      recommendedTarget = mostUsed.targetLanguage;
      confidence = 0.9;
      reason = 'history';
    }
    // 2. 使用系统语言设置
    else if (this.systemLanguage && this.systemLanguage !== 'en') {
      recommendedSource = this.systemLanguage;
      recommendedTarget = 'en';
      confidence = 0.8;
      reason = 'system';
    }
    // 3. 使用地理位置推荐
    else if (this.geolocationInfo) {
      const countryLanguageMap: { [key: string]: string } = {
        'CN': 'zh',
        'JP': 'ja',
        'KR': 'ko',
        'ES': 'es',
        'FR': 'fr',
        'DE': 'de',
        'RU': 'ru',
        'SA': 'ar',
        'TH': 'th',
        'VN': 'vi',
        'IT': 'it',
        'PT': 'pt'
      };
      
      const geoLanguage = countryLanguageMap[this.geolocationInfo.countryCode];
      if (geoLanguage) {
        recommendedSource = geoLanguage;
        recommendedTarget = geoLanguage === 'zh' ? 'en' : 'zh';
        confidence = 0.7;
        reason = 'geolocation';
      }
    }

    return {
      recommendedSource,
      recommendedTarget,
      confidence,
      reason
    };
  }

  // 获取系统语言
  getSystemLanguage(): string {
    return this.systemLanguage;
  }

  // 获取地理位置信息
  getGeolocationInfo(): GeolocationInfo | null {
    return this.geolocationInfo;
  }

  // 获取语言偏好历史
  getLanguagePreferences(): LanguagePreference[] {
    return [...this.languagePreferences];
  }

  // 清除语言偏好
  clearLanguagePreferences(): void {
    this.languagePreferences = [];
    this.saveLanguagePreferences();
  }

  // 自动语言切换（首次使用时）
  getAutoLanguageConfig(): { sourceLanguage: string; targetLanguage: string } {
    const FIRST_USE_KEY = 'translation_first_use';
    const isFirstUse = !localStorage.getItem(FIRST_USE_KEY);
    
    if (isFirstUse) {
      // 标记为已使用
      localStorage.setItem(FIRST_USE_KEY, 'false');
      
      // 获取智能推荐
      const recommendation = this.getSmartLanguageRecommendation();
      
      console.log('First use detected, applying smart language recommendation:', recommendation);
      
      return {
        sourceLanguage: recommendation.recommendedSource,
        targetLanguage: recommendation.recommendedTarget
      };
    }
    
    // 非首次使用，返回默认配置或最近使用的配置
    if (this.languagePreferences.length > 0) {
      const recent = this.languagePreferences
        .sort((a, b) => b.lastUsed - a.lastUsed)[0];
      return {
        sourceLanguage: recent.sourceLanguage,
        targetLanguage: recent.targetLanguage
      };
    }
    
    return {
      sourceLanguage: 'auto',
      targetLanguage: 'en'
    };
  }

  // 重置首次使用状态（用于测试）
  resetFirstUseStatus(): void {
    localStorage.removeItem('translation_first_use');
  }

  // 检查是否为首次使用
  isFirstTimeUser(): boolean {
    return !localStorage.getItem('translation_first_use');
  }

  // 翻译文本
  async translateText(request: TranslationRequest): Promise<TranslationResult> {
    const cacheKey = `${request.text}_${request.sourceLanguage}_${request.targetLanguage}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // 自动检测源语言
      let sourceLanguage = request.sourceLanguage;
      if (sourceLanguage === 'auto') {
        sourceLanguage = await this.detectLanguage(request.text);
      }

      // 如果源语言和目标语言相同，直接返回原文
      if (sourceLanguage === request.targetLanguage) {
        const result: TranslationResult = {
          translatedText: request.text,
          sourceLanguage,
          targetLanguage: request.targetLanguage,
          confidence: 1.0,
          originalText: request.text
        };
        return result;
      }

      // 模拟翻译API调用
      const translatedText = await this.callTranslationAPI(request, sourceLanguage);
      
      const result: TranslationResult = {
        translatedText,
        sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: this.calculateConfidence(request.text, translatedText),
        originalText: request.text
      };

      // 更新语言偏好
      this.updateLanguagePreference(sourceLanguage, request.targetLanguage);

      // 缓存结果
      this.cache.set(cacheKey, result);
      
      // 限制缓存大小
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return result;
    } catch (error) {
      console.error('Translation failed:', error);
      
      // 返回错误结果
      return {
        translatedText: `[翻译失败] ${request.text}`,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: 0,
        originalText: request.text
      };
    }
  }

  // 模拟翻译API调用
  private async callTranslationAPI(request: TranslationRequest, sourceLanguage: string): Promise<string> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, request.mode === 'fast' ? 100 : 300));

    // 模拟翻译结果
    const translations: { [key: string]: { [key: string]: string } } = {
      'zh': {
        'en': this.translateChineseToEnglish(request.text),
        'ja': this.translateChineseToJapanese(request.text),
        'ko': this.translateChineseToKorean(request.text)
      },
      'en': {
        'zh': this.translateEnglishToChinese(request.text),
        'ja': this.translateEnglishToJapanese(request.text),
        'ko': this.translateEnglishToKorean(request.text)
      },
      'ja': {
        'zh': this.translateJapaneseToChinese(request.text),
        'en': this.translateJapaneseToEnglish(request.text)
      },
      'ko': {
        'zh': this.translateKoreanToChinese(request.text),
        'en': this.translateKoreanToEnglish(request.text)
      }
    };

    return translations[sourceLanguage]?.[request.targetLanguage] || `[${request.targetLanguage}] ${request.text}`;
  }

  // 模拟翻译函数
  private translateChineseToEnglish(text: string): string {
    const commonTranslations: { [key: string]: string } = {
      '你好': 'Hello',
      '谢谢': 'Thank you',
      '再见': 'Goodbye',
      '好的': 'Okay',
      '收到': 'Received',
      '没问题': 'No problem',
      '今天天气不错': 'The weather is nice today',
      '我们一起吃饭吧': 'Let\'s have dinner together',
      '谢谢你的帮助': 'Thank you for your help',
      '明天见面聊': 'Let\'s meet and talk tomorrow',
      '这个想法很好': 'This is a good idea',
      '你好，我想和你讨论一下这个项目的具体细节': 'Hello, I would like to discuss the specific details of this project with you',
      '今天的会议内容很重要，我们需要认真准备': 'Today\'s meeting content is very important, we need to prepare carefully',
      '关于这个方案，我觉得还有一些地方需要优化': 'Regarding this plan, I think there are still some areas that need optimization',
      '感谢大家的配合，我们的工作进展很顺利': 'Thank you for everyone\'s cooperation, our work is progressing smoothly',
      '主播好': 'Hello streamer',
      '666': 'Awesome',
      '太棒了': 'Amazing',
      '加油': 'Keep it up',
      '好看': 'Beautiful',
      '点赞': 'Like',
      '关注': 'Follow'
    };
    
    return commonTranslations[text] || `[EN] ${text}`;
  }

  private translateEnglishToChinese(text: string): string {
    const commonTranslations: { [key: string]: string } = {
      'hello': '你好',
      'thank you': '谢谢',
      'goodbye': '再见',
      'okay': '好的',
      'received': '收到',
      'no problem': '没问题',
      'the weather is nice today': '今天天气不错',
      'let\'s have dinner together': '我们一起吃饭吧',
      'thank you for your help': '谢谢你的帮助',
      'let\'s meet and talk tomorrow': '明天见面聊',
      'this is a good idea': '这个想法很好',
      'hello, i would like to discuss the specific details of this project with you': '你好，我想和你讨论一下这个项目的具体细节',
      'today\'s meeting content is very important, we need to prepare carefully': '今天的会议内容很重要，我们需要认真准备',
      'regarding this plan, i think there are still some areas that need optimization': '关于这个方案，我觉得还有一些地方需要优化',
      'thank you for everyone\'s cooperation, our work is progressing smoothly': '感谢大家的配合，我们的工作进展很顺利',
      'awesome': '太棒了',
      'amazing': '令人惊叹',
      'beautiful': '美丽',
      'like': '点赞',
      'follow': '关注'
    };
    
    return commonTranslations[text.toLowerCase()] || `[中文] ${text}`;
  }

  private translateChineseToJapanese(text: string): string {
    const commonTranslations: { [key: string]: string } = {
      '你好': 'こんにちは',
      '谢谢': 'ありがとう',
      '再见': 'さようなら',
      '主播好': 'ストリーマーさん、こんにちは',
      '666': 'すごい',
      '太棒了': '素晴らしい',
      '加油': '頑張って',
      '好看': '綺麗',
      '点赞': 'いいね',
      '关注': 'フォロー'
    };
    
    return commonTranslations[text] || `[日本語] ${text}`;
  }

  private translateChineseToKorean(text: string): string {
    const commonTranslations: { [key: string]: string } = {
      '你好': '안녕하세요',
      '谢谢': '감사합니다',
      '再见': '안녕히 가세요',
      '主播好': '스트리머님 안녕하세요',
      '666': '대박',
      '太棒了': '정말 좋아요',
      '加油': '화이팅',
      '好看': '예뻐요',
      '点赞': '좋아요',
      '关注': '팔로우'
    };
    
    return commonTranslations[text] || `[한국어] ${text}`;
  }

  private translateJapaneseToChinese(text: string): string {
    const commonTranslations: { [key: string]: string } = {
      'こんにちは': '你好',
      'ありがとう': '谢谢',
      'さようなら': '再见',
      'すごい': '太棒了',
      '素晴らしい': '很棒',
      '頑張って': '加油',
      '綺麗': '好看',
      'いいね': '点赞',
      'フォロー': '关注'
    };
    
    return commonTranslations[text] || `[中文] ${text}`;
  }

  private translateJapaneseToEnglish(text: string): string {
    const commonTranslations: { [key: string]: string } = {
      'こんにちは': 'Hello',
      'ありがとう': 'Thank you',
      'さようなら': 'Goodbye',
      'すごい': 'Amazing',
      '素晴らしい': 'Wonderful',
      '頑張って': 'Good luck',
      '綺麗': 'Beautiful',
      'いいね': 'Like',
      'フォロー': 'Follow'
    };
    
    return commonTranslations[text] || `[EN] ${text}`;
  }

  private translateKoreanToChinese(text: string): string {
    const commonTranslations: { [key: string]: string } = {
      '안녕하세요': '你好',
      '감사합니다': '谢谢',
      '안녕히 가세요': '再见',
      '대박': '太棒了',
      '정말 좋아요': '真的很好',
      '화이팅': '加油',
      '예뻐요': '好看',
      '좋아요': '点赞',
      '팔로우': '关注'
    };
    
    return commonTranslations[text] || `[中文] ${text}`;
  }

  private translateKoreanToEnglish(text: string): string {
    const commonTranslations: { [key: string]: string } = {
      '안녕하세요': 'Hello',
      '감사합니다': 'Thank you',
      '안녕히 가세요': 'Goodbye',
      '대박': 'Amazing',
      '정말 좋아요': 'Really good',
      '화이팅': 'Fighting',
      '예뻐요': 'Pretty',
      '좋아요': 'Like',
      '팔로우': 'Follow'
    };
    
    return commonTranslations[text] || `[EN] ${text}`;
  }

  private translateEnglishToJapanese(text: string): string {
    const commonTranslations: { [key: string]: string } = {
      'hello': 'こんにちは',
      'thank you': 'ありがとう',
      'goodbye': 'さようなら',
      'awesome': 'すごい',
      'amazing': '素晴らしい',
      'beautiful': '綺麗',
      'like': 'いいね',
      'follow': 'フォロー'
    };
    
    return commonTranslations[text.toLowerCase()] || `[日本語] ${text}`;
  }

  private translateEnglishToKorean(text: string): string {
    const commonTranslations: { [key: string]: string } = {
      'hello': '안녕하세요',
      'thank you': '감사합니다',
      'goodbye': '안녕히 가세요',
      'awesome': '대박',
      'amazing': '정말 좋아요',
      'beautiful': '예뻐요',
      'like': '좋아요',
      'follow': '팔로우'
    };
    
    return commonTranslations[text.toLowerCase()] || `[한국어] ${text}`;
  }

  // 计算翻译置信度
  private calculateConfidence(originalText: string, translatedText: string): number {
    // 简单的置信度计算逻辑
    if (translatedText.includes('[翻译失败]')) return 0;
    if (translatedText.includes('[') && translatedText.includes(']')) return 0.6;
    
    // 根据文本长度和复杂度计算置信度
    const lengthFactor = Math.min(originalText.length / 50, 1);
    const complexityFactor = originalText.split(' ').length > 5 ? 0.8 : 0.9;
    
    return Math.min(0.7 + lengthFactor * 0.2 + complexityFactor * 0.1, 0.95);
  }

  // 批量翻译
  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    const results = await Promise.all(
      requests.map(request => this.translateText(request))
    );
    return results;
  }

  // 清除缓存
  clearCache(): void {
    this.cache.clear();
  }

  // 获取支持的语言列表
  getSupportedLanguages(): Array<{ code: string; name: string; flag: string }> {
    return [
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
  }
}

// 导出单例实例
export const translationService = new TranslationService();
export default TranslationService;