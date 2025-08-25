/**
 * 用户相关API路由
 */
import { Router, type Request, type Response } from 'express';
import { Op } from 'sequelize';
import { User, Video, UserBehavior } from '../models/index';

const router = Router();

// 获取所有用户（分页）
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;
    
    const whereClause: any = {
      is_active: true
    };
    
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { nickname: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { rows: users, count } = await User.findAndCountAll({
      where: whereClause,
      attributes: {
        exclude: ['email'] // 不返回敏感信息
      },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户列表失败'
    });
  }
});

// 根据ID获取单个用户
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const includePrivate = req.query.includePrivate === 'true';
    
    const user = await User.findByPk(id, {
      attributes: {
        exclude: includePrivate ? [] : ['email'] // 根据权限决定是否返回敏感信息
      },
      include: [{
        model: Video,
        as: 'videos',
        where: includePrivate ? {} : { is_private: false },
        required: false,
        order: [['published_at', 'DESC']],
        limit: 10
      }]
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户详情失败'
    });
  }
});

// 创建新用户
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      email,
      nickname,
      avatar,
      bio,
      location,
      website,
      birthday
    } = req.body;
    
    // 验证必填字段
    if (!username || !nickname) {
      res.status(400).json({
        success: false,
        error: '用户名和昵称为必填字段'
      });
      return;
    }
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          ...(email ? [{ email }] : [])
        ]
      }
    });
    
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: '用户名或邮箱已存在'
      });
      return;
    }
    
    // 创建用户
    const user = await User.create({
      username,
      email,
      nickname,
      avatar,
      bio,
      location,
      website,
      birthday: birthday ? new Date(birthday) : undefined
    });
    
    // 返回用户信息（不包含敏感信息）
    const userResponse = await User.findByPk(user.id, {
      attributes: {
        exclude: ['email']
      }
    });
    
    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      success: false,
      error: '创建用户失败'
    });
  }
});

// 更新用户信息
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      nickname,
      avatar,
      bio,
      location,
      website,
      birthday
    } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      });
      return;
    }
    
    // 更新用户信息
    await user.update({
      nickname: nickname || user.nickname,
      avatar: avatar !== undefined ? avatar : user.avatar,
      bio: bio !== undefined ? bio : user.bio,
      location: location !== undefined ? location : user.location,
      website: website !== undefined ? website : user.website,
      birthday: birthday ? new Date(birthday) : user.birthday,
      last_login: new Date()
    });
    
    // 返回更新后的用户信息
    const updatedUser = await User.findByPk(id, {
      attributes: {
        exclude: ['email']
      }
    });
    
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      success: false,
      error: '更新用户失败'
    });
  }
});

// 删除用户（软删除）
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      });
      return;
    }
    
    // 软删除：设置为非活跃状态
    await user.update({
      is_active: false
    });
    
    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      error: '删除用户失败'
    });
  }
});

// 获取用户的视频列表
router.get('/:id/videos', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const includePrivate = req.query.includePrivate === 'true';
    const offset = (page - 1) * limit;
    
    // 验证用户是否存在
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      });
      return;
    }
    
    const whereClause: any = {
      user_id: id,
      is_published: true
    };
    
    if (!includePrivate) {
      whereClause.is_private = false;
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
    console.error('获取用户视频失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户视频失败'
    });
  }
});

// 获取用户行为统计
router.get('/:id/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    
    // 验证用户是否存在
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在'
      });
      return;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // 获取用户行为统计
    const behaviors = await UserBehavior.findAll({
      where: {
        user_id: id,
        created_at: {
          [Op.gte]: startDate
        }
      },
      attributes: ['action'],
      raw: true
    });
    
    // 统计各种行为的数量
    const stats = behaviors.reduce((acc: any, behavior: any) => {
      acc[behavior.action] = (acc[behavior.action] || 0) + 1;
      return acc;
    }, {});
    
    // 获取用户偏好的类别
    const categoryBehaviors = await UserBehavior.findAll({
      where: {
        user_id: id,
        action: { [Op.in]: ['view', 'like'] },
        created_at: {
          [Op.gte]: startDate
        }
      },
      include: [{
        model: Video,
        as: 'video',
        attributes: ['category']
      }]
    });
    
    const categoryPreferences: { [key: string]: number } = {};
    categoryBehaviors.forEach((behavior: any) => {
      if (behavior.video?.category) {
        categoryPreferences[behavior.video.category] = 
          (categoryPreferences[behavior.video.category] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          video_count: user.video_count,
          follower_count: user.follower_count,
          following_count: user.following_count,
          like_count: user.like_count
        },
        behavior_stats: stats,
        category_preferences: categoryPreferences,
        period_days: days
      }
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户统计失败'
    });
  }
});

export default router;