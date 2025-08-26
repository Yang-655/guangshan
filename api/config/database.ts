/**
 * 数据库配置
 */
import { Sequelize } from 'sequelize';
import path from 'path';

// 在 Vercel 环境中使用简化的路径处理
const __dirname = process.cwd();

// 数据库文件路径 - 生产环境使用内存数据库
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const dbPath = isProduction ? ':memory:' : path.join(__dirname, '../../database.sqlite');

// 创建Sequelize实例
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  dialectOptions: {
    // 启用SQLite外键约束
    foreignKeys: true
  },
  // 在连接时启用外键约束
  hooks: {
    afterConnect: async (connection: { query: (sql: string) => Promise<unknown> }) => {
      await connection.query('PRAGMA foreign_keys = ON;');
      console.log('SQLite外键约束已启用');
    }
  }
});

// 测试数据库连接
export const testConnection = async (): Promise<void> => {
  try {
    console.log('🔍 开始测试数据库连接...');
    console.log('📍 数据库配置:', {
      dialect: 'sqlite',
      storage: dbPath,
      isProduction,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    });
    
    await sequelize.authenticate();
    console.log('✅ 数据库连接测试成功');
    
    // 在生产环境中验证内存数据库
    if (isProduction) {
      console.log('🧪 验证内存数据库功能...');
      const result = await sequelize.query('SELECT 1 as test');
      console.log('✅ 内存数据库查询测试成功:', result);
    }
  } catch (error) {
    console.error('❌ 数据库连接失败:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error),
      config: {
        dialect: 'sqlite',
        storage: dbPath,
        isProduction
      }
    });
    throw new Error(`数据库连接失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 同步数据库模型
export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    console.log('🔄 开始同步数据库模型...', { force });
    
    await sequelize.sync({ force });
    
    console.log('✅ 数据库模型同步完成');
    
    // 验证表是否创建成功
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 已创建的数据表:', tables);
    
  } catch (error) {
    console.error('❌ 数据库同步失败:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error),
      force
    });
    throw new Error(`数据库同步失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};