# 光闪视频发布平台 - 自动部署指南

## 概述

本项目已配置完整的自动部署流程，支持通过 GitHub Actions 自动部署到 Vercel 平台。

## 部署方式

### 1. 自动部署（推荐）

#### 前提条件
- GitHub 仓库
- Vercel 账户
- 已配置的环境变量

#### 配置步骤

1. **GitHub Secrets 配置**
   在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下密钥：

   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=team_QGll43H9qexBPyyIteBxxO0K
   VERCEL_PROJECT_ID=prj_SmPKW8ecpVql5gW69ahe7NgOTxS5
   VITE_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_5b4KMEneedO4Zfvi_oHp23jxITcxhLYwGeZaAuizJoL97TI
   VITE_API_BASE_URL=https://traea2ix2mf3.vercel.app/api
   VITE_APP_NAME=光闪视频发布平台
   VITE_APP_VERSION=1.0.0
   ```

2. **获取 Vercel Token**
   - 访问 [Vercel Dashboard](https://vercel.com/account/tokens)
   - 创建新的 Token
   - 复制 Token 值到 GitHub Secrets

3. **触发部署**
   - 推送代码到 `main` 或 `master` 分支
   - GitHub Actions 将自动执行部署流程

#### 部署流程

1. **代码检查**：类型检查和代码规范检查
2. **依赖安装**：安装项目依赖
3. **项目构建**：构建生产版本
4. **自动部署**：部署到 Vercel

### 2. 手动部署

#### Windows 用户
```bash
# 运行部署脚本
.\deploy.bat
```

#### Linux/macOS 用户
```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

#### 手动命令
```bash
# 安装依赖
npm install

# 类型检查
npm run check

# 代码检查
npm run lint

# 构建项目
npm run build

# 部署到 Vercel
vercel --prod
```

## Vercel 环境变量配置

在 Vercel Dashboard 中配置以下环境变量：

| 变量名 | 值 | 说明 |
|--------|----|---------|
| `VITE_BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_...` | Vercel Blob 存储令牌 |
| `VITE_API_BASE_URL` | `https://traea2ix2mf3.vercel.app/api` | API 基础地址 |
| `VITE_APP_NAME` | `光闪视频发布平台` | 应用名称 |
| `VITE_APP_VERSION` | `1.0.0` | 应用版本 |
| `NODE_ENV` | `production` | 环境标识 |

## 部署后验证

### 1. 前端验证
- ✅ 访问 `https://traea2ix2mf3.vercel.app`
- ✅ 检查页面是否正常加载
- ✅ 测试路由导航

### 2. API 验证
- ✅ 访问 `https://traea2ix2mf3.vercel.app/api/health`
- ✅ 测试用户注册/登录接口
- ✅ 测试视频上传接口

### 3. 功能验证
- ✅ 用户注册和登录
- ✅ 视频上传和发布
- ✅ 视频播放和浏览
- ✅ Blob 存储功能

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 TypeScript 类型错误
   - 检查 ESLint 规则
   - 确认所有依赖已正确安装

2. **部署失败**
   - 检查 Vercel Token 是否有效
   - 确认项目 ID 和组织 ID 正确
   - 检查环境变量配置

3. **运行时错误**
   - 检查 Vercel 函数日志
   - 确认环境变量在生产环境中正确设置
   - 检查 API 路由配置

### 调试命令

```bash
# 查看 Vercel 项目信息
vercel ls

# 查看部署日志
vercel logs

# 本地预览生产构建
npm run preview
```

## 性能优化

- ✅ 启用 Gzip 压缩
- ✅ 静态资源缓存
- ✅ 代码分割和懒加载
- ✅ 图片优化
- ✅ API 响应缓存

## 安全配置

- ✅ HTTPS 强制重定向
- ✅ 环境变量加密存储
- ✅ API 速率限制
- ✅ CORS 配置

---

**注意**：首次部署后，请更新 `VITE_API_BASE_URL` 为实际的 Vercel 域名。