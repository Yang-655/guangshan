export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  confidence: number;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
}

export class TranslationService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
    this.baseUrl = 'https://api.translate.service.com'; // 示例API地址
  }

  /**
   * 检测文本语言
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      // 简单的语言检测逻辑
      const chineseRegex = /[\u4e00-\u9fff]/;
      const englishRegex = /^[a-zA-Z\s.,!?;:()\-"']+$/;
      
      if (chineseRegex.test(text)) {
        return {
          language: 'zh-CN',
          confidence: 0.9
        };
      } else if (englishRegex.test(text)) {
        return {
          language: 'en',
          confidence: 0.9
        };
      } else {
        return {
          language: 'unknown',
          confidence: 0.1
        };
      }
    } catch (error) {
      console.error('Language detection failed:', error);
      return {
        language: 'unknown',
        confidence: 0
      };
    }
  }

  /**
   * 翻译文本
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    try {
      // 如果没有提供源语言，先检测
      if (!sourceLanguage) {
        const detection = await this.detectLanguage(text);
        sourceLanguage = detection.language;
      }

      // 如果源语言和目标语言相同，直接返回原文
      if (sourceLanguage === targetLanguage) {
        return {
          translatedText: text,
          detectedLanguage: sourceLanguage,
          confidence: 1.0
        };
      }

      // 模拟翻译API调用
      const translatedText = await this.mockTranslate(text, sourceLanguage, targetLanguage);
      
      return {
        translatedText,
        detectedLanguage: sourceLanguage,
        confidence: 0.85
      };
    } catch (error) {
      console.error('Translation failed:', error);
      throw new Error('翻译失败，请稍后重试');
    }
  }

  /**
   * 批量翻译
   */
  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];
    
    for (const text of texts) {
      try {
        const result = await this.translateText(text, targetLanguage, sourceLanguage);
        results.push(result);
      } catch (error) {
        results.push({
          translatedText: text, // 翻译失败时返回原文
          detectedLanguage: sourceLanguage || 'unknown',
          confidence: 0
        });
      }
    }
    
    return results;
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'zh-CN', name: '中文' },
      { code: 'en', name: 'English' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'es', name: 'Español' },
      { code: 'ru', name: 'Русский' },
      { code: 'ar', name: 'العربية' },
      { code: 'pt', name: 'Português' }
    ];
  }

  /**
   * 模拟翻译功能（实际项目中应该调用真实的翻译API）
   */
  private async mockTranslate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 简单的模拟翻译逻辑
    const translations: Record<string, Record<string, string>> = {
      'zh-CN': {
        'en': 'Hello, this is a translated message.',
        'ja': 'こんにちは、これは翻訳されたメッセージです。',
        'ko': '안녕하세요, 이것은 번역된 메시지입니다.'
      },
      'en': {
        'zh-CN': '你好，这是一条翻译的消息。',
        'ja': 'こんにちは、これは翻訳されたメッセージです。',
        'ko': '안녕하세요, 이것은 번역된 메시지입니다.'
      }
    };

    const translationMap = translations[sourceLanguage];
    if (translationMap && translationMap[targetLanguage]) {
      return translationMap[targetLanguage];
    }

    // 如果没有预设翻译，返回带前缀的原文
    return `[${targetLanguage}] ${text}`;
  }

  /**
   * 设置API密钥
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * 检查服务是否可用
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      // 简单的健康检查
      await this.detectLanguage('test');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// 导出单例实例
export const translationService = new TranslationService();

// 默认导出
export default TranslationService;