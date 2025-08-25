// 在浏览器控制台运行此脚本来调试Square页面的缩略图问题

console.log('🔍 开始调试Square页面缩略图问题...');

// 1. 清除所有相关缓存
console.log('🧹 清除缓存...');
localStorage.removeItem('recommendationData');
localStorage.removeItem('square_scroll_position');
sessionStorage.clear();

// 2. 直接测试API
async function testAPI() {
  try {
    console.log('📡 测试API连接...');
    const response = await fetch('http://localhost:3000/api/videos?limit=5');
    const data = await response.json();
    
    console.log('📊 API原始响应:', data);
    
    if (data.success && data.data.videos) {
      data.data.videos.forEach((video, index) => {
        console.log(`🎬 视频 ${index + 1}:`, {
          id: video.id,
          title: video.title,
          thumbnail_url: video.thumbnail_url ? 'EXISTS' : 'NULL',
          thumbnail_type: video.thumbnail_url ? (video.thumbnail_url.startsWith('data:') ? 'Base64' : 'URL') : 'None',
          thumbnail_size: video.thumbnail_url ? Math.round(video.thumbnail_url.length / 1024) + ' KB' : 'N/A'
        });
      });
    }
  } catch (error) {
    console.error('❌ API测试失败:', error);
  }
}

// 3. 测试recommendationService
async function testRecommendationService() {
  try {
    console.log('🔧 测试recommendationService...');
    
    // 动态导入服务
    const { databaseRecommendationService } = await import('/src/services/databaseRecommendationService.ts');
    
    const videos = await databaseRecommendationService.getAllVideos();
    console.log('📊 recommendationService返回的视频数据:', videos);
    
    videos.forEach((video, index) => {
      console.log(`🎬 转换后的视频 ${index + 1}:`, {
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl ? 'EXISTS' : 'NULL',
        thumbnail_type: video.thumbnailUrl ? (video.thumbnailUrl.startsWith('data:') ? 'Base64' : 'URL') : 'None',
        thumbnail_size: video.thumbnailUrl ? Math.round(video.thumbnailUrl.length / 1024) + ' KB' : 'N/A'
      });
    });
  } catch (error) {
    console.error('❌ recommendationService测试失败:', error);
  }
}

// 4. 强制刷新Square页面数据
function forceRefreshSquare() {
  console.log('🔄 强制刷新Square页面...');
  
  // 触发页面可见性变化事件
  const event = new Event('visibilitychange');
  Object.defineProperty(document, 'hidden', { value: false, writable: true });
  document.dispatchEvent(event);
  
  // 或者直接重新加载页面
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

// 执行所有测试
async function runAllTests() {
  await testAPI();
  await testRecommendationService();
  
  console.log('\n🎯 如果API返回的数据有缩略图，但Square页面仍显示AI封面，请运行: forceRefreshSquare()');
  console.log('\n📝 调试完成！检查上面的日志来诊断问题。');
}

// 自动运行测试
runAllTests();

// 导出函数供手动调用
window.debugSquare = {
  testAPI,
  testRecommendationService,
  forceRefreshSquare,
  runAllTests
};