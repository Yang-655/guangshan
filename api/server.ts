/**
 * local server entry file, for local development
 */
import app from './app';
import { initializeDatabase, testConnection } from './models/index';
import { Server } from 'http';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3000;
let server: Server;

// 确保数据库初始化完成后再启动服务器
async function startServer() {
  try {
    console.log('正在初始化数据库...');
    await testConnection();
    await initializeDatabase();
    console.log('数据库初始化成功');
    
    server = app.listen(PORT, () => {
      console.log(`🚀 服务器已启动，监听端口 ${PORT}`);
      console.log(`📡 API地址: http://localhost:${PORT}/api`);
      console.log(`💚 健康检查: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭处理
const gracefulShutdown = () => {
  console.log('正在关闭服务器...');
  if (server) {
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();

export default app;