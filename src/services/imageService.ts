/**
 * 图片服务模块
 * 处理图片API调用、错误重试和fallback机制
 */

// 图片类型定义
export interface ImageOptions {
  prompt: string;
  imageSize: 'square' | 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  retries?: number;
  timeout?: number;
}

// 本地fallback图片映射
const LOCAL_FALLBACK_IMAGES = {
  avatar: '/images/default-avatar.svg',
  thumbnail: '/images/default-thumbnail.svg',
  video: '/images/default-video.svg',
  user: '/images/default-user.svg',
  placeholder: '/images/default-placeholder.svg'
};

// 根据prompt关键词确定fallback图片类型
function getFallbackImageType(prompt: string): keyof typeof LOCAL_FALLBACK_IMAGES {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('avatar') || lowerPrompt.includes('profile') || lowerPrompt.includes('user')) {
    return 'avatar';
  }
  if (lowerPrompt.includes('video') || lowerPrompt.includes('thumbnail')) {
    return lowerPrompt.includes('video') ? 'video' : 'thumbnail';
  }
  if (lowerPrompt.includes('user') || lowerPrompt.includes('person') || lowerPrompt.includes('man') || lowerPrompt.includes('woman')) {
    return 'user';
  }
  
  return 'placeholder';
}

// 网络状态检测
export function isOnline(): boolean {
  return navigator.onLine;
}

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 图片URL验证
function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// 图片加载测试
function testImageLoad(url: string, timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => {
      resolve(false);
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    
    img.src = url;
  });
}

// 主要的图片生成函数
export async function generateImage(options: ImageOptions): Promise<string> {
  const { prompt, imageSize, retries = 2, timeout = 5000 } = options;
  
  // 如果离线，直接返回本地fallback
  if (!isOnline()) {
    console.warn('离线状态，使用本地fallback图片');
    const fallbackType = getFallbackImageType(prompt);
    return LOCAL_FALLBACK_IMAGES[fallbackType];
  }
  
  // 构建API URL
  const apiUrl = `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${imageSize}`;
  
  // 重试逻辑
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 测试图片是否可以加载
      const canLoad = await testImageLoad(apiUrl, timeout);
      
      if (canLoad) {
        console.log(`图片API调用成功 (尝试 ${attempt + 1}/${retries + 1}):`, prompt);
        return apiUrl;
      } else {
        throw new Error(`图片加载失败 (尝试 ${attempt + 1})`);
      }
    } catch (error) {
      console.warn(`图片API调用失败 (尝试 ${attempt + 1}/${retries + 1}):`, error);
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < retries) {
        await delay(1000 * (attempt + 1)); // 递增延迟
      }
    }
  }
  
  // 所有重试都失败，返回本地fallback
  console.error('图片API调用完全失败，使用本地fallback:', prompt);
  const fallbackType = getFallbackImageType(prompt);
  return LOCAL_FALLBACK_IMAGES[fallbackType];
}

// 批量生成图片
export async function generateImages(optionsArray: ImageOptions[]): Promise<string[]> {
  const promises = optionsArray.map(options => generateImage(options));
  return Promise.all(promises);
}

// 预加载图片
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

// 获取本地fallback图片
export function getLocalFallbackImage(type: keyof typeof LOCAL_FALLBACK_IMAGES): string {
  return LOCAL_FALLBACK_IMAGES[type];
}

// 网络状态监听
export function setupNetworkListener(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// 图片缓存管理
class ImageCache {
  private cache = new Map<string, string>();
  private maxSize = 100;
  
  set(key: string, value: string): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  get(key: string): string | undefined {
    return this.cache.get(key);
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const imageCache = new ImageCache();

// 带缓存的图片生成
export async function generateImageWithCache(options: ImageOptions): Promise<string> {
  const cacheKey = `${options.prompt}_${options.imageSize}`;
  
  // 检查缓存
  if (imageCache.has(cacheKey)) {
    const cachedUrl = imageCache.get(cacheKey)!;
    console.log('使用缓存图片:', cacheKey);
    return cachedUrl;
  }
  
  // 生成新图片
  const imageUrl = await generateImage(options);
  
  // 存入缓存
  imageCache.set(cacheKey, imageUrl);
  
  return imageUrl;
}