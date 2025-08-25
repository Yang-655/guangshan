/**
 * 用户行为模型
 */
import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Video } from './Video';

// 用户行为属性接口
export interface UserBehaviorAttributes {
  id: string;
  user_id: string;
  video_id: string;
  action: 'view' | 'like' | 'comment' | 'share' | 'skip' | 'follow' | 'unfollow';
  watch_time?: number;
  watch_percentage?: number;
  device_type?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  created_at?: Date;
  updated_at?: Date;
}

// 创建用户行为时的可选属性
export type UserBehaviorCreationAttributes = Optional<UserBehaviorAttributes, 
  'id' | 'watch_time' | 'watch_percentage' | 'device_type' | 'ip_address' | 
  'user_agent' | 'referrer' | 'created_at' | 'updated_at'
>;

// 用户行为模型类
export class UserBehavior extends Model<UserBehaviorAttributes, UserBehaviorCreationAttributes> implements UserBehaviorAttributes {
  public id!: string;
  public user_id!: string;
  public video_id!: string;
  public action!: 'view' | 'like' | 'comment' | 'share' | 'skip' | 'follow' | 'unfollow';
  public watch_time?: number;
  public watch_percentage?: number;
  public device_type?: string;
  public ip_address?: string;
  public user_agent?: string;
  public referrer?: string;
  
  // 时间戳
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  
  // 关联关系
  public readonly user?: User;
  public readonly video?: Video;
}

// 定义用户行为模型
UserBehavior.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  video_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Video,
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM('view', 'like', 'comment', 'share', 'skip', 'follow', 'unfollow'),
    allowNull: false
  },
  watch_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  watch_percentage: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  device_type: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['desktop', 'mobile', 'tablet', 'tv', 'unknown']]
    }
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIP: true
    }
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referrer: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'UserBehavior',
  tableName: 'user_behaviors',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['video_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['user_id', 'video_id']
    }
  ]
});

// 关联关系将在 models/index.ts 中统一定义