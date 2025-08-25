#!/bin/bash

# 光闪视频发布平台自动部署脚本

echo "🚀 开始部署光闪视频发布平台..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，正在安装..."
    npm install -g vercel
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 类型检查
echo "🔍 执行类型检查..."
npm run check

# 代码检查
echo "🧹 执行代码检查..."
npm run lint

# 构建项目
echo "🔨 构建项目..."
npm run build

# 部署到 Vercel
echo "🌐 部署到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo "📱 前端地址: https://your-domain.vercel.app"
echo "🔗 API 地址: https://your-domain.vercel.app/api"

# 显示部署信息
echo "\n📋 部署后检查清单:"
echo "1. ✓ 检查前端页面是否正常加载"
echo "2. ✓ 测试 API 接口是否正常响应"
echo "3. ✓ 验证视频上传功能"
echo "4. ✓ 确认 Blob 存储是否正常工作"
echo "5. ✓ 测试用户注册和登录功能"