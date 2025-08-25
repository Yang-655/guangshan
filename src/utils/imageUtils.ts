/**
 * 图片工具函数
 * 用于替换项目中使用trae-api的地方
 */

import { generateImageWithCache } from '../services/imageService';

/**
 * 从trae-api URL中提取prompt和imageSize
 */
export function parseTraeApiUrl(url: string): { prompt: string; imageSize: string } | null {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('trae-api-sg.mchost.guru')) {
      return null;
    }
    
    const prompt = urlObj.searchParams.get('prompt') || '';
    const imageSize = urlObj.searchParams.get('image_size') || 'square';
    
    return { prompt, imageSize };
  } catch {
    return null;
  }
}

/**
 * 生成头像图片
 */
export async function generateAvatarImage(description: string): Promise<string> {
  return generateImageWithCache({
    prompt: `${description} avatar portrait friendly`,
    imageSize: 'square'
  });
}

/**
 * 生成缩略图
 */
export async function generateThumbnailImage(description: string, aspectRatio: 'portrait' | 'landscape' = 'portrait'): Promise<string> {
  const imageSize = aspectRatio === 'portrait' ? 'portrait_16_9' : 'landscape_16_9';
  return generateImageWithCache({
    prompt: `${description} video thumbnail`,
    imageSize
  });
}

/**
 * 生成用户头像
 */
export async function generateUserImage(userType: string): Promise<string> {
  return generateImageWithCache({
    prompt: `${userType} user avatar profile picture`,
    imageSize: 'square'
  });
}

/**
 * 智能图片URL生成器
 * 自动检测是否为trae-api URL，如果是则使用新的图片服务
 */
export function createSmartImageUrl(originalUrl: string): {
  useImageService: boolean;
  prompt?: string;
  imageSize?: string;
  src: string;
} {
  const parsed = parseTraeApiUrl(originalUrl);
  
  if (parsed) {
    return {
      useImageService: true,
      prompt: parsed.prompt,
      imageSize: parsed.imageSize,
      src: originalUrl // 保留原始URL作为fallback
    };
  }
  
  return {
    useImageService: false,
    src: originalUrl
  };
}

/**
 * 常用图片生成预设
 */
export const IMAGE_PRESETS = {
  // 头像预设
  avatars: {
    young_man: 'young man avatar portrait friendly',
    beautiful_girl: 'beautiful asian girl avatar profile picture',
    chef: 'chef avatar professional',
    photographer: 'photographer avatar creative',
    designer: 'designer avatar',
    food_blogger: 'food blogger avatar',
    default_user: 'default user avatar'
  },
  
  // 缩略图预设
  thumbnails: {
    cooking: 'cooking tutorial video thumbnail',
    educational: 'educational video thumbnail learning',
    food_court: 'food court shopping mall video thumbnail',
    subway_station: 'subway station crowd live stream',
    welcome_video: 'welcome video content'
  }
};

/**
 * 使用预设生成图片
 */
export async function generatePresetImage(
  category: keyof typeof IMAGE_PRESETS,
  preset: string,
  imageSize: 'square' | 'portrait_16_9' | 'landscape_16_9' = 'square'
): Promise<string> {
  const presets = IMAGE_PRESETS[category] as Record<string, string>;
  const prompt = presets[preset] || presets.default_user || 'default image';
  
  return generateImageWithCache({
    prompt,
    imageSize
  });
}