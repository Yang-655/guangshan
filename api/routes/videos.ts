/**
 * 视频相关API路由
 */
import { Router, type Request, type Response } from 'express';
import { Op } from 'sequelize';
import { User, Video, UserBehavior, sequelize } from '../models/index';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 获取所有视频（分页）
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const userId = req.query.userId as string;
    const offset = (page - 1) * limit;
    
    const whereClause: any = {
      is_published: true
    };
    
    if (category) {
      whereClause.category = category;
    }
    
    if (userId) {
      whereClause.user_id = userId;
    }
    
    const { rows: videos, count } = await Video.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar', 'is_verified']
      }],
      order: [['published_at', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取视频列表失败'
    });
  }
});

// 根据ID获取单个视频
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const video = await Video.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar', 'is_verified', 'follower_count']
      }]
    });
    
    if (!video) {
      res.status(404).json({
        success: false,
        error: '视频不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('获取视频详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取视频详情失败'
    });
  }
});

// 发布新视频
router.post('/', upload.single('video'), async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`🚀 [${requestId}] 开始处理视频发布请求`);
    console.log(`📋 [${requestId}] 请求体大小:`, JSON.stringify(req.body).length, 'bytes');
    console.log(`🌍 [${requestId}] 环境:`, process.env.NODE_ENV || 'development');
    console.log(`💾 [${requestId}] 数据库类型:`, process.env.VERCEL ? '内存数据库' : 'SQLite文件');
    
    const {
      user_id,
      title,
      description,
      category,
      tags,
      duration,
      video_url,
      thumbnail_url,
      is_private = false
    } = req.body;
    
    // 验证必填字段
    if (!user_id || !title || !category || !duration) {
      console.error(`❌ [${requestId}] 缺少必填字段:`, {
        user_id: !!user_id,
        title: !!title,
        category: !!category,
        duration: !!duration
      });
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
        requestId
      });
      return;
    }
    
    // 验证用户是否存在
    console.log(`👤 [${requestId}] 验证用户:`, user_id);
    const user = await User.findByPk(user_id);
    if (!user) {
      console.error(`❌ [${requestId}] 用户不存在:`, user_id);
      res.status(404).json({
        success: false,
        error: '用户不存在',
        requestId
      });
      return;
    }
    console.log(`✅ [${requestId}] 用户验证成功:`, user.username);
    
    // 处理标签
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = Array.isArray(tags) ? tags : [tags];
      }
    }
    
    // 调试日志：检查缩略图数据
    console.log('🔍 后端API接收到的缩略图数据:', {
      hasThumbnailUrl: !!thumbnail_url,
      thumbnailType: typeof thumbnail_url,
      isDataUrl: thumbnail_url ? thumbnail_url.startsWith('data:') : false,
      size: thumbnail_url ? Math.round(thumbnail_url.length / 1024) + ' KB' : 'N/A'
    });
    
    // 创建视频记录
    console.log(`💾 [${requestId}] 准备创建视频记录`);
    const videoCreateData = {
      user_id,
      title,
      description,
      category,
      tags: parsedTags,
      duration: parseInt(duration),
      video_url,
      thumbnail_url: thumbnail_url || null,
      is_private: Boolean(is_private),
      is_published: true,
      published_at: new Date(),
      quality_score: 5.0
    };
    
    console.log(`📊 [${requestId}] 视频数据统计:`, {
      titleLength: title.length,
      descriptionLength: description?.length || 0,
      tagsCount: parsedTags.length,
      hasVideoUrl: !!video_url,
      hasThumbnail: !!thumbnail_url,
      thumbnailSize: thumbnail_url ? Math.round(thumbnail_url.length / 1024) + ' KB' : 'N/A',
      isPrivate: Boolean(is_private)
    });
    
    const video = await Video.create(videoCreateData);
    
    console.log(`✅ [${requestId}] 视频记录创建成功:`, {
      videoId: video.id,
      savedThumbnailUrl: !!video.thumbnail_url,
      thumbnailSize: video.thumbnail_url ? Math.round(video.thumbnail_url.length / 1024) + ' KB' : 'N/A'
    });
    
    // 更新用户视频计数
    await user.increment('video_count');
    
    // 获取完整的视频信息（包含用户信息）
    try {
      console.log(`🔍 [${requestId}] 获取完整视频信息`);
      const fullVideo = await Video.findByPk(video.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar', 'is_verified']
        }]
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ [${requestId}] 视频发布完成，耗时: ${processingTime}ms`);
      
      const responseData = fullVideo || video;
      res.status(201).json({
        success: true,
        data: responseData,
        requestId,
        processingTime
      });
    } catch (includeError) {
      console.error(`⚠️ [${requestId}] 关联查询失败，返回基本视频信息:`, includeError);
      const processingTime = Date.now() - startTime;
      res.status(201).json({
        success: true,
        data: video,
        requestId,
        processingTime
      });
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [${requestId}] 发布视频失败，耗时: ${processingTime}ms`, error);
    console.error(`🔍 [${requestId}] 错误详情:`, {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    res.status(500).json({
      success: false,
      error: '发布视频失败',
      requestId,
      processingTime
    });
  }
});

// 更新视频信息
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      tags,
      is_private
    } = req.body;
    
    const video = await Video.findByPk(id);
    if (!video) {
      res.status(404).json({
        success: false,
        error: '视频不存在'
      });
      return;
    }
    
    // 处理标签
    let parsedTags = video.tags;
    if (tags !== undefined) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = Array.isArray(tags) ? tags : [tags];
      }
    }
    
    // 更新视频信息
    await video.update({
      title: title || video.title,
      description: description !== undefined ? description : video.description,
      category: category || video.category,
      tags: parsedTags,
      is_private: is_private !== undefined ? Boolean(is_private) : video.is_private
    });
    
    // 获取更新后的完整信息
    const updatedVideo = await Video.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar', 'is_verified']
      }]
    });
    
    res.json({
      success: true,
      data: updatedVideo
    });
  } catch (error) {
    console.error('更新视频失败:', error);
    res.status(500).json({
      success: false,
      error: '更新视频失败'
    });
  }
});

// 重置所有视频数据（危险操作）
router.delete('/reset/all', async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { user_id, confirm_token } = req.body;
    
    console.log('🚨 重置视频数据请求:', { user_id, confirm_token });
    
    // 验证必填字段
    if (!user_id || !confirm_token) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        error: '缺少必填字段：user_id 和 confirm_token'
      });
      return;
    }
    
    // 验证确认令牌（简单的安全机制）
    if (confirm_token !== 'RESET_ALL_VIDEOS_CONFIRM') {
      await transaction.rollback();
      res.status(403).json({
        success: false,
        error: '无效的确认令牌'
      });
      return;
    }
    
    // 验证用户是否存在
    const user = await User.findByPk(user_id, { transaction });
    if (!user) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        error: '用户不存在'
      });
      return;
    }
    
    // 获取用户的所有视频
    const userVideos = await Video.findAll({
      where: { user_id },
      transaction
    });
    
    const deletedCount = userVideos.length;
    console.log(`📊 找到 ${deletedCount} 个视频需要删除`);
    
    if (deletedCount > 0) {
      const videoIds = userVideos.map(v => v.id);
      console.log('🎯 视频IDs:', videoIds);
      
      // 临时禁用外键约束
      await sequelize.query('PRAGMA foreign_keys = OFF;', { transaction });
      console.log('🔓 已禁用外键约束');
      
      // 使用原生SQL删除用户行为记录
      const [behaviorResults] = await sequelize.query(
        `DELETE FROM user_behaviors WHERE user_id = ?`,
        {
          replacements: [user_id],
          transaction
        }
      );
      console.log(`🗑️ 删除了用户行为记录`);
      
      // 使用原生SQL删除视频记录
      const [videoResults] = await sequelize.query(
        `DELETE FROM videos WHERE user_id = ?`,
        {
          replacements: [user_id],
          transaction
        }
      );
      console.log(`🎬 删除了视频记录`);
      
      // 重新启用外键约束
      await sequelize.query('PRAGMA foreign_keys = ON;', { transaction });
      console.log('🔒 已重新启用外键约束');
    }
    
    // 第三步：重置用户视频计数
    await user.update({ video_count: 0 }, { transaction });
    console.log('📊 重置用户视频计数为0');
    
    // 提交事务
    await transaction.commit();
    console.log(`✅ 用户 ${user_id} 重置了所有视频数据，删除了 ${deletedCount} 个视频`);
    
    res.json({
      success: true,
      message: `成功重置所有视频数据，删除了 ${deletedCount} 个视频`,
      data: {
        deletedCount,
        userId: user_id
      }
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    console.error('❌ 重置视频数据失败:', error);
    res.status(500).json({
      success: false,
      error: '重置视频数据失败'
    });
  }
});

// 删除视频
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;
    
    const video = await Video.findByPk(id);
    if (!video) {
      res.status(404).json({
        success: false,
        error: '视频不存在'
      });
      return;
    }
    
    // 验证权限（只有视频作者可以删除）
    if (user_id && video.user_id !== user_id) {
      res.status(403).json({
        success: false,
        error: '无权限删除此视频'
      });
      return;
    }
    
    // 删除视频
    await video.destroy();
    
    // 更新用户视频计数
    const user = await User.findByPk(video.user_id);
    if (user && user.video_count > 0) {
      await user.decrement('video_count');
    }
    
    res.json({
      success: true,
      message: '视频删除成功'
    });
  } catch (error) {
    console.error('删除视频失败:', error);
    res.status(500).json({
      success: false,
      error: '删除视频失败'
    });
  }
});

// 记录用户行为
router.post('/:id/behavior', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: video_id } = req.params;
    const {
      user_id,
      action,
      watch_time,
      watch_percentage,
      device_type
    } = req.body;
    
    // 验证必填字段
    if (!user_id || !action) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段'
      });
      return;
    }
    
    // 验证视频和用户是否存在
    const [video, user] = await Promise.all([
      Video.findByPk(video_id),
      User.findByPk(user_id)
    ]);
    
    if (!video) {
      res.status(404).json({
        success: false,
        error: '视频不存在'
      });
      return;
    }
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      });
      return;
    }
    
    // 记录用户行为
    const behavior = await UserBehavior.create({
      user_id,
      video_id,
      action,
      watch_time: watch_time ? parseInt(watch_time) : undefined,
      watch_percentage: watch_percentage ? parseFloat(watch_percentage) : undefined,
      device_type,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    // 根据行为类型更新统计数据
    switch (action) {
      case 'view':
        await video.increment('view_count');
        break;
      case 'like':
        await video.increment('like_count');
        await user.increment('like_count');
        break;
      case 'share':
        await video.increment('share_count');
        break;
    }
    
    res.status(201).json({
      success: true,
      data: behavior
    });
  } catch (error) {
    console.error('记录用户行为失败:', error);
    res.status(500).json({
      success: false,
      error: '记录用户行为失败'
    });
  }
});

// 重复的路由已删除，使用上面的实现

// 获取推荐视频
router.get('/recommendations/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // 获取用户最近的行为数据
    const recentBehaviors = await UserBehavior.findAll({
      where: {
        user_id: userId,
        action: { [Op.in]: ['view', 'like'] }
      },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    
    // 提取用户感兴趣的类别
    const categoryPreferences: { [key: string]: number } = {};
    for (const behavior of recentBehaviors) {
      const video = await Video.findByPk(behavior.video_id);
      if (video) {
        categoryPreferences[video.category] = (categoryPreferences[video.category] || 0) + 1;
      }
    }
    
    // 获取已观看的视频ID
    const viewedVideoIds = recentBehaviors
      .filter(b => b.action === 'view')
      .map(b => b.video_id);
    
    // 构建推荐查询
    const whereClause: any = {
      is_published: true,
      id: { [Op.notIn]: viewedVideoIds }
    };
    
    // 如果有类别偏好，优先推荐相关类别
    const preferredCategories = Object.keys(categoryPreferences)
      .sort((a, b) => categoryPreferences[b] - categoryPreferences[a])
      .slice(0, 3);
    
    if (preferredCategories.length > 0) {
      whereClause.category = { [Op.in]: preferredCategories };
    }
    
    const recommendedVideos = await Video.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar', 'is_verified']
      }],
      order: [['view_count', 'DESC'], ['created_at', 'DESC']],
      limit
    });
    
    res.json({
      success: true,
      data: recommendedVideos
    });
  } catch (error) {
    console.error('获取推荐视频失败:', error);
    res.status(500).json({
      success: false,
      error: '获取推荐视频失败'
    });
  }
});

export default router;