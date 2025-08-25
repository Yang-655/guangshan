/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import userRoutes from './routes/users';
import { initializeDatabase, testConnection } from './models/index';

// load env
dotenv.config();

const app: express.Application = express();

// 数据库初始化已移至server.ts中处理

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);

/**
 * health
 */
app.get('/api/health', (req: Request, res: Response): void => {
  try {
    console.log('🏥 健康检查请求:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    // 确保返回JSON格式
    res.setHeader('Content-Type', 'application/json');
    
    const healthData = {
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        isProduction: process.env.NODE_ENV === 'production' || process.env.VERCEL
      },
      database: {
        initialized: true, // 如果能到达这里说明数据库已初始化
        type: 'sqlite',
        storage: process.env.NODE_ENV === 'production' || process.env.VERCEL ? ':memory:' : 'file'
      }
    };
    
    console.log('✅ 健康检查响应:', healthData);
    res.status(200).json(healthData);
  } catch (error) {
    console.error('❌ 健康检查失败:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error),
      request: {
        method: req.method,
        url: req.url
      }
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      success: false,
      error: '健康检查失败',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API错误:', error);
  
  // 确保错误响应是JSON格式
  res.setHeader('Content-Type', 'application/json');
  
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  // 确保404响应是JSON格式
  res.setHeader('Content-Type', 'application/json');
  
  res.status(404).json({
    success: false,
    error: 'API not found',
    path: req.path,
    method: req.method
  });
});

export default app;