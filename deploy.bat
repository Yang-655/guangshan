@echo off
chcp 65001 >nul

echo 🚀 开始部署光闪视频发布平台...

REM 检查是否安装了 Vercel CLI
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI 未安装，正在安装...
    npm install -g vercel
)

REM 安装依赖
echo 📦 安装项目依赖...
npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

REM 类型检查
echo 🔍 执行类型检查...
npm run check
if %errorlevel% neq 0 (
    echo ❌ 类型检查失败
    pause
    exit /b 1
)

REM 代码检查
echo 🧹 执行代码检查...
npm run lint
if %errorlevel% neq 0 (
    echo ⚠️ 代码检查有警告，继续部署...
)

REM 构建项目
echo 🔨 构建项目...
npm run build
if %errorlevel% neq 0 (
    echo ❌ 项目构建失败
    pause
    exit /b 1
)

REM 部署到 Vercel
echo 🌐 部署到 Vercel...
vercel --prod
if %errorlevel% neq 0 (
    echo ❌ 部署失败
    pause
    exit /b 1
)

echo ✅ 部署完成！
echo 📱 前端地址: https://your-domain.vercel.app
echo 🔗 API 地址: https://your-domain.vercel.app/api

echo.
echo 📋 部署后检查清单:
echo 1. ✓ 检查前端页面是否正常加载
echo 2. ✓ 测试 API 接口是否正常响应
echo 3. ✓ 验证视频上传功能
echo 4. ✓ 确认 Blob 存储是否正常工作
echo 5. ✓ 测试用户注册和登录功能

pause