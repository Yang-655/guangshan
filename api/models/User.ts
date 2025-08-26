/**
 * 用户模型
 */
import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 用户属性接口
export interface UserAttributes {
  id: string;
  username: string;
  email?: string;
  nickname: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthday?: Date;
  follower_count: number;
  following_count: number;
  video_count: number;
  like_count: number;
  is_verified: boolean;
  is_active: boolean;
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// 创建用户时的可选属性
export type UserCreationAttributes = Optional<UserAttributes, 
  'id' | 'email' | 'avatar' | 'bio' | 'location' | 'website' | 'birthday' | 
  'follower_count' | 'following_count' | 'video_count' | 'like_count' | 
  'is_verified' | 'is_active' | 'last_login' | 'created_at' | 'updated_at'
>;

// 用户模型类
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username!: string;
  public email?: string;
  public nickname!: string;
  public avatar?: string;
  public bio?: string;
  public location?: string;
  public website?: string;
  public birthday?: Date;
  public follower_count!: number;
  public following_count!: number;
  public video_count!: number;
  public like_count!: number;
  public is_verified!: boolean;
  public is_active!: boolean;
  public last_login?: Date;
  
  // 时间戳
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// 定义用户模型
User.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  birthday: {
    type: DataTypes.DATE,
    allowNull: true
  },
  follower_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  following_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  video_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  like_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    }
  ]
});