/**
 * Vercel Blob 存储服务
 * 处理视频和缩略图上传到 Vercel Blob 存储
 */
import { put } from '@vercel/blob';

export interface BlobUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
}

export interface VideoUploadData {
  videoFile?: File;
  videoBlob?: Blob;
  videoUrl?: string;
  thumbnailData?: string;
  title: string;
  userId: string;
}

class BlobStorageService {
  private readonly BLOB_READ_WRITE_TOKEN: string;

  constructor() {
    // 从环境变量获取 Vercel Blob 令牌
    this.BLOB_READ_WRITE_TOKEN = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN || '';
    
    if (!this.BLOB_READ_WRITE_TOKEN) {
      console.warn('⚠️ VITE_BLOB_READ_WRITE_TOKEN 环境变量未设置，Blob 存储功能可能无法正常工作');
    }
  }

  /**
   * 上传视频到 Vercel Blob 存储
   */
  async uploadVideo(uploadData: VideoUploadData): Promise<{
    videoUrl?: string;
    thumbnailUrl?: string;
    error?: string;
  }> {
    try {
      console.log('🚀 开始上传视频到 Vercel Blob 存储');
      
      let videoUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      // 上传视频文件
      if (uploadData.videoFile || uploadData.videoBlob) {
        console.log('📹 上传视频文件...');
        
        const videoData = uploadData.videoFile || uploadData.videoBlob;
        if (!videoData) {
          throw new Error('没有找到视频数据');
        }

        // 生成视频文件名
        const timestamp = Date.now();
        const videoFileName = `videos/${uploadData.userId}/${timestamp}_${this.sanitizeFileName(uploadData.title)}.mp4`;
        
        console.log('📍 视频文件路径:', videoFileName);
        
        const videoResult = await put(videoFileName, videoData, {
          access: 'public',
          token: this.BLOB_READ_WRITE_TOKEN
        });
        
        videoUrl = videoResult.url;
        console.log('✅ 视频上传成功:', videoUrl);
      } else if (uploadData.videoUrl && uploadData.videoUrl.startsWith('blob:')) {
        console.log('🔄 处理 Blob URL 视频...');
        
        // 从 Blob URL 获取数据并上传
        const response = await fetch(uploadData.videoUrl);
        const videoBlob = await response.blob();
        
        const timestamp = Date.now();
        const videoFileName = `videos/${uploadData.userId}/${timestamp}_${this.sanitizeFileName(uploadData.title)}.mp4`;
        
        const videoResult = await put(videoFileName, videoBlob, {
          access: 'public',
          token: this.BLOB_READ_WRITE_TOKEN
        });
        
        videoUrl = videoResult.url;
        console.log('✅ Blob URL 视频上传成功:', videoUrl);
      }

      // 上传缩略图
      if (uploadData.thumbnailData && uploadData.thumbnailData.startsWith('data:')) {
        console.log('🖼️ 上传缩略图...');
        
        // 将 base64 数据转换为 Blob
        const thumbnailBlob = this.dataURLToBlob(uploadData.thumbnailData);
        
        const timestamp = Date.now();
        const thumbnailFileName = `thumbnails/${uploadData.userId}/${timestamp}_${this.sanitizeFileName(uploadData.title)}.jpg`;
        
        console.log('📍 缩略图文件路径:', thumbnailFileName);
        
        const thumbnailResult = await put(thumbnailFileName, thumbnailBlob, {
          access: 'public',
          token: this.BLOB_READ_WRITE_TOKEN
        });
        
        thumbnailUrl = thumbnailResult.url;
        console.log('✅ 缩略图上传成功:', thumbnailUrl);
      }

      return {
        videoUrl,
        thumbnailUrl
      };
      
    } catch (error) {
      console.error('❌ Blob 存储上传失败:', error);
      return {
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  /**
   * 将 data URL 转换为 Blob
   */
  private dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  /**
   * 清理文件名，移除特殊字符
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') // 保留中文、英文、数字，其他字符替换为下划线
      .replace(/_+/g, '_') // 多个下划线合并为一个
      .replace(/^_|_$/g, '') // 移除开头和结尾的下划线
      .substring(0, 50); // 限制长度
  }

  /**
   * 检查 Blob 存储服务是否可用
   */
  isAvailable(): boolean {
    return !!this.BLOB_READ_WRITE_TOKEN;
  }

  /**
   * 获取配置状态
   */
  getStatus(): {
    available: boolean;
    hasToken: boolean;
    tokenLength: number;
  } {
    return {
      available: this.isAvailable(),
      hasToken: !!this.BLOB_READ_WRITE_TOKEN,
      tokenLength: this.BLOB_READ_WRITE_TOKEN.length
    };
  }
}

export const blobStorageService = new BlobStorageService();
export default blobStorageService;