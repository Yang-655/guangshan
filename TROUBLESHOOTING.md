# 光闪视频发布平台 - 故障排除指南

## 部署后页面空白问题解决方案

### 🔍 问题诊断

如果部署后页面显示空白，请按以下步骤排查：

#### 1. 检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签页：

- ✅ 应该看到 "App component mounted" 日志
- ✅ 应该看到环境变量信息
- ❌ 如果有红色错误信息，请记录下来

#### 2. 检查网络请求

在开发者工具的 Network 标签页中：

- ✅ 确认 HTML、CSS、JS 文件都成功加载（状态码 200）
- ❌ 如果有 404 或 500 错误，说明资源加载失败

#### 3. 检查环境变量

在控制台中运行以下命令检查环境变量：

```javascript
console.log({
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  APP_NAME: import.meta.env.VITE_APP_NAME,
  NODE_ENV: import.meta.env.NODE_ENV
});
```

### 🛠️ 已修复的问题

#### 1. 环境变量配置

- ✅ 更新 `VITE_API_BASE_URL` 从 `http://localhost:3001/api` 改为 `/api`
- ✅ 创建 `.env.production` 文件用于生产环境
- ✅ 确保 Vercel 环境变量正确映射

#### 2. 构建配置优化

- ✅ 添加 `base: '/'` 确保正确的基础路径
- ✅ 启用 sourcemap 便于调试
- ✅ 配置代码分割减少包大小

#### 3. 错误处理增强

- ✅ 添加全局错误监听器
- ✅ 在 App 组件中添加调试日志
- ✅ 更新页面标题为正确的应用名称

### 🚀 重新部署步骤

1. **确认本地构建成功**：
   ```bash
   npm run build
   ```

2. **部署到 Vercel**：
   ```bash
   vercel --prod
   ```

3. **验证部署**：
   - 访问部署的 URL
   - 检查控制台日志
   - 测试基本功能

### 📋 Vercel 环境变量检查清单

确保在 Vercel Dashboard 中设置了以下环境变量：

- `VITE_BLOB_READ_WRITE_TOKEN`
- `VITE_API_BASE_URL` = `/api`
- `VITE_APP_NAME` = `光闪视频发布平台`
- `VITE_APP_VERSION` = `1.0.0`
- `NODE_ENV` = `production`

### 🔧 常见问题解决

#### 问题：页面完全空白
**解决方案**：
1. 检查 JavaScript 是否正确加载
2. 确认没有语法错误
3. 验证环境变量配置

#### 问题：API 请求失败
**解决方案**：
1. 确认 API 路由配置正确
2. 检查 `vercel.json` 中的路由设置
3. 验证后端函数是否正常部署

#### 问题：静态资源 404
**解决方案**：
1. 确认 `dist` 目录结构正确
2. 检查 Vite 配置中的 `base` 路径
3. 验证 Vercel 构建配置

### 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. 浏览器控制台的完整错误信息
2. Vercel 部署日志
3. 网络请求的状态码和响应
4. 当前的环境变量配置

---

**注意**：修复后需要重新部署才能生效。建议先在本地测试构建是否成功。