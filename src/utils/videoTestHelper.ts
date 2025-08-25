/**
 * 视频测试辅助工具
 * 用于测试视频数据的保存和加载
 */

import { recommendationService } from './recommendationService';

// 创建测试用的base64视频数据（非常小的测试视频）
const createTestVideoBase64 = (): string => {
  // 这是一个非常小的测试视频的base64数据（1x1像素，1秒）
  return 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTYgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAABWWWIhAA3//728P4FNjuY0JcRzeidDNWXHu34xxjrmvseqCTNlHAAAF9iYXNlNjQgdGVzdCB2aWRlbyBkYXRhAAAAGGVkdHMAAAAQZWxzdAAAAAAAAAABAAAAAQAAAGAAAABBbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEBc3RibAAAAGNzdHNkAAAAAAAAAAEAAABTYXZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABhhdmNDAWQAH//hABhnZAAfrNlAmDPl4QAAAwABAAADAGQPGDGWAQAGaOvjyyLA/fj4AAAAABRidHJ0AAAAAAAeAAAAHgAAABhzdHRzAAAAAAAAAAEAAAABAAAAGAAAABxzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAUc3RzegAAAAAAAAAaAAAAAQAAABRzdGNvAAAAAAAAAAEAAAAsAAAAYnVkdGEAAABabWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAtaWxzdAAAACWpdG9vAAAAHWRhdGEAAAABAAAAAExhdmY1Ny44My4xMDA=';
};

export class VideoTestHelper {
  /**
   * 创建测试视频并发布
   */
  static async createTestVideo(): Promise<string> {
    const testVideoData = {
      userId: 'user_demo_001',
      title: '测试视频 - ' + new Date().toLocaleString(),
      description: '这是一个用于测试视频保存和显示功能的测试视频',
      videoUrl: createTestVideoBase64(),
      duration: 1, // 1秒
      hashtags: ['测试', '视频'],
      location: '测试环境',
      privacyLevel: 'public'
    };
    
    console.log('创建测试视频，数据大小:', Math.round(testVideoData.videoUrl.length / 1024), 'KB');
    
    const videoId = await recommendationService.publishVideo(testVideoData);
    console.log('测试视频已发布，ID:', videoId);
    
    // 验证保存
     const savedVideo = await recommendationService.getVideoById(videoId);
     console.log('保存的视频数据:', savedVideo);
     
     console.log('验证测试视频保存:', {
       id: savedVideo?.id,
       title: savedVideo?.title,
       hasVideoUrl: !!savedVideo?.videoUrl,
       videoUrlType: savedVideo?.videoUrl?.startsWith('data:') ? 'base64' : 'other'
     });
    
    return videoId;
  }
  
  /**
   * 清理所有测试视频
   */
  static async clearTestVideos(): Promise<void> {
    const userVideos = await recommendationService.getUserVideos('user_demo_001');
    const testVideos = userVideos.filter(video => video.title.includes('测试视频'));
    
    testVideos.forEach(video => {
      recommendationService.deleteVideo(video.id);
      console.log('已删除测试视频:', video.id, video.title);
    });
    
    console.log(`已清理 ${testVideos.length} 个测试视频`);
  }
  
  /**
   * 检查视频数据状态
   */
  static async checkVideoDataStatus(): Promise<void> {
    console.log('=== 视频数据状态检查 ===');
    
    const userVideos = await recommendationService.getUserVideos('user_demo_001');
    console.log('用户视频总数:', userVideos.length);
    
    userVideos.forEach((video, index) => {
      console.log(`视频 ${index + 1}:`, {
        id: video.id,
        title: video.title,
        hasVideoUrl: !!video.videoUrl,
        videoUrlType: video.videoUrl ? 
          (video.videoUrl.startsWith('data:') ? 'base64' : 
           video.videoUrl.startsWith('blob:') ? 'blob' : 'other') : 'none',
        videoUrlSize: video.videoUrl ? Math.round(video.videoUrl.length / 1024) + 'KB' : 'N/A',
        uploadTime: new Date(video.uploadTime).toLocaleString()
      });
    });
    
    // 检查localStorage
    const recommendationData = localStorage.getItem('recommendationData');
    const videoBase64Data = localStorage.getItem('videoBase64Data');
    
    console.log('localStorage状态:', {
      recommendationData: !!recommendationData,
      videoBase64Data: !!videoBase64Data,
      recommendationDataSize: recommendationData ? Math.round(recommendationData.length / 1024) + 'KB' : 'N/A',
      videoBase64DataSize: videoBase64Data ? Math.round(videoBase64Data.length / 1024) + 'KB' : 'N/A'
    });
  }
}

// 在开发环境中将工具添加到全局对象，方便调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as typeof window & { VideoTestHelper: typeof VideoTestHelper }).VideoTestHelper = VideoTestHelper;
}