/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './app';
import { initializeDatabase, testConnection } from './models/index';

// 数据库初始化状态
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// 确保数据库只初始化一次
async function ensureDatabaseInitialized(): Promise<void> {
  if (isInitialized) {
    console.log('✅ 数据库已初始化，跳过初始化步骤');
    return;
  }
  
  if (initPromise) {
    console.log('⏳ 数据库正在初始化中，等待完成...');
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      console.log('🔧 生产环境：开始初始化数据库...');
      console.log('📊 环境信息:', {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        isProduction: process.env.NODE_ENV === 'production' || process.env.VERCEL
      });
      
      // 测试数据库连接
      console.log('🔗 测试数据库连接...');
      await testConnection();
      console.log('✅ 数据库连接测试成功');
      
      // 初始化数据库
      console.log('🏗️ 初始化数据库结构...');
      await initializeDatabase();
      console.log('✅ 数据库结构初始化成功');
      
      isInitialized = true;
      console.log('🎉 生产环境：数据库初始化完全成功');
    } catch (error) {
      console.error('❌ 生产环境：数据库初始化失败:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error),
        timestamp: new Date().toISOString()
      });
      
      // 重置状态以允许重试
      initPromise = null;
      isInitialized = false;
      
      // 抛出更详细的错误信息
      throw new Error(`数据库初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  })();
  
  return initPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 确保所有响应都是JSON格式
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log(`🔧 生产环境：处理请求 ${req.method} ${req.url}`);
    
    // 确保数据库已初始化
    await ensureDatabaseInitialized();
    
    // 将请求传递给Express应用
    return app(req, res);
  } catch (error) {
    console.error('🚨 生产环境：请求处理失败:', {
      method: req.method,
      url: req.url,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error)
    });
    
    // 确保错误响应也是JSON格式
    res.setHeader('Content-Type', 'application/json');
    
    // 根据错误类型返回不同的状态码和消息
    if (error instanceof Error && error.message.includes('数据库')) {
      return res.status(503).json({
        success: false,
        error: '数据库服务暂时不可用',
        code: 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    return res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
}