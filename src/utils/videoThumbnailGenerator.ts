/**
 * 视频缩略图生成工具
 * 用于从视频文件或base64数据生成缩略图
 */

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
  bitrate?: number;
  fps?: number;
}

export class VideoThumbnailGenerator {
  /**
   * 从视频URL生成缩略图
   * @param videoUrl 视频URL（支持blob、base64、http）
   * @param timeOffset 截取时间点（秒），默认为1秒
   * @param width 缩略图宽度，默认为320
   * @param height 缩略图高度，默认为240
   * @returns Promise<string> 返回base64格式的缩略图
   */
  static async generateThumbnail(
    videoUrl: string,
    timeOffset: number = 1,
    width: number = 320,
    height: number = 240
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }
      
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      let timeoutId: NodeJS.Timeout | undefined = undefined;
      
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        video.removeEventListener('abort', onAbort);
      };
      
      const onLoadedMetadata = () => {
        console.log('视频元数据加载完成:', {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
        
        // 设置canvas尺寸
        canvas.width = width;
        canvas.height = height;
        
        // 设置视频时间点
        const seekTime = Math.min(timeOffset, video.duration - 0.1);
        console.log('设置视频时间点:', seekTime);
        video.currentTime = seekTime;
      };
      
      const onSeeked = () => {
        try {
          console.log('视频seek完成，开始生成缩略图');
          
          // 计算视频在canvas中的显示尺寸（保持宽高比）
          const videoAspect = video.videoWidth / video.videoHeight;
          const canvasAspect = width / height;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (videoAspect > canvasAspect) {
            // 视频更宽，以高度为准
            drawHeight = height;
            drawWidth = height * videoAspect;
            drawX = (width - drawWidth) / 2;
            drawY = 0;
          } else {
            // 视频更高，以宽度为准
            drawWidth = width;
            drawHeight = width / videoAspect;
            drawX = 0;
            drawY = (height - drawHeight) / 2;
          }
          
          // 填充黑色背景
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, width, height);
          
          // 绘制视频帧
          ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
          
          // 转换为base64
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          console.log('缩略图生成成功');
          cleanup();
          resolve(thumbnail);
        } catch (error) {
          console.error('生成缩略图时出错:', error);
          cleanup();
          reject(error);
        }
      };
      
      const onError = (error: Event | string) => {
        console.error('视频加载失败:', error);
        cleanup();
        reject(new Error('视频加载失败'));
      };
      
      const onAbort = () => {
        console.error('视频加载被中断');
        cleanup();
        reject(new Error('视频加载被中断'));
      };
      
      // 设置超时
      timeoutId = setTimeout(() => {
        console.error('生成缩略图超时');
        cleanup();
        reject(new Error('生成缩略图超时'));
      }, 15000); // 增加超时时间到15秒
      
      // 绑定事件监听器
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', onError);
      video.addEventListener('abort', onAbort);
      
      // 开始加载视频
      video.src = videoUrl;
    });
  }
  
  /**
   * 获取视频详细信息
   * @param videoUrl 视频URL
   * @returns Promise<VideoInfo> 视频信息
   */
  static async getVideoInfo(videoUrl: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        const info: VideoInfo = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: 0, // 无法直接获取文件大小
          format: this.getVideoFormat(videoUrl)
        };
        
        // 尝试获取文件大小（仅对base64有效）
        if (videoUrl.startsWith('data:')) {
          const base64Data = videoUrl.split(',')[1];
          if (base64Data) {
            info.size = Math.round((base64Data.length * 3) / 4); // base64解码后的大小
          }
        }
        
        resolve(info);
      };
      
      video.onerror = (error: Event | string) => {
        console.error('获取视频信息失败:', error);
        reject(new Error('获取视频信息失败'));
      };
      
      video.src = videoUrl;
    });
  }
  
  /**
   * 从URL推断视频格式
   * @param videoUrl 视频URL
   * @returns 视频格式
   */
  private static getVideoFormat(videoUrl: string): string {
    if (videoUrl.startsWith('data:video/')) {
      const mimeType = videoUrl.split(';')[0].split(':')[1];
      return mimeType.split('/')[1].toUpperCase();
    }
    
    if (videoUrl.includes('.')) {
      const extension = videoUrl.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'mp4': return 'MP4';
        case 'webm': return 'WEBM';
        case 'ogg': return 'OGG';
        case 'avi': return 'AVI';
        case 'mov': return 'MOV';
        case 'mkv': return 'MKV';
        default: return 'UNKNOWN';
      }
    }
    
    return 'UNKNOWN';
  }
  
  /**
   * 生成多个时间点的缩略图
   * @param videoUrl 视频URL
   * @param count 缩略图数量
   * @param width 缩略图宽度
   * @param height 缩略图高度
   * @returns Promise<string[]> 缩略图数组
   */
  static async generateMultipleThumbnails(
    videoUrl: string,
    count: number = 3,
    width: number = 160,
    height: number = 120
  ): Promise<string[]> {
    try {
      const videoInfo = await this.getVideoInfo(videoUrl);
      const duration = videoInfo.duration;
      const thumbnails: string[] = [];
      
      for (let i = 0; i < count; i++) {
        const timeOffset = (duration / (count + 1)) * (i + 1);
        const thumbnail = await this.generateThumbnail(videoUrl, timeOffset, width, height);
        thumbnails.push(thumbnail);
      }
      
      return thumbnails;
    } catch (error) {
      console.error('生成多个缩略图失败:', error);
      throw error;
    }
  }
  
  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化的文件大小字符串
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 格式化视频时长
   * @param seconds 秒数
   * @returns 格式化的时长字符串
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
  
  /**
   * 格式化视频分辨率
   * @param width 宽度
   * @param height 高度
   * @returns 分辨率字符串
   */
  static formatResolution(width: number, height: number): string {
    // 常见分辨率标准
    const resolutions: { [key: string]: string } = {
      '3840x2160': '4K UHD',
      '2560x1440': '2K QHD',
      '1920x1080': '1080p FHD',
      '1280x720': '720p HD',
      '854x480': '480p SD',
      '640x360': '360p',
      '426x240': '240p'
    };
    
    const key = `${width}x${height}`;
    return resolutions[key] || `${width}x${height}`;
  }
}

export default VideoThumbnailGenerator;