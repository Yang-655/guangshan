// 推荐算法服务

// 用户行为数据接口
interface UserBehavior {
  userId: string;
  videoId: string;
  action: 'like' | 'comment' | 'share' | 'view' | 'skip';
  watchTime: number; // 观看时长（秒）
  timestamp: number;
  videoCategory: string;
  videoTags: string[];
}

// 用户偏好数据接口
interface UserPreference {
  userId: string;
  categories: Record<string, number>; // 类别权重
  tags: Record<string, number>; // 标签权重
  creators: Record<string, number>; // 创作者权重
  watchTimePreference: number; // 偏好的视频时长
  lastUpdated: number;
}

// 视频内容接口
interface VideoContent {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  creatorId: string;
  duration: number;
  uploadTime: number;
  videoUrl?: string; // 视频文件URL
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  qualityScore: number; // 内容质量评分
  isPrivate?: boolean; // 是否为私密视频
}

// 推荐结果接口
interface RecommendationResult {
  videoId: string;
  score: number;
  reason: string; // 推荐原因
  category: string;
}

// 发布数据接口
interface PublishData {
  title?: string;
  description?: string;
  hashtags?: string[];
  location?: string;
  privacyLevel?: string;
  videoUrl?: string;
  videoFile?: string;
  userId?: string;
  duration?: number;
}

class RecommendationService {
  private userBehaviors: Map<string, UserBehavior[]> = new Map();
  private userPreferences: Map<string, UserPreference> = new Map();
  private videoContents: Map<string, VideoContent> = new Map();
  private blacklistedVideos: Map<string, Set<string>> = new Map(); // 用户黑名单
  private viewedVideos: Map<string, Set<string>> = new Map(); // 已观看视频

  constructor() {
    this.loadFromStorage();
    this.initializeMockData();
  }

  // 记录用户行为
  recordUserBehavior(behavior: UserBehavior): void {
    const userId = behavior.userId;
    if (!this.userBehaviors.has(userId)) {
      this.userBehaviors.set(userId, []);
    }
    
    const behaviors = this.userBehaviors.get(userId)!;
    behaviors.push(behavior);
    
    // 只保留最近1000条行为记录
    if (behaviors.length > 1000) {
      behaviors.splice(0, behaviors.length - 1000);
    }
    
    // 更新用户偏好
    this.updateUserPreference(userId);
    this.saveToStorage();
  }

  // 更新用户偏好
  private updateUserPreference(userId: string): void {
    const behaviors = this.userBehaviors.get(userId) || [];
    const preference: UserPreference = {
      userId,
      categories: {},
      tags: {},
      creators: {},
      watchTimePreference: 0,
      lastUpdated: Date.now()
    };

    let totalWatchTime = 0;
    let validBehaviors = 0;

    // 分析用户行为，计算权重
    behaviors.forEach(behavior => {
      const weight = this.calculateBehaviorWeight(behavior);
      
      // 类别权重
      preference.categories[behavior.videoCategory] = 
        (preference.categories[behavior.videoCategory] || 0) + weight;
      
      // 标签权重
      behavior.videoTags.forEach(tag => {
        preference.tags[tag] = (preference.tags[tag] || 0) + weight * 0.5;
      });
      
      // 创作者权重
      const video = this.videoContents.get(behavior.videoId);
      if (video) {
        preference.creators[video.creatorId] = 
          (preference.creators[video.creatorId] || 0) + weight;
      }
      
      // 观看时长偏好
      if (behavior.action === 'view' && behavior.watchTime > 0) {
        totalWatchTime += behavior.watchTime;
        validBehaviors++;
      }
    });

    // 计算平均观看时长偏好
    if (validBehaviors > 0) {
      preference.watchTimePreference = totalWatchTime / validBehaviors;
    }

    this.userPreferences.set(userId, preference);
  }

  // 计算行为权重
  private calculateBehaviorWeight(behavior: UserBehavior): number {
    const baseWeights = {
      like: 3,
      comment: 4,
      share: 5,
      view: 1,
      skip: -2
    };

    let weight = baseWeights[behavior.action];
    
    // 根据观看时长调整权重
    if (behavior.action === 'view') {
      const video = this.videoContents.get(behavior.videoId);
      if (video && video.duration > 0) {
        const watchRatio = behavior.watchTime / video.duration;
        weight *= Math.min(watchRatio * 2, 2); // 最多2倍权重
      }
    }
    
    // 时间衰减：越新的行为权重越高
    const daysSinceAction = (Date.now() - behavior.timestamp) / (1000 * 60 * 60 * 24);
    const timeDecay = Math.exp(-daysSinceAction / 30); // 30天衰减期
    
    return weight * timeDecay;
  }

  // 获取个性化推荐（优化版本）
  async getPersonalizedRecommendations(
    userId: string, 
    count: number = 10,
    excludeVideoIds: string[] = []
  ): Promise<RecommendationResult[]> {
    const userPreference = this.userPreferences.get(userId);
    const viewedVideos = this.viewedVideos.get(userId) || new Set();
    const blacklistedVideos = this.blacklistedVideos.get(userId) || new Set();
    const userBehaviors = this.userBehaviors.get(userId) || [];
    
    // 获取候选视频（优化过滤逻辑）
    const candidateVideos = Array.from(this.videoContents.values())
      .filter(video => {
        // 基础过滤
        if (viewedVideos.has(video.id) || 
            blacklistedVideos.has(video.id) || 
            excludeVideoIds.includes(video.id)) {
          return false;
        }
        
        // 质量过滤：过滤掉质量分数过低的视频
        if (video.qualityScore < 3) {
          return false;
        }
        
        // 时效性过滤：过滤掉过于陈旧的视频（除非是经典内容）
        const daysSinceUpload = (Date.now() - video.uploadTime) / (1000 * 60 * 60 * 24);
        if (daysSinceUpload > 365 && video.stats.views < 1000) {
          return false;
        }
        
        return true;
      });

    // 计算推荐分数（增强版本）
    const scoredVideos = candidateVideos.map(video => {
      const score = this.calculateEnhancedRecommendationScore(video, userPreference, userBehaviors);
      const reason = this.generateRecommendationReason(video, userPreference);
      const confidence = this.calculateConfidenceScore(video, userPreference, userBehaviors);
      
      return {
        videoId: video.id,
        score,
        reason,
        category: video.category,
        confidence
      };
    });

    // 排序并应用多样性控制
    const diversifiedResults = this.applyEnhancedDiversityControl(scoredVideos, count);
    
    return diversifiedResults.slice(0, count);
  }

  // 增强版推荐分数计算
  private calculateEnhancedRecommendationScore(
    video: VideoContent, 
    userPreference?: UserPreference,
    userBehaviors: UserBehavior[] = []
  ): number {
    let score = 0;
    
    // 基础质量分数（权重调整）
    score += video.qualityScore * 0.25;
    
    // 优化热度分数计算
    const engagementRate = video.stats.views > 0 ? 
      (video.stats.likes + video.stats.comments + video.stats.shares) / video.stats.views : 0;
    const popularityScore = Math.log(video.stats.views + 1) * 0.08 +
                           Math.log(video.stats.likes + 1) * 0.12 +
                           Math.log(video.stats.comments + 1) * 0.08 +
                           engagementRate * 10; // 互动率加权
    score += popularityScore * 0.2;
    
    // 动态新鲜度分数
    const daysSinceUpload = (Date.now() - video.uploadTime) / (1000 * 60 * 60 * 24);
    let freshnessScore;
    if (daysSinceUpload < 1) {
      freshnessScore = 1.2; // 新发布内容加权
    } else if (daysSinceUpload < 7) {
      freshnessScore = Math.exp(-daysSinceUpload / 7);
    } else {
      freshnessScore = Math.exp(-daysSinceUpload / 30) * 0.5; // 长期内容降权
    }
    score += freshnessScore * 0.15;
    
    // 增强个性化分数
    if (userPreference) {
      // 类别偏好（动态权重）
      const categoryWeight = userPreference.categories[video.category] || 0;
      const categoryBonus = categoryWeight > 5 ? 1.2 : 1.0; // 强偏好加权
      score += categoryWeight * 0.25 * categoryBonus;
      
      // 标签偏好（改进计算）
      const relevantTags = video.tags.filter(tag => userPreference.tags[tag] > 0);
      const tagScore = relevantTags.length > 0 ? 
        relevantTags.reduce((sum, tag) => sum + userPreference.tags[tag], 0) / relevantTags.length : 0;
      score += tagScore * 0.2;
      
      // 创作者偏好（增强）
      const creatorWeight = userPreference.creators[video.creatorId] || 0;
      const creatorBonus = creatorWeight > 3 ? 1.3 : 1.0;
      score += creatorWeight * 0.15 * creatorBonus;
      
      // 智能时长偏好
      if (userPreference.watchTimePreference > 0) {
        const optimalDuration = userPreference.watchTimePreference;
        const durationRatio = Math.min(video.duration, optimalDuration) / Math.max(video.duration, optimalDuration);
        const durationScore = Math.pow(durationRatio, 0.5); // 平方根缓解惩罚
        score += durationScore * 0.1;
      }
    }
    
    // 行为模式分析加权
    if (userBehaviors.length > 0) {
      const recentBehaviors = userBehaviors.filter(b => 
        Date.now() - b.timestamp < 7 * 24 * 60 * 60 * 1000 // 最近7天
      );
      
      // 分析用户最近的观看模式
      const avgWatchTime = recentBehaviors.reduce((sum, b) => sum + b.watchTime, 0) / recentBehaviors.length;
      const preferredTimeSlot = this.getPreferredTimeSlot(recentBehaviors);
      const currentHour = new Date().getHours();
      
      // 时间段匹配加权
      if (Math.abs(currentHour - preferredTimeSlot) <= 2) {
        score *= 1.1;
      }
      
      // 观看时长匹配
      if (avgWatchTime > 0) {
        const watchTimeRatio = Math.min(video.duration, avgWatchTime) / Math.max(video.duration, avgWatchTime);
        score *= (0.8 + 0.4 * watchTimeRatio); // 0.8-1.2倍权重
      }
    }
    
    return Math.max(0, score);
  }
  
  // 计算推荐置信度
  private calculateConfidenceScore(
    video: VideoContent,
    userPreference?: UserPreference,
    userBehaviors: UserBehavior[] = []
  ): number {
    let confidence = 0.5; // 基础置信度
    
    // 用户数据丰富度影响置信度
    if (userPreference) {
      const categoryCount = Object.keys(userPreference.categories).length;
      const tagCount = Object.keys(userPreference.tags).length;
      const creatorCount = Object.keys(userPreference.creators).length;
      
      confidence += Math.min(0.3, (categoryCount + tagCount + creatorCount) * 0.01);
    }
    
    // 行为数据影响置信度
    if (userBehaviors.length > 0) {
      confidence += Math.min(0.2, userBehaviors.length * 0.002);
    }
    
    // 视频质量影响置信度
    confidence += (video.qualityScore / 10) * 0.2;
    
    // 统计数据影响置信度
    if (video.stats.views > 100) {
      confidence += Math.min(0.1, Math.log(video.stats.views) * 0.01);
    }
    
    return Math.min(1.0, confidence);
  }
  
  // 获取用户偏好的时间段
  private getPreferredTimeSlot(behaviors: UserBehavior[]): number {
    const hourCounts: Record<number, number> = {};
    
    behaviors.forEach(behavior => {
      const hour = new Date(behavior.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    let maxCount = 0;
    let preferredHour = 12; // 默认中午
    
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        preferredHour = parseInt(hour);
      }
    });
    
    return preferredHour;
  }

  // 生成推荐原因
  private generateRecommendationReason(
    video: VideoContent, 
    userPreference?: UserPreference
  ): string {
    const reasons: string[] = [];
    
    if (userPreference) {
      // 检查类别偏好
      const categoryWeight = userPreference.categories[video.category] || 0;
      if (categoryWeight > 5) {
        reasons.push(`因为你喜欢${video.category}类内容`);
      }
      
      // 检查创作者偏好
      const creatorWeight = userPreference.creators[video.creatorId] || 0;
      if (creatorWeight > 3) {
        reasons.push('因为你关注的创作者');
      }
      
      // 检查标签偏好
      const preferredTags = video.tags.filter(tag => 
        (userPreference.tags[tag] || 0) > 2
      );
      if (preferredTags.length > 0) {
        reasons.push(`因为包含你感兴趣的标签: ${preferredTags.slice(0, 2).join(', ')}`);
      }
    }
    
    // 热门内容
    if (video.stats.views > 10000) {
      reasons.push('热门推荐');
    }
    
    // 新内容
    const daysSinceUpload = (Date.now() - video.uploadTime) / (1000 * 60 * 60 * 24);
    if (daysSinceUpload < 1) {
      reasons.push('最新发布');
    }
    
    // 高质量内容
    if (video.qualityScore > 8) {
      reasons.push('高质量内容');
    }
    
    return reasons.length > 0 ? reasons[0] : '为你推荐';
  }

  // 增强版多样性控制
  private applyEnhancedDiversityControl(
    scoredVideos: (RecommendationResult & { confidence: number })[], 
    count: number
  ): RecommendationResult[] {
    // 按分数和置信度综合排序
    scoredVideos.sort((a, b) => {
      const scoreA = a.score * (0.7 + 0.3 * a.confidence);
      const scoreB = b.score * (0.7 + 0.3 * b.confidence);
      return scoreB - scoreA;
    });
    
    const result: RecommendationResult[] = [];
    const categoryCount: Record<string, number> = {};
    const creatorCount: Record<string, number> = {};
    
    // 动态计算类别限制
    const maxPerCategory = Math.max(1, Math.floor(count * 0.4)); // 每个类别最多占40%
    const maxPerCreator = Math.max(1, Math.floor(count * 0.3)); // 每个创作者最多占30%
    
    // 第一轮：选择高质量高置信度的视频
    const highConfidenceVideos = scoredVideos.filter(v => v.confidence > 0.7);
    for (const video of highConfidenceVideos) {
      if (result.length >= Math.floor(count * 0.6)) break;
      
      const currentCategoryCount = categoryCount[video.category] || 0;
      const videoContent = this.videoContents.get(video.videoId);
      const currentCreatorCount = videoContent ? (creatorCount[videoContent.creatorId] || 0) : 0;
      
      if (currentCategoryCount < maxPerCategory && 
          currentCreatorCount < maxPerCreator) {
        result.push(video);
        categoryCount[video.category] = currentCategoryCount + 1;
        if (videoContent) {
          creatorCount[videoContent.creatorId] = currentCreatorCount + 1;
        }
      }
    }
    
    // 第二轮：填充剩余位置，确保多样性
    const remaining = scoredVideos.filter(video => 
      !result.some(r => r.videoId === video.videoId)
    );
    
    // 优先选择不同类别的视频
    const categoriesInResult = new Set(result.map(r => r.category));
    const diverseVideos = remaining.filter(v => !categoriesInResult.has(v.category));
    
    for (const video of diverseVideos) {
      if (result.length >= count) break;
      result.push(video);
      categoriesInResult.add(video.category);
    }
    
    // 第三轮：填充剩余位置
    if (result.length < count) {
      const finalRemaining = remaining.filter(video => 
        !result.some(r => r.videoId === video.videoId)
      );
      
      result.push(...finalRemaining.slice(0, count - result.length));
    }
    
    // 最终随机化处理，避免推荐过于可预测
    if (result.length > 3) {
      const topFixed = result.slice(0, 2); // 保持前2个不变
      const shuffleable = result.slice(2);
      
      // 轻微随机化
      for (let i = shuffleable.length - 1; i > 0; i--) {
        if (Math.random() < 0.3) { // 30%概率交换
          const j = Math.floor(Math.random() * (i + 1));
          [shuffleable[i], shuffleable[j]] = [shuffleable[j], shuffleable[i]];
        }
      }
      
      return [...topFixed, ...shuffleable];
    }
    
    return result;
  }

  // 标记不感兴趣
  markAsNotInterested(userId: string, videoId: string): void {
    if (!this.blacklistedVideos.has(userId)) {
      this.blacklistedVideos.set(userId, new Set());
    }
    
    this.blacklistedVideos.get(userId)!.add(videoId);
    
    // 记录负面行为
    const video = this.videoContents.get(videoId);
    if (video) {
      this.recordUserBehavior({
        userId,
        videoId,
        action: 'skip',
        watchTime: 0,
        timestamp: Date.now(),
        videoCategory: video.category,
        videoTags: video.tags
      });
    }
    
    this.saveToStorage();
  }

  // 标记已观看
  markAsViewed(userId: string, videoId: string): void {
    if (!this.viewedVideos.has(userId)) {
      this.viewedVideos.set(userId, new Set());
    }
    
    this.viewedVideos.get(userId)!.add(videoId);
    this.saveToStorage();
  }

  // 获取推荐刷新
  async refreshRecommendations(userId: string, count: number = 10): Promise<RecommendationResult[]> {
    // 清除部分已观看记录，允许重新推荐一些内容
    const viewedVideos = this.viewedVideos.get(userId);
    if (viewedVideos && viewedVideos.size > 100) {
      const videosArray = Array.from(viewedVideos);
      const toKeep = videosArray.slice(-50); // 只保留最近50个
      this.viewedVideos.set(userId, new Set(toKeep));
    }
    
    return this.getPersonalizedRecommendations(userId, count);
  }

  // 添加视频内容
  addVideoContent(video: VideoContent): void {
    this.videoContents.set(video.id, video);
    this.saveToStorage();
  }

  // 发布新视频到推荐系统
  async publishVideo(publishData: PublishData): Promise<string> {
    // 生成唯一视频ID
    const videoId = `user_video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 从发布数据中提取标签
    const extractedTags = [
      ...publishData.hashtags || [],
      publishData.location ? 'location' : null,
      publishData.privacyLevel || 'public'
    ].filter(Boolean);
    
    // 根据描述和标签推断类别
    const category = this.inferCategory(publishData.description, extractedTags);
    
    // 处理视频URL - 如果是blob URL，转换为base64
    let processedVideoUrl = publishData.videoUrl || publishData.videoFile;
    
    if (processedVideoUrl && processedVideoUrl.startsWith('blob:')) {
      try {
        console.log('检测到blob URL，正在转换为base64格式以确保持久化...');
        
        // 获取blob数据
        const response = await fetch(processedVideoUrl);
        const blob = await response.blob();
        
        // 转换为base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        processedVideoUrl = base64;
        console.log('blob URL已成功转换为base64格式，大小:', Math.round(base64.length / 1024), 'KB');
        
      } catch (error) {
        console.error('转换blob URL为base64失败:', error);
        console.log('将保留原始blob URL，但可能在生产环境中失效');
      }
    }
    
    // 创建视频内容对象
    const videoContent: VideoContent = {
      id: videoId,
      title: publishData.title || '用户发布的视频',
      description: publishData.description || '',
      category: category,
      tags: extractedTags,
      creatorId: publishData.userId || 'user_unknown',
      duration: publishData.duration || 60, // 默认60秒
      uploadTime: Date.now(),
      videoUrl: processedVideoUrl, // 使用处理后的视频URL（可能是base64）
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      },
      qualityScore: this.calculateInitialQualityScore(publishData)
    };
    
    // 添加到推荐系统
    this.addVideoContent(videoContent);
    
    console.log('视频已发布到推荐系统:', {
      ...videoContent,
      videoUrl: videoContent.videoUrl?.startsWith('data:') ? '[base64 video data]' : videoContent.videoUrl
    });
    return videoId;
  }

  // 发布照片到推荐系统
  publishPhoto(publishData: PublishData): string {
    // 生成唯一照片ID
    const photoId = `user_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 从发布数据中提取标签
    const extractedTags = [
      ...publishData.hashtags || [],
      publishData.location ? 'location' : null,
      publishData.privacyLevel || 'public',
      'photo' // 添加照片标识
    ].filter(Boolean);
    
    // 根据描述和标签推断类别
    const category = this.inferCategory(publishData.description, extractedTags);
    
    // 创建照片内容对象（复用VideoContent接口，但duration设为0表示照片）
    const photoContent: VideoContent = {
      id: photoId,
      title: publishData.title || '用户发布的照片',
      description: publishData.description || '',
      category: category,
      tags: extractedTags,
      creatorId: publishData.userId || 'user_unknown',
      duration: 0, // 照片duration为0
      uploadTime: Date.now(),
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      },
      qualityScore: this.calculateInitialQualityScore(publishData)
    };
    
    // 添加到推荐系统
    this.addVideoContent(photoContent);
    
    console.log('照片已发布到推荐系统:', photoContent);
    return photoId;
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
    
    return '生活'; // 默认类别
  }
  
  // 计算初始质量分数
  private calculateInitialQualityScore(publishData: PublishData): number {
    let score = 5.0; // 基础分数
    
    // 根据标题长度调整
    if (publishData.title && publishData.title.length > 10) {
      score += 0.5;
    }
    
    // 根据描述长度调整
    if (publishData.description && publishData.description.length > 20) {
      score += 0.5;
    }
    
    // 根据标签数量调整
    if (publishData.hashtags && publishData.hashtags.length > 0) {
      score += Math.min(publishData.hashtags.length * 0.2, 1.0);
    }
    
    // 根据位置信息调整
    if (publishData.location) {
      score += 0.3;
    }
    
    return Math.min(score, 10.0); // 最高10分
  }

  // 获取用户偏好统计
  getUserPreferenceStats(userId: string): UserPreference | null {
    return this.userPreferences.get(userId) || null;
  }

  // 获取用户发布的视频
  getUserVideos(userId: string): VideoContent[] {
    return Array.from(this.videoContents.values())
      .filter(video => video.creatorId === userId)
      .sort((a, b) => b.uploadTime - a.uploadTime); // 按发布时间倒序
  }

  // 获取所有视频内容（用于广场页面）
  getAllVideos(): VideoContent[] {
    return Array.from(this.videoContents.values())
      .sort((a, b) => b.uploadTime - a.uploadTime);
  }

  // 根据视频ID获取视频详情
  getVideoById(videoId: string): VideoContent | null {
    return this.videoContents.get(videoId) || null;
  }

  // 删除视频
  deleteVideo(videoId: string): boolean {
    const deleted = this.videoContents.delete(videoId);
    if (deleted) {
      // 清理相关的用户行为数据
      this.userBehaviors.forEach((behaviors, uid) => {
        const filteredBehaviors = behaviors.filter(b => b.videoId !== videoId);
        this.userBehaviors.set(uid, filteredBehaviors);
      });
      
      // 清理已观看记录
      this.viewedVideos.forEach((videos) => {
        videos.delete(videoId);
      });
      
      // 清理黑名单记录
      this.blacklistedVideos.forEach((videos) => {
        videos.delete(videoId);
      });
      
      this.saveToStorage();
      console.log('视频已从推荐系统中删除:', videoId);
    }
    return deleted;
  }

  // 更新视频信息
  updateVideo(videoId: string, updates: Partial<VideoContent>): boolean {
    const video = this.videoContents.get(videoId);
    if (video) {
      const updatedVideo = { ...video, ...updates };
      this.videoContents.set(videoId, updatedVideo);
      this.saveToStorage();
      console.log('视频信息已更新:', videoId, updates);
      return true;
    }
    return false;
  }

  // 保存到本地存储
  private saveToStorage(): void {
    try {
      const data = {
        userBehaviors: Array.from(this.userBehaviors.entries()),
        userPreferences: Array.from(this.userPreferences.entries()),
        videoContents: Array.from(this.videoContents.entries()),
        blacklistedVideos: Array.from(this.blacklistedVideos.entries()).map(
          ([userId, videos]) => [userId, Array.from(videos)]
        ),
        viewedVideos: Array.from(this.viewedVideos.entries()).map(
          ([userId, videos]) => [userId, Array.from(videos)]
        )
      };
      
      const dataString = JSON.stringify(data);
      const dataSizeKB = Math.round(dataString.length / 1024);
      
      console.log(`尝试保存推荐数据，大小: ${dataSizeKB}KB`);
      
      // 检查数据大小，如果超过4MB，尝试优化存储
      if (dataSizeKB > 4096) {
        console.warn(`数据大小 ${dataSizeKB}KB 可能超过localStorage限制，尝试优化存储...`);
        
        // 创建优化版本：移除大型base64视频数据
        const optimizedVideoContents = Array.from(this.videoContents.entries()).map(
          ([videoId, content]) => {
            if (content.videoUrl && content.videoUrl.startsWith('data:video/')) {
              console.log(`移除视频 ${videoId} 的base64数据以节省空间`);
              // 使用特殊标记表示这个URL被移除了，需要从单独存储中恢复
              return [videoId, { ...content, videoUrl: '__REMOVED_FOR_STORAGE__' }];
            }
            return [videoId, content];
          }
        );
        
        const optimizedData = {
          ...data,
          videoContents: optimizedVideoContents
        };
        
        const optimizedDataString = JSON.stringify(optimizedData);
        const optimizedSizeKB = Math.round(optimizedDataString.length / 1024);
        console.log(`优化后数据大小: ${optimizedSizeKB}KB`);
        
        localStorage.setItem('recommendationData', optimizedDataString);
        
        // 单独存储视频base64数据
        this.saveVideoDataSeparately();
      } else {
        localStorage.setItem('recommendationData', dataString);
      }
      
      console.log('推荐数据保存成功');
    } catch (error) {
      console.error('保存推荐数据失败:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage空间不足，尝试清理旧数据...');
        this.cleanupOldData();
      }
    }
  }

  // 从本地存储加载
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('recommendationData');
      if (data) {
        const parsed = JSON.parse(data);
        
        this.userBehaviors = new Map(parsed.userBehaviors || []);
        this.userPreferences = new Map(parsed.userPreferences || []);
        this.videoContents = new Map(parsed.videoContents || []);
        
        this.blacklistedVideos = new Map(
          (parsed.blacklistedVideos || []).map(
            ([userId, videos]: [string, string[]]) => [userId, new Set(videos)]
          )
        );
        
        this.viewedVideos = new Map(
          (parsed.viewedVideos || []).map(
            ([userId, videos]: [string, string[]]) => [userId, new Set(videos)]
          )
        );
        
        // 尝试加载单独存储的视频数据
        this.loadVideoDataSeparately();
        
        console.log('推荐数据加载成功');
      }
    } catch (error) {
      console.error('加载推荐数据失败:', error);
    }
  }

  // 单独保存视频base64数据
  private saveVideoDataSeparately(): void {
    try {
      const videoData: Record<string, string> = {};
      
      for (const [videoId, content] of this.videoContents.entries()) {
        if (content.videoUrl && content.videoUrl.startsWith('data:video/')) {
          videoData[videoId] = content.videoUrl;
        }
      }
      
      if (Object.keys(videoData).length > 0) {
        localStorage.setItem('videoBase64Data', JSON.stringify(videoData));
        console.log(`单独保存了 ${Object.keys(videoData).length} 个视频的base64数据`);
      }
    } catch (error) {
      console.error('单独保存视频数据失败:', error);
    }
  }
  
  // 单独加载视频base64数据
  private loadVideoDataSeparately(): void {
    try {
      const videoDataString = localStorage.getItem('videoBase64Data');
      if (videoDataString) {
        const videoData = JSON.parse(videoDataString);
        
        for (const [videoId, base64Data] of Object.entries(videoData)) {
          const video = this.videoContents.get(videoId);
          if (video && (!video.videoUrl || video.videoUrl === undefined || video.videoUrl === '__REMOVED_FOR_STORAGE__')) {
            video.videoUrl = base64Data as string;
            console.log(`恢复视频 ${videoId} 的base64数据`);
          }
        }
        
        console.log(`成功加载 ${Object.keys(videoData).length} 个视频的base64数据`);
      }
    } catch (error) {
      console.error('加载视频数据失败:', error);
    }
  }
  
  // 清理旧数据
  private cleanupOldData(): void {
    try {
      // 清理超过30天的行为数据
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      for (const [userId, behaviors] of this.userBehaviors.entries()) {
        const recentBehaviors = behaviors.filter(b => b.timestamp > thirtyDaysAgo);
        this.userBehaviors.set(userId, recentBehaviors);
      }
      
      // 清理超过7天的视频内容（保留最近的）
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const videosToKeep = new Map<string, VideoContent>();
      
      for (const [videoId, content] of this.videoContents.entries()) {
        if (content.uploadTime > sevenDaysAgo) {
          videosToKeep.set(videoId, content);
        }
      }
      
      this.videoContents = videosToKeep;
      
      console.log('旧数据清理完成，尝试重新保存...');
      this.saveToStorage();
    } catch (error) {
      console.error('清理旧数据失败:', error);
    }
  }
  
  // 初始化模拟数据
  private initializeMockData(): void {
    // 不再初始化模拟数据，只使用用户真实发布的内容
    console.log('推荐系统已启动，等待用户发布真实内容');
  }
}

// 导出单例实例
export const recommendationService = new RecommendationService();
export type { UserBehavior, UserPreference, VideoContent, RecommendationResult };