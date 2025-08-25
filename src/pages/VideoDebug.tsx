import React, { useState, useEffect } from 'react';
import { recommendationService } from '../utils/recommendationService';
import { VideoThumbnailGenerator } from '../utils/videoThumbnailGenerator';
import { VideoTestHelper } from '../utils/videoTestHelper';

interface VideoDebugInfo {
  id: string;
  title: string;
  hasVideoUrl: boolean;
  videoUrlType: string;
  videoUrlLength: number;
  videoUrlPreview: string;
  thumbnailGenerated: boolean;
  thumbnailError?: string;
  thumbnail?: string;
}

const VideoDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<VideoDebugInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const checkVideoData = async () => {
    setLoading(true);
    try {
      console.log('开始检查视频数据...');
      
      // 获取用户视频
      const userVideos = await recommendationService.getUserVideos('user_demo_001');
      console.log('获取到的用户视频:', userVideos);
      
      const debugResults: VideoDebugInfo[] = [];
      
      for (const video of userVideos) {
        const debugItem: VideoDebugInfo = {
          id: video.id,
          title: video.title,
          hasVideoUrl: !!video.videoUrl,
          videoUrlType: video.videoUrl ? 
            (video.videoUrl.startsWith('data:') ? 'base64' : 
             video.videoUrl.startsWith('blob:') ? 'blob' : 
             video.videoUrl.startsWith('http') ? 'http' : 'unknown') : 'none',
          videoUrlLength: video.videoUrl ? video.videoUrl.length : 0,
          videoUrlPreview: video.videoUrl ? video.videoUrl.substring(0, 100) + '...' : 'N/A',
          thumbnailGenerated: false
        };
        
        // 尝试生成缩略图
        if (video.videoUrl && (video.videoUrl.startsWith('data:video/') || video.videoUrl.startsWith('blob:') || video.videoUrl.startsWith('http'))) {
          try {
            console.log(`尝试为视频 ${video.id} 生成缩略图...`);
            const thumbnail = await VideoThumbnailGenerator.generateThumbnail(video.videoUrl, 1, 160, 120);
            debugItem.thumbnailGenerated = true;
            debugItem.thumbnail = thumbnail;
            console.log(`视频 ${video.id} 缩略图生成成功`);
          } catch (error) {
            debugItem.thumbnailGenerated = false;
            debugItem.thumbnailError = error instanceof Error ? error.message : '未知错误';
            console.error(`视频 ${video.id} 缩略图生成失败:`, error);
          }
        }
        
        debugResults.push(debugItem);
      }
      
      setDebugInfo(debugResults);
      console.log('视频数据检查完成:', debugResults);
    } catch (error) {
      console.error('检查视频数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLocalStorage = () => {
    console.log('=== localStorage 检查 ===');
    console.log('recommendationData 存在:', !!localStorage.getItem('recommendationData'));
    console.log('videoBase64Data 存在:', !!localStorage.getItem('videoBase64Data'));
    
    const recommendationData = localStorage.getItem('recommendationData');
    if (recommendationData) {
      try {
        const parsed = JSON.parse(recommendationData);
        console.log('recommendationData 解析成功, 视频数量:', parsed.videoContents?.length || 0);
        console.log('视频内容预览:', parsed.videoContents?.slice(0, 2));
      } catch (error) {
        console.error('recommendationData 解析失败:', error);
      }
    }
    
    const videoBase64Data = localStorage.getItem('videoBase64Data');
    if (videoBase64Data) {
      try {
        const parsed = JSON.parse(videoBase64Data);
        console.log('videoBase64Data 解析成功, 视频数量:', Object.keys(parsed).length);
        console.log('视频ID列表:', Object.keys(parsed));
      } catch (error) {
        console.error('videoBase64Data 解析失败:', error);
      }
    }
  };

  const createTestVideo = async () => {
    try {
      setLoading(true);
      console.log('开始创建测试视频...');
      const videoId = await VideoTestHelper.createTestVideo();
      console.log('测试视频创建成功:', videoId);
      // 重新检查数据
      await checkVideoData();
      checkLocalStorage();
    } catch (error) {
      console.error('创建测试视频失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearTestVideos = () => {
    try {
      VideoTestHelper.clearTestVideos();
      // 重新检查数据
      checkVideoData();
      checkLocalStorage();
    } catch (error) {
      console.error('清理测试视频失败:', error);
    }
  };

  const checkDataStatus = () => {
    VideoTestHelper.checkVideoDataStatus();
  };

  useEffect(() => {
    checkVideoData();
    checkLocalStorage();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">视频数据调试页面</h1>
          
          <div className="mb-6 space-x-4">
            <button
              onClick={() => { checkVideoData(); checkLocalStorage(); }}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? '检查中...' : '重新检查'}
            </button>
            
            <button
              onClick={createTestVideo}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              创建测试视频
            </button>
            
            <button
              onClick={clearTestVideos}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              清理测试视频
            </button>
            
            <button
              onClick={checkDataStatus}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              数据状态检查
            </button>
          </div>

          {debugInfo.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">没有找到视频数据</p>
            </div>
          ) : (
            <div className="space-y-6">
              {debugInfo.map((info) => (
                <div key={info.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{info.title}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p><span className="font-medium">视频ID:</span> {info.id}</p>
                      <p><span className="font-medium">有视频URL:</span> 
                        <span className={info.hasVideoUrl ? 'text-green-600' : 'text-red-600'}>
                          {info.hasVideoUrl ? '是' : '否'}
                        </span>
                      </p>
                      <p><span className="font-medium">URL类型:</span> {info.videoUrlType}</p>
                      <p><span className="font-medium">URL长度:</span> {info.videoUrlLength.toLocaleString()} 字符</p>
                      <p><span className="font-medium">URL预览:</span> 
                        <code className="text-xs bg-gray-100 p-1 rounded">{info.videoUrlPreview}</code>
                      </p>
                      <p><span className="font-medium">缩略图生成:</span> 
                        <span className={info.thumbnailGenerated ? 'text-green-600' : 'text-red-600'}>
                          {info.thumbnailGenerated ? '成功' : '失败'}
                        </span>
                      </p>
                      {info.thumbnailError && (
                        <p><span className="font-medium text-red-600">错误:</span> {info.thumbnailError}</p>
                      )}
                    </div>
                    
                    <div>
                      {info.thumbnail ? (
                        <div>
                          <p className="font-medium mb-2">生成的缩略图:</p>
                          <img 
                            src={info.thumbnail} 
                            alt="缩略图" 
                            className="w-40 h-30 object-cover border border-gray-300 rounded"
                          />
                        </div>
                      ) : (
                        <div className="w-40 h-30 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                          <span className="text-gray-500 text-sm">无缩略图</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDebug;