/**
 * 视频模型
 */
import { DataTypes, Model, type Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

// 视频属性接口
export interface VideoAttributes {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  duration: number;
  video_url?: string;
  thumbnail_url?: string;
  file_path?: string;
  file_size?: number;
  resolution?: string;
  format?: string;
  quality_score: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_private: boolean;
  is_published: boolean;
  published_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// 创建视频时的可选属性
export interface VideoCreationAttributes extends Optional<VideoAttributes, 
  'id' | 'description' | 'video_url' | 'thumbnail_url' | 'file_path' | 'file_size' | 
  'resolution' | 'format' | 'quality_score' | 'view_count' | 'like_count' | 
  'comment_count' | 'share_count' | 'is_private' | 'is_published' | 'published_at' | 
  'created_at' | 'updated_at'
> {}

// 视频模型类
export class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  public id!: string;
  public user_id!: string;
  public title!: string;
  public description?: string;
  public category!: string;
  public tags!: string[];
  public duration!: number;
  public video_url?: string;
  public thumbnail_url?: string;
  public file_path?: string;
  public file_size?: number;
  public resolution?: string;
  public format?: string;
  public quality_score!: number;
  public view_count!: number;
  public like_count!: number;
  public comment_count!: number;
  public share_count!: number;
  public is_private!: boolean;
  public is_published!: boolean;
  public published_at?: Date;
  
  // 时间戳
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  
  // 关联关系
  public readonly user?: User;
}

// 定义视频模型
Video.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isArrayValidator(value: any) {
        if (!Array.isArray(value)) {
          throw new Error('Tags must be an array');
        }
      }
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  video_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  resolution: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^\d+x\d+$/
    }
  },
  format: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['mp4', 'webm', 'avi', 'mov', 'mkv']]
    }
  },
  quality_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 5.0,
    validate: {
      min: 0,
      max: 10
    }
  },
  view_count: {
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
  comment_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  share_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Video',
  tableName: 'videos',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_published']
    },
    {
      fields: ['published_at']
    },
    {
      fields: ['view_count']
    }
  ]
});

// 关联关系将在 models/index.ts 中统一定义