/**
 * 数据库版本的推荐服务
 * 使用API与后端数据库交互，替代localStorage存储
 */
import { apiService, type VideoData, type UserData, type UserBehaviorData } from './apiService.js';
import { blobStorageService, type VideoUploadData } from './blobStorageService.js';

// 保持与原有接口兼容的数据结构
export interface VideoContent {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  creatorId: string;
  duration: number;
  uploadTime: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  qualityScore: number;
  isPrivate?: boolean;
}

export interface UserBehavior {
  userId: string;
  videoId: string;
  action: 'like' | 'comment' | 'share' | 'view' | 'skip';
  watchTime: number;
  timestamp: number;
  videoCategory: string;
  videoTags: string[];
}

export interface RecommendationResult {
  videoId: string;
  score: number;
  reason: string;
  category: string;
}

export interface UserPreference {
  userId: string;
  categories: Record<string, number>;
  tags: Record<string, number>;
  creators: Record<string, number>;
  watchTimePreference: number;
  lastUpdated: number;
}

// 草稿数据结构
export interface VideoDraft {
  id: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  hashtags?: string[];
  userId: string;
  duration: number;
  videoUrl?: string;
  videoBlob?: Blob;
  videoFile?: File;
  thumbnailUrl?: string;
  editedVideo?: any;
  privacyLevel?: string;
  location?: string;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'failed' | 'pending';
  errorMessage?: string;
}

class DatabaseRecommendationService {
  private isOnline: boolean = true;
  private fallbackData: Map<string, VideoContent> = new Map();
  private drafts: Map<string, VideoDraft> = new Map();
  private readonly DRAFTS_STORAGE_KEY = 'video_drafts';

  constructor() {
    // 初始化时假设在线，在实际使用时进行检查
    this.isOnline = true;
    // 加载草稿数据
    this.loadDrafts();
    // 异步初始化连接检查
    this.initializeConnection();
  }

  // 异步初始化连接
  private async initializeConnection(): Promise<void> {
    await this.checkConnection();
  }

  // 检查API连接状态
  private async checkConnection(): Promise<boolean> {
    try {
      console.log('🔍 正在检查API连接状态...');
      const response = await apiService.healthCheck();
      
      // 验证响应格式
      if (response && typeof response === 'object' && response.success) {
        this.isOnline = true;
        console.log('✅ 数据库连接正常');
        return true;
      } else {
        console.warn('⚠️ API响应格式异常:', response);
        throw new Error('API响应格式不正确');
      }
    } catch (error) {
      this.isOnline = false;
      
      // 详细的错误日志
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('❌ API返回非JSON格式数据，可能是HTML错误页面:', error.message);
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ 网络连接失败:', error.message);
      } else {
        console.error('❌ API连接检查失败:', error);
      }
      
      console.warn('🔄 切换到离线模式');
      this.loadFallbackData();
      return false;
    }
  }

  // 加载离线数据（从localStorage）
  private loadFallbackData(): void {
    try {
      const data = localStorage.getItem('recommendationData');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.videoContents) {
          parsed.videoContents.forEach(([id, content]: [string, VideoContent]) => {
            this.fallbackData.set(id, content);
          });
        }
      }
      console.log('离线数据加载完成，视频数量:', this.fallbackData.size);
    } catch (error) {
      console.error('加载离线数据失败:', error);
    }
  }

  // 数据转换：API格式 -> 兼容格式
  private convertApiToVideoContent(apiVideo: VideoData): VideoContent {
    return {
      id: apiVideo.id,
      title: apiVideo.title,
      description: apiVideo.description || '',
      category: apiVideo.category,
      tags: apiVideo.tags,
      creatorId: apiVideo.user_id,
      duration: apiVideo.duration,
      uploadTime: new Date(apiVideo.created_at).getTime(),
      videoUrl: apiVideo.video_url,
      thumbnailUrl: apiVideo.thumbnail_url,
      stats: {
        views: apiVideo.view_count,
        likes: apiVideo.like_count,
        comments: apiVideo.comment_count,
        shares: apiVideo.share_count
      },
      qualityScore: apiVideo.quality_score,
      isPrivate: apiVideo.is_private
    };
  }

  // 数据转换：兼容格式 -> API格式
  private convertVideoContentToApi(video: VideoContent): any {
    return {
      user_id: video.creatorId,
      title: video.title,
      description: video.description,
      category: video.category,
      tags: video.tags,
      duration: video.duration,
      video_url: video.videoUrl,
      is_private: video.isPrivate || false
    };
  }

  // 发布视频
  async publishVideo(publishData: any): Promise<string> {
    try {
      // 实时检查连接状态
      console.log('🔍 检查API连接状态...');
      const isConnected = await this.checkConnection();
      
      if (!isConnected) {
        console.log('📝 API连接失败，保存为草稿');
        const draftId = await this.saveDraft(publishData);
        console.log(`✅ 视频已成功保存为草稿 (ID: ${draftId})`);
        return draftId; // 返回草稿ID而不是抛出错误
      }
      
      console.log('✅ API连接正常，开始发布视频');

      console.log('发布视频到数据库:', publishData);

      // 使用 Vercel Blob 存储上传视频和缩略图
      let processedVideoUrl = null;
      let thumbnailUrl = null;
      
      console.log('🚀 开始使用 Vercel Blob 存储上传视频...');
      
      // 检查 Blob 存储服务是否可用
      if (!blobStorageService.isAvailable()) {
        console.warn('⚠️ Vercel Blob 存储服务不可用，回退到原有方式');
        
        // 回退到原有的 base64 转换方式
        processedVideoUrl = publishData.videoUrl || publishData.videoFile;
        
        if (processedVideoUrl && processedVideoUrl.startsWith('blob:')) {
          console.log('🎬 检测到blob URL，正在转换为base64...');
          console.log('📍 Blob URL:', processedVideoUrl);
          
          try {
            // 首先检查blob URL是否仍然有效
            const isValidBlob = await this.checkBlobUrlValidity(processedVideoUrl);
            
            if (!isValidBlob) {
              console.warn('⚠️ Blob URL已失效，尝试从其他来源获取视频数据');
              
              // 尝试从publishData中获取原始视频数据
              if (publishData.videoBlob) {
                console.log('📦 找到原始视频Blob，直接转换');
                processedVideoUrl = await this.convertBlobDirectlyToBase64(publishData.videoBlob);
              } else if (publishData.videoFile) {
                console.log('📁 找到视频文件，转换为base64');
                processedVideoUrl = await this.convertFileToBase64(publishData.videoFile);
              } else {
                throw new Error('Blob URL已失效且无法找到原始视频数据');
              }
            } else {
              console.log('✅ Blob URL有效，开始转换');
              processedVideoUrl = await this.convertBlobToBase64(processedVideoUrl);
            }
            
            console.log('🎉 视频转换为base64成功，大小:', Math.round(processedVideoUrl.length / 1024), 'KB');
          } catch (error) {
            console.error('❌ 转换blob URL为base64失败:', error);
            
            // 如果转换失败，尝试使用原始URL（虽然可能不稳定）
            console.warn('⚠️ 将使用原始blob URL，但可能在页面刷新后失效');
            // 不抛出错误，而是继续使用原始URL
            // throw new Error('视频处理失败，请重试');
          }
        }
        
        // 处理缩略图数据（原有方式）
        console.log('🔍 开始处理缩略图数据...');
        if (publishData.editedVideo && publishData.editedVideo.cover && publishData.editedVideo.cover.preview) {
          console.log('🖼️ 检测到编辑器生成的缩略图，正在处理...');
          thumbnailUrl = publishData.editedVideo.cover.preview;
          console.log('✅ 缩略图数据已准备');
        }
      } else {
        console.log('✅ Vercel Blob 存储服务可用，开始上传');
        
        // 准备上传数据
        const uploadData: VideoUploadData = {
          videoFile: publishData.videoFile,
          videoBlob: publishData.videoBlob,
          videoUrl: publishData.videoUrl,
          thumbnailData: publishData.editedVideo?.cover?.preview,
          title: publishData.title || '未命名视频',
          userId: publishData.userId || 'user_demo_001'
        };
        
        // 上传到 Vercel Blob 存储
        const uploadResult = await blobStorageService.uploadVideo(uploadData);
        
        if (uploadResult.error) {
          console.error('❌ Blob 存储上传失败:', uploadResult.error);
          console.log('🔄 回退到原有上传方式...');
          
          // 回退到原有方式
          processedVideoUrl = publishData.videoUrl || publishData.videoFile;
          if (processedVideoUrl && processedVideoUrl.startsWith('blob:')) {
            try {
              processedVideoUrl = await this.convertBlobToBase64(processedVideoUrl);
            } catch (error) {
              console.error('❌ 回退方式也失败:', error);
              throw new Error('视频上传失败，请重试');
            }
          }
          
          if (publishData.editedVideo?.cover?.preview) {
            thumbnailUrl = publishData.editedVideo.cover.preview;
          }
        } else {
          console.log('✅ Blob 存储上传成功');
          processedVideoUrl = uploadResult.videoUrl;
          thumbnailUrl = uploadResult.thumbnailUrl;
          
          console.log('📹 视频 URL:', processedVideoUrl);
          console.log('🖼️ 缩略图 URL:', thumbnailUrl);
        }
      }

      // 转换发布数据格式
      const apiData = {
        user_id: publishData.userId || 'user_demo_001',
        title: publishData.title || '用户发布的视频',
        description: publishData.description || '',
        category: this.inferCategory(publishData.description || '', publishData.hashtags || []),
        tags: [
          ...(publishData.hashtags || []),
          publishData.location ? 'location' : null,
          publishData.privacyLevel || 'public'
        ].filter(Boolean),
        duration: publishData.duration || 60,
        video_url: processedVideoUrl,
        thumbnail_url: thumbnailUrl,
        is_private: publishData.privacyLevel === 'private'
      };

      console.log('🚀 准备调用后端API发布视频');
      console.log('📋 转换后的API数据:', apiData);
      
      const response = await apiService.publishVideo(apiData);
      
      console.log('📨 后端API响应:', response);
      
      if (response.success && response.data) {
        console.log('✅ 视频发布成功:', response.data.id);
        return response.data.id;
      } else {
        console.error('❌ 视频发布失败:', response.error);
        throw new Error(response.error || '发布失败');
      }
    } catch (error) {
      console.error('发布视频失败:', error);
      throw error;
    }
  }

  // 检查blob URL是否仍然有效
  private async checkBlobUrlValidity(blobUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        resolve(xhr.status === 200);
      };
      xhr.onerror = function() {
        resolve(false);
      };
      xhr.ontimeout = function() {
        resolve(false);
      };
      
      try {
        xhr.open('HEAD', blobUrl); // 使用HEAD请求只检查可用性
        xhr.timeout = 3000; // 3秒超时
        xhr.send();
      } catch (error) {
        resolve(false);
      }
    });
  }

  // 直接从Blob对象转换为base64
  private async convertBlobDirectlyToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = function() {
        console.log('✅ 直接blob转base64成功，大小:', Math.round((reader.result as string).length / 1024), 'KB');
        resolve(reader.result as string);
      };
      reader.onerror = function() {
        console.error('❌ 直接读取blob失败');
        reject(new Error('读取blob数据失败'));
      };
      reader.readAsDataURL(blob);
    });
  }

  // 从File对象转换为base64
  private async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = function() {
        console.log('✅ 文件转base64成功，大小:', Math.round((reader.result as string).length / 1024), 'KB');
        resolve(reader.result as string);
      };
      reader.onerror = function() {
        console.error('❌ 读取文件失败');
        reject(new Error('读取文件数据失败'));
      };
      reader.readAsDataURL(file);
    });
  }

  // 将blob URL转换为base64
  private async convertBlobToBase64(blobUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('🔄 开始转换blob URL为base64:', blobUrl);
      
      // 检查blob URL是否有效
      if (!blobUrl || !blobUrl.startsWith('blob:')) {
        reject(new Error('无效的blob URL'));
        return;
      }
      
      const xhr = new XMLHttpRequest();
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          const reader = new FileReader();
          reader.onloadend = function() {
            console.log('✅ blob转base64成功，大小:', Math.round((reader.result as string).length / 1024), 'KB');
            resolve(reader.result as string);
          };
          reader.onerror = function() {
            console.error('❌ FileReader读取失败');
            reject(new Error('读取blob数据失败'));
          };
          reader.readAsDataURL(xhr.response);
        } else {
          console.error('❌ XMLHttpRequest失败，状态码:', xhr.status);
          reject(new Error(`HTTP错误: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        console.error('❌ XMLHttpRequest网络错误');
        reject(new Error('获取blob数据失败'));
      };
      
      xhr.ontimeout = function() {
        console.error('❌ XMLHttpRequest超时');
        reject(new Error('获取blob数据超时'));
      };
      
      try {
        xhr.open('GET', blobUrl);
        xhr.responseType = 'blob';
        xhr.timeout = 10000; // 10秒超时
        xhr.send();
      } catch (error) {
        console.error('❌ XMLHttpRequest发送失败:', error);
        reject(new Error('发送请求失败'));
      }
    });
  }

  // 获取用户视频
  async getUserVideos(userId: string): Promise<VideoContent[]> {
    try {
      if (!this.isOnline) {
        // 离线模式：从fallbackData获取
        return Array.from(this.fallbackData.values())
          .filter(video => video.creatorId === userId)
          .sort((a, b) => b.uploadTime - a.uploadTime);
      }

      const response = await apiService.getUserVideos(userId, { limit: 100 });
      
      if (response.success && response.data) {
        return response.data.videos.map(video => this.convertApiToVideoContent(video));
      } else {
        throw new Error('获取用户视频失败');
      }
    } catch (error) {
      console.error('获取用户视频失败:', error);
      // 降级到离线数据
      return Array.from(this.fallbackData.values())
        .filter(video => video.creatorId === userId)
        .sort((a, b) => b.uploadTime - a.uploadTime);
    }
  }

  // 获取所有视频
  async getAllVideos(): Promise<VideoContent[]> {
    try {
      if (!this.isOnline) {
        return Array.from(this.fallbackData.values())
          .sort((a, b) => b.uploadTime - a.uploadTime);
      }

      const response = await apiService.getVideos({ limit: 100 });
      
      if (response.success && response.data) {
        return response.data.videos.map(video => this.convertApiToVideoContent(video));
      } else {
        throw new Error('获取视频列表失败');
      }
    } catch (error) {
      console.error('获取视频列表失败:', error);
      return Array.from(this.fallbackData.values())
        .sort((a, b) => b.uploadTime - a.uploadTime);
    }
  }

  // 根据ID获取视频
  async getVideoById(videoId: string): Promise<VideoContent | null> {
    try {
      if (!this.isOnline) {
        return this.fallbackData.get(videoId) || null;
      }

      const response = await apiService.getVideo(videoId);
      
      if (response.success && response.data) {
        return this.convertApiToVideoContent(response.data);
      } else {
        return null;
      }
    } catch (error) {
      console.error('获取视频详情失败:', error);
      return this.fallbackData.get(videoId) || null;
    }
  }

  // 删除视频
  async deleteVideo(videoId: string, userId?: string): Promise<boolean> {
    try {
      if (!this.isOnline) {
        const deleted = this.fallbackData.delete(videoId);
        this.saveFallbackData();
        return deleted;
      }

      const response = await apiService.deleteVideo(videoId, userId || 'user_demo_001');
      return response.success;
    } catch (error) {
      console.error('删除视频失败:', error);
      return false;
    }
  }

  // 重置所有视频数据（危险操作）
  async resetAllVideos(userId: string = 'user_demo_001'): Promise<{
    success: boolean;
    deletedCount: number;
    error?: string;
  }> {
    try {
      // 实时检查连接状态
      console.log('🔍 检查API连接状态...');
      const isConnected = await this.checkConnection();
      
      if (!isConnected) {
        // 离线模式：清空本地数据
        console.log('⚠️ 离线模式：清空本地视频数据');
        const localCount = this.fallbackData.size;
        this.fallbackData.clear();
        this.saveFallbackData();
        
        return {
          success: true,
          deletedCount: localCount,
          error: '离线模式：仅清空了本地数据'
        };
      }

      console.log('✅ API连接正常，开始重置所有视频数据');
      console.log('👤 用户ID:', userId);
      
      // 调用API重置数据
      const response = await apiService.resetAllVideos(userId, 'RESET_ALL_VIDEOS_CONFIRM');
      
      if (response.success && response.data) {
        console.log('✅ 视频数据重置成功:', response.data);
        
        // 清空本地缓存数据
        this.fallbackData.clear();
        this.saveFallbackData();
        
        return {
          success: true,
          deletedCount: response.data.deletedCount
        };
      } else {
        console.error('❌ 视频数据重置失败:', response.error);
        return {
          success: false,
          deletedCount: 0,
          error: response.error || '重置失败'
        };
      }
    } catch (error) {
      console.error('重置视频数据失败:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : '重置失败'
      };
    }
  }

  // 更新视频信息
  async updateVideo(videoId: string, updates: Partial<VideoContent>): Promise<boolean> {
    try {
      if (!this.isOnline) {
        const video = this.fallbackData.get(videoId);
        if (video) {
          this.fallbackData.set(videoId, { ...video, ...updates });
          this.saveFallbackData();
          return true;
        }
        return false;
      }

      const apiUpdates: any = {};
      if (updates.title) apiUpdates.title = updates.title;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.category) apiUpdates.category = updates.category;
      if (updates.tags) apiUpdates.tags = updates.tags;
      if (updates.isPrivate !== undefined) apiUpdates.is_private = updates.isPrivate;

      const response = await apiService.updateVideo(videoId, apiUpdates);
      return response.success;
    } catch (error) {
      console.error('更新视频失败:', error);
      return false;
    }
  }

  // 记录用户行为
  async recordUserBehavior(behavior: UserBehavior): Promise<void> {
    try {
      if (!this.isOnline) {
        console.log('离线模式：跳过行为记录');
        return;
      }

      const apiBehavior: UserBehaviorData = {
        user_id: behavior.userId,
        video_id: behavior.videoId,
        action: behavior.action,
        watch_time: behavior.watchTime,
        device_type: 'desktop' // 可以根据实际情况检测
      };

      await apiService.recordBehavior(behavior.videoId, apiBehavior);
    } catch (error) {
      console.error('记录用户行为失败:', error);
    }
  }

  // 获取个性化推荐
  async getPersonalizedRecommendations(
    userId: string,
    count: number = 10,
    excludeVideoIds: string[] = []
  ): Promise<RecommendationResult[]> {
    try {
      if (!this.isOnline) {
        // 离线模式：简单推荐
        const videos = Array.from(this.fallbackData.values())
          .filter(video => !excludeVideoIds.includes(video.id))
          .slice(0, count);
        
        return videos.map(video => ({
          videoId: video.id,
          score: video.qualityScore,
          reason: '离线推荐',
          category: video.category
        }));
      }

      const response = await apiService.getRecommendations(userId, count);
      
      if (response.success && response.data) {
        return response.data
          .filter(video => !excludeVideoIds.includes(video.id))
          .map(video => ({
            videoId: video.id,
            score: video.quality_score,
            reason: '基于用户偏好推荐',
            category: video.category
          }));
      } else {
        throw new Error(response.error || '获取推荐失败');
      }
    } catch (error) {
      console.error('获取推荐失败:', error);
      // 降级到简单推荐
      const videos = Array.from(this.fallbackData.values())
        .filter(video => !excludeVideoIds.includes(video.id))
        .slice(0, count);
      
      return videos.map(video => ({
        videoId: video.id,
        score: video.qualityScore,
        reason: '降级推荐',
        category: video.category
      }));
    }
  }

  // 标记为已观看
  markAsViewed(userId: string, videoId: string): void {
    this.recordUserBehavior({
      userId,
      videoId,
      action: 'view',
      watchTime: 0,
      timestamp: Date.now(),
      videoCategory: '',
      videoTags: []
    });
  }

  // 标记为不感兴趣
  markAsNotInterested(userId: string, videoId: string, reason?: string): void {
    this.recordUserBehavior({
      userId,
      videoId,
      action: 'skip',
      watchTime: 0,
      timestamp: Date.now(),
      videoCategory: '',
      videoTags: []
    });
  }

  // 获取用户偏好统计
  async getUserPreferenceStats(userId: string): Promise<UserPreference | null> {
    try {
      if (!this.isOnline) {
        return null;
      }

      const response = await apiService.getUserStats(userId);
      
      if (response.success && response.data) {
        const stats = response.data;
        return {
          userId,
          categories: stats.category_preferences || {},
          tags: {},
          creators: {},
          watchTimePreference: 0,
          lastUpdated: Date.now()
        };
      }
      
      return null;
    } catch (error) {
      console.error('获取用户偏好失败:', error);
      return null;
    }
  }

  // 刷新推荐
  async refreshRecommendations(userId: string, count: number = 10): Promise<RecommendationResult[]> {
    return this.getPersonalizedRecommendations(userId, count);
  }

  // 推断视频类别
  private inferCategory(description: string, tags: string[]): string {
    const categoryKeywords = {
      '美食': ['美食', '烹饪', '做菜', '食物', '料理', '餐厅', '小吃'],
      '旅行': ['旅行', '旅游', '风景', '景点', '度假', '探索', '户外'],
      '生活': ['生活', '日常', 'vlog', '分享', '记录', '感悟'],
      '音乐': ['音乐', '歌曲', '演奏', '唱歌', '乐器', '节拍'],
      '舞蹈': ['舞蹈', '跳舞', '编舞', '表演', '律动'],
      '搞笑': ['搞笑', '幽默', '有趣', '好玩', '逗乐', '段子'],
      '教育': ['教程', '学习', '知识', '技能', '教学', '分析'],
      '科技': ['科技', '技术', '数码', '电子', '创新', '发明']
    };
    
    const text = (description + ' ' + tags.join(' ')).toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return '生活';
  }

  // 保存离线数据
  private saveFallbackData(): void {
    try {
      const data = {
        videoContents: Array.from(this.fallbackData.entries())
      };
      localStorage.setItem('recommendationData', JSON.stringify(data));
    } catch (error) {
      console.error('保存离线数据失败:', error);
    }
  }

  // 添加视频内容（内部方法）
  addVideoContent(video: VideoContent): void {
    this.fallbackData.set(video.id, video);
    this.saveFallbackData();
  }

  // === 草稿管理方法 ===

  // 加载草稿数据
  private loadDrafts(): void {
    try {
      const data = localStorage.getItem(this.DRAFTS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          parsed.forEach(([id, draft]: [string, VideoDraft]) => {
            this.drafts.set(id, draft);
          });
        }
      }
      console.log('草稿数据加载完成，草稿数量:', this.drafts.size);
    } catch (error) {
      console.error('加载草稿数据失败:', error);
    }
  }

  // 保存草稿数据到本地存储
  private saveDrafts(): void {
    try {
      const data = Array.from(this.drafts.entries());
      localStorage.setItem(this.DRAFTS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('保存草稿数据失败:', error);
    }
  }

  // 保存视频为草稿
  async saveDraft(publishData: any): Promise<string> {
    try {
      const draftId = 'draft_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const now = Date.now();
      
      // 处理视频数据，确保可以持久化存储
      let processedVideoUrl = publishData.videoUrl;
      let videoBlob = publishData.videoBlob;
      let videoFile = publishData.videoFile;
      
      // 如果是blob URL，尝试转换为base64以便持久化
      if (processedVideoUrl && processedVideoUrl.startsWith('blob:')) {
        try {
          if (publishData.videoBlob) {
            processedVideoUrl = await this.convertBlobDirectlyToBase64(publishData.videoBlob);
            videoBlob = undefined; // 已转换为base64，不需要保存blob
          } else if (publishData.videoFile) {
            processedVideoUrl = await this.convertFileToBase64(publishData.videoFile);
            videoFile = undefined; // 已转换为base64，不需要保存file
          }
        } catch (error) {
          console.warn('转换视频数据失败，保存原始数据:', error);
        }
      }
      
      const draft: VideoDraft = {
        id: draftId,
        title: publishData.title || '未命名视频',
        description: publishData.description || '',
        category: publishData.category,
        tags: publishData.tags,
        hashtags: publishData.hashtags,
        userId: publishData.userId || 'user_demo_001',
        duration: publishData.duration || 60,
        videoUrl: processedVideoUrl,
        videoBlob: videoBlob,
        videoFile: videoFile,
        thumbnailUrl: publishData.editedVideo?.cover?.preview,
        editedVideo: publishData.editedVideo,
        privacyLevel: publishData.privacyLevel || 'public',
        location: publishData.location,
        createdAt: now,
        updatedAt: now,
        status: 'draft',
        errorMessage: '网络连接失败时保存'
      };
      
      this.drafts.set(draftId, draft);
      this.saveDrafts();
      
      console.log('✅ 视频已保存为草稿:', draftId);
      return draftId;
    } catch (error) {
      console.error('保存草稿失败:', error);
      throw new Error('保存草稿失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // 获取所有草稿
  getDrafts(): VideoDraft[] {
    return Array.from(this.drafts.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // 根据ID获取草稿
  getDraft(draftId: string): VideoDraft | null {
    return this.drafts.get(draftId) || null;
  }

  // 更新草稿
  updateDraft(draftId: string, updates: Partial<VideoDraft>): boolean {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      return false;
    }
    
    const updatedDraft = {
      ...draft,
      ...updates,
      updatedAt: Date.now()
    };
    
    this.drafts.set(draftId, updatedDraft);
    this.saveDrafts();
    return true;
  }

  // 删除草稿
  deleteDraft(draftId: string): boolean {
    const deleted = this.drafts.delete(draftId);
    if (deleted) {
      this.saveDrafts();
    }
    return deleted;
  }

  // 从草稿重新发布视频
  async republishFromDraft(draftId: string): Promise<string> {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      throw new Error('草稿不存在');
    }
    
    // 更新草稿状态为pending
    this.updateDraft(draftId, { status: 'pending' });
    
    try {
      // 重新构造发布数据
      const publishData = {
        title: draft.title,
        description: draft.description,
        category: draft.category,
        tags: draft.tags,
        hashtags: draft.hashtags,
        userId: draft.userId,
        duration: draft.duration,
        videoUrl: draft.videoUrl,
        videoBlob: draft.videoBlob,
        videoFile: draft.videoFile,
        editedVideo: draft.editedVideo,
        privacyLevel: draft.privacyLevel,
        location: draft.location
      };
      
      // 尝试发布
      const videoId = await this.publishVideoDirectly(publishData);
      
      // 发布成功，删除草稿
      this.deleteDraft(draftId);
      
      console.log('✅ 草稿重新发布成功:', videoId);
      return videoId;
    } catch (error) {
      // 发布失败，更新草稿状态
      this.updateDraft(draftId, { 
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // 直接发布视频（不检查连接状态，用于草稿重新发布）
  private async publishVideoDirectly(publishData: any): Promise<string> {
    console.log('🚀 直接发布视频（从草稿）:', publishData);

    // 处理视频URL
    let processedVideoUrl = publishData.videoUrl || publishData.videoFile;
    
    if (processedVideoUrl && processedVideoUrl.startsWith('blob:')) {
      console.log('🎬 检测到blob URL，正在转换为base64...');
      
      try {
        if (publishData.videoBlob) {
          processedVideoUrl = await this.convertBlobDirectlyToBase64(publishData.videoBlob);
        } else if (publishData.videoFile) {
          processedVideoUrl = await this.convertFileToBase64(publishData.videoFile);
        } else {
          processedVideoUrl = await this.convertBlobToBase64(processedVideoUrl);
        }
      } catch (error) {
        console.error('❌ 转换视频数据失败:', error);
        throw new Error('视频处理失败，请重试');
      }
    }

    // 处理缩略图数据
    let thumbnailUrl = null;
    if (publishData.editedVideo && publishData.editedVideo.cover && publishData.editedVideo.cover.preview) {
      thumbnailUrl = publishData.editedVideo.cover.preview;
    }

    // 转换发布数据格式
    const apiData = {
      user_id: publishData.userId || 'user_demo_001',
      title: publishData.title || '用户发布的视频',
      description: publishData.description || '',
      category: this.inferCategory(publishData.description || '', publishData.hashtags || []),
      tags: [
        ...(publishData.hashtags || []),
        publishData.location ? 'location' : null,
        publishData.privacyLevel || 'public'
      ].filter(Boolean),
      duration: publishData.duration || 60,
      video_url: processedVideoUrl,
      thumbnail_url: thumbnailUrl,
      is_private: publishData.privacyLevel === 'private'
    };

    console.log('🚀 准备调用后端API发布视频（从草稿）');
    
    const response = await apiService.publishVideo(apiData);
    
    if (response.success && response.data) {
      console.log('✅ 草稿视频发布成功:', response.data.id);
      return response.data.id;
    } else {
      console.error('❌ 草稿视频发布失败:', response.error);
      throw new Error(response.error || '发布失败');
    }
  }

  // 清空所有草稿
  clearAllDrafts(): void {
    this.drafts.clear();
    this.saveDrafts();
    console.log('✅ 所有草稿已清空');
  }

  // 获取草稿统计信息
  getDraftStats(): { total: number; draft: number; failed: number; pending: number } {
    const drafts = Array.from(this.drafts.values());
    return {
      total: drafts.length,
      draft: drafts.filter(d => d.status === 'draft').length,
      failed: drafts.filter(d => d.status === 'failed').length,
      pending: drafts.filter(d => d.status === 'pending').length
    };
  }
}

// 导出单例实例
export const databaseRecommendationService = new DatabaseRecommendationService();
export default databaseRecommendationService;