/**
 * API服务客户端
 * 统一处理前端与后端API的通信
 */

// API基础配置
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

// 通用API响应接口
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应接口
interface PaginatedResponse<T> {
  success: boolean;
  data: {
    videos?: T[];
    users?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// 视频数据接口
export interface VideoData {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  duration: number;
  video_url?: string;
  thumbnail_url?: string;
  quality_score: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_private: boolean;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    nickname: string;
    avatar?: string;
    is_verified: boolean;
  };
}

// 用户数据接口
export interface UserData {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthday?: string;
  follower_count: number;
  following_count: number;
  video_count: number;
  like_count: number;
  is_verified: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// 用户行为数据接口
export interface UserBehaviorData {
  user_id: string;
  video_id: string;
  action: 'view' | 'like' | 'comment' | 'share' | 'skip';
  watch_time?: number;
  watch_percentage?: number;
  device_type?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      console.log(`API请求: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      // 检查响应的Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ API返回非JSON格式数据:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          responseText: text.substring(0, 200) + (text.length > 200 ? '...' : '')
        });
        throw new Error(`服务器返回非JSON格式数据: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log(`API响应: ${url}`, data);
      return data;
    } catch (error) {
      // 增强错误处理
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error(`❌ JSON解析失败 ${endpoint}:`, error.message);
        throw new Error('服务器响应格式错误，请稍后重试');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`❌ 网络请求失败 ${endpoint}:`, error.message);
        throw new Error('网络连接失败，请检查网络设置');
      } else {
        console.error(`❌ API请求失败: ${endpoint}`, error);
        throw error;
      }
    }
  }

  // GET请求
  private async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let finalEndpoint = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        finalEndpoint += '?' + searchParams.toString();
      }
    }
    
    return this.request<T>(finalEndpoint, {
      method: 'GET',
    });
  }

  // POST请求
  private async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT请求
  private async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求（支持查询参数）
  private async delete<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let finalEndpoint = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        finalEndpoint += '?' + searchParams.toString();
      }
    }
    
    return this.request<T>(finalEndpoint, {
      method: 'DELETE',
    });
  }

  // DELETE请求（支持请求体）
  private async deleteWithBody<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // === 视频相关API ===

  // 获取视频列表
  async getVideos(params?: {
    page?: number;
    limit?: number;
    category?: string;
    userId?: string;
  }): Promise<PaginatedResponse<VideoData>> {
    const response = await this.get<any>('/videos', params);
    return response as PaginatedResponse<VideoData>;
  }

  // 获取单个视频
  async getVideo(id: string): Promise<ApiResponse<VideoData>> {
    return this.get<VideoData>(`/videos/${id}`);
  }

  // 发布视频
  async publishVideo(videoData: {
    user_id: string;
    title: string;
    description?: string;
    category: string;
    tags?: string[];
    duration: number;
    video_url?: string;
    thumbnail_url?: string;
    is_private?: boolean;
  }): Promise<ApiResponse<VideoData>> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`🎬 [${requestId}] 发布视频API调用开始`);
    console.log(`📍 [${requestId}] API基础URL:`, this.baseURL);
    console.log(`📍 [${requestId}] 完整请求URL:`, `${this.baseURL}/videos`);
    console.log(`🌍 [${requestId}] 环境:`, process.env.NODE_ENV || 'development');
    console.log(`📊 [${requestId}] 数据统计:`, {
      titleLength: videoData.title.length,
      descriptionLength: videoData.description?.length || 0,
      tagsCount: videoData.tags?.length || 0,
      hasVideoUrl: !!videoData.video_url,
      hasThumbnail: !!videoData.thumbnail_url,
      thumbnailSize: videoData.thumbnail_url ? Math.round(videoData.thumbnail_url.length / 1024) + ' KB' : 'N/A',
      isPrivate: !!videoData.is_private
    });
    
    try {
      const result = await this.post<VideoData>('/videos', videoData);
      const processingTime = Date.now() - startTime;
      console.log(`✅ [${requestId}] 发布视频API调用完成，耗时: ${processingTime}ms`, result);
      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ [${requestId}] 发布视频API调用失败，耗时: ${processingTime}ms`, error);
      throw error;
    }
  }

  // 更新视频
  async updateVideo(id: string, updates: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    is_private?: boolean;
  }): Promise<ApiResponse<VideoData>> {
    return this.put<VideoData>(`/videos/${id}`, updates);
  }

  // 删除视频
  async deleteVideo(id: string, userId?: string): Promise<ApiResponse<any>> {
    return this.delete(`/videos/${id}`, userId ? { user_id: userId } : undefined);
  }

  // 重置所有视频数据（危险操作）
  async resetAllVideos(userId: string, confirmToken: string): Promise<ApiResponse<{
    deletedCount: number;
    userId: string;
  }>> {
    console.log('🚨 重置所有视频数据API调用开始');
    console.log('👤 用户ID:', userId);
    console.log('🔑 确认令牌:', confirmToken);
    
    const result = await this.deleteWithBody<{
      deletedCount: number;
      userId: string;
    }>('/videos/reset/all', {
      user_id: userId,
      confirm_token: confirmToken
    });
    
    console.log('✅ 重置视频数据API调用完成:', result);
    return result;
  }

  // 记录用户行为
  async recordBehavior(videoId: string, behavior: UserBehaviorData): Promise<ApiResponse<any>> {
    return this.post(`/videos/${videoId}/behavior`, behavior);
  }

  // 获取推荐视频
  async getRecommendations(userId: string, limit?: number): Promise<ApiResponse<VideoData[]>> {
    return this.get<VideoData[]>(`/videos/recommendations/${userId}`, { limit });
  }

  // === 用户相关API ===

  // 获取用户列表
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<UserData>> {
    const response = await this.get<any>('/users', params);
    return response as PaginatedResponse<UserData>;
  }

  // 获取单个用户
  async getUser(id: string, includePrivate?: boolean): Promise<ApiResponse<UserData>> {
    return this.get<UserData>(`/users/${id}`, { includePrivate });
  }

  // 创建用户
  async createUser(userData: {
    username: string;
    nickname: string;
    email?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    birthday?: string;
  }): Promise<ApiResponse<UserData>> {
    return this.post<UserData>('/users', userData);
  }

  // 更新用户
  async updateUser(id: string, updates: {
    nickname?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    birthday?: string;
  }): Promise<ApiResponse<UserData>> {
    return this.put<UserData>(`/users/${id}`, updates);
  }

  // 获取用户视频
  async getUserVideos(userId: string, params?: {
    page?: number;
    limit?: number;
    includePrivate?: boolean;
  }): Promise<PaginatedResponse<VideoData>> {
    const response = await this.get<any>(`/users/${userId}/videos`, params);
    return response as PaginatedResponse<VideoData>;
  }

  // 获取用户统计
  async getUserStats(userId: string, days?: number): Promise<ApiResponse<any>> {
    return this.get(`/users/${userId}/stats`, { days });
  }

  // === 健康检查 ===
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.get('/health');
  }
}

// 导出单例实例
export const apiService = new ApiService();
export default apiService;