/**
 * 模型索引文件
 * 统一导出所有模型并初始化关联关系
 */
import { sequelize } from '../config/database';
import { User } from './User';
import { Video } from './Video';
import { UserBehavior } from './UserBehavior';

// 导出所有模型
export {
  User,
  Video,
  UserBehavior,
  sequelize
};

// 导出数据库配置函数
export { testConnection, syncDatabase } from '../config/database';

// 初始化所有关联关系
export const initializeAssociations = (): void => {
  try {
    // 只有在关联关系不存在时才创建
    if (!User.associations.videos) {
      User.hasMany(Video, {
        foreignKey: 'user_id',
        as: 'videos',
        onDelete: 'CASCADE'
      });
    }
    
    if (!Video.associations.user) {
      Video.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
    
    if (!User.associations.user_behaviors) {
      User.hasMany(UserBehavior, {
        foreignKey: 'user_id',
        as: 'user_behaviors',
        onDelete: 'CASCADE'
      });
    }
    
    if (!UserBehavior.associations.user) {
      UserBehavior.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
    
    if (!Video.associations.video_behaviors) {
      Video.hasMany(UserBehavior, {
        foreignKey: 'video_id',
        as: 'video_behaviors',
        onDelete: 'CASCADE'
      });
    }
    
    if (!UserBehavior.associations.video) {
      UserBehavior.belongsTo(Video, {
        foreignKey: 'video_id',
        as: 'video'
      });
    }
    
    console.log('数据库关联关系初始化完成');
  } catch (error) {
    console.error('关联关系初始化失败:', error);
  }
};

// 创建默认用户
export const createDefaultUser = async (): Promise<User> => {
  try {
    // 检查是否已存在默认用户
    let defaultUser = await User.findOne({
      where: { username: 'demouser001' }
    });
    
    if (!defaultUser) {
      defaultUser = await User.create({
        id: 'user_demo_001',
        username: 'demouser001',
        nickname: '演示用户',
        bio: '这是一个演示用户账号',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20profile%20picture&image_size=square'
      });
      
      console.log('默认用户创建成功:', defaultUser.id);
    } else {
      console.log('默认用户已存在:', defaultUser.id);
    }
    
    return defaultUser;
  } catch (error) {
    console.error('创建默认用户失败:', error);
    throw error;
  }
};

// 数据库初始化函数
export const initializeDatabase = async (force: boolean = false): Promise<void> => {
  try {
    console.log('开始初始化数据库...');
    
    // 初始化关联关系
    initializeAssociations();
    
    // 同步数据库
    await sequelize.sync({ force });
    console.log('数据库同步完成');
    
    // 创建默认用户
    await createDefaultUser();
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};