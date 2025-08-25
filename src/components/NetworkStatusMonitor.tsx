import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useNetworkStatus, useNetworkStatusChange } from '../hooks/useNetworkStatus';
import { draftAutoRepublishService } from '../services/draftAutoRepublishService';
import { useToast } from './Toast';

interface NetworkStatusMonitorProps {
  showIndicator?: boolean;
  autoRepublish?: boolean;
}

export default function NetworkStatusMonitor({ 
  showIndicator = true, 
  autoRepublish = true 
}: NetworkStatusMonitorProps) {
  const networkStatus = useNetworkStatus();
  const { success, error, info } = useToast();
  const [lastOfflineTime, setLastOfflineTime] = useState<number | null>(null);
  const [showReconnectNotification, setShowReconnectNotification] = useState(false);
  const [isAutoRepublishing, setIsAutoRepublishing] = useState(false);

  // 设置Toast回调
  useEffect(() => {
    draftAutoRepublishService.setToastCallbacks({ success, error, info });
  }, [success, error, info]);

  // 监听网络状态变化
  useNetworkStatusChange(async (status) => {
    if (!status.isOnline && !lastOfflineTime) {
      // 网络断开
      setLastOfflineTime(Date.now());
      console.log('🚫 网络连接断开');
      
      if (showIndicator) {
        error('网络连接已断开，视频将保存为草稿');
      }
    } else if (status.isOnline && lastOfflineTime) {
      // 网络恢复
      const offlineDuration = Date.now() - lastOfflineTime;
      console.log(`🌐 网络连接已恢复，离线时长: ${Math.round(offlineDuration / 1000)}秒`);
      
      setLastOfflineTime(null);
      setShowReconnectNotification(true);
      
      if (showIndicator) {
        success('网络连接已恢复');
      }
      
      // 自动重新发布草稿
      if (autoRepublish && draftAutoRepublishService.hasFailedDrafts()) {
        setIsAutoRepublishing(true);
        
        try {
          await draftAutoRepublishService.onNetworkRestore();
        } catch (error) {
          console.error('自动重新发布失败:', error);
        } finally {
          setIsAutoRepublishing(false);
        }
      }
      
      // 3秒后隐藏重连通知
      setTimeout(() => {
        setShowReconnectNotification(false);
      }, 3000);
    }
  });

  // 手动重新发布所有失败的草稿
  const handleManualRepublish = async () => {
    setIsAutoRepublishing(true);
    
    try {
      const result = await draftAutoRepublishService.republishAllFailedDrafts();
      
      if (result.total === 0) {
        info('没有需要重新发布的草稿');
      } else {
        const message = `重新发布完成: 成功 ${result.success}/${result.total} 个草稿`;
        if (result.success === result.total) {
          success(message);
        } else {
          error(message);
        }
      }
    } catch (error) {
      console.error('手动重新发布失败:', error);
      error('重新发布草稿失败');
    } finally {
      setIsAutoRepublishing(false);
    }
  };

  const failedDraftsCount = draftAutoRepublishService.getFailedDraftsCount();

  if (!showIndicator) {
    return null;
  }

  return (
    <>
      {/* 网络状态指示器 */}
      <div className="fixed top-4 right-4 z-50">
        {/* 网络状态图标 */}
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ${
          networkStatus.isOnline 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {networkStatus.isConnecting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : networkStatus.isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          
          <span className="text-sm font-medium">
            {networkStatus.isConnecting ? '连接中...' :
             networkStatus.isOnline ? '在线' : '离线'}
          </span>
          
          {/* 连接类型 */}
          {networkStatus.isOnline && networkStatus.connectionType !== 'unknown' && (
            <span className="text-xs opacity-75">
              ({networkStatus.connectionType})
            </span>
          )}
        </div>
        
        {/* 失败草稿提示 */}
        {networkStatus.isOnline && failedDraftsCount > 0 && (
          <div className="mt-2 bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              {failedDraftsCount} 个草稿待发布
            </span>
            <button
              onClick={handleManualRepublish}
              disabled={isAutoRepublishing}
              className="ml-2 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              {isAutoRepublishing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                '重新发布'
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* 网络重连通知 */}
      {showReconnectNotification && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in-right">
          <CheckCircle className="w-5 h-5" />
          <div>
            <div className="font-medium">网络已恢复</div>
            {isAutoRepublishing && (
              <div className="text-sm opacity-90 flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>正在自动重新发布草稿...</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 自动重新发布进度指示器 */}
      {isAutoRepublishing && !showReconnectNotification && (
        <div className="fixed top-20 right-4 z-50 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <div>
            <div className="font-medium">正在重新发布草稿</div>
            <div className="text-sm opacity-90">
              请稍候，正在处理 {failedDraftsCount} 个草稿
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 简化版网络状态指示器（仅显示状态，不显示草稿信息）
export function SimpleNetworkIndicator() {
  const networkStatus = useNetworkStatus();
  
  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
      networkStatus.isOnline 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {networkStatus.isConnecting ? (
        <RefreshCw className="w-3 h-3 animate-spin" />
      ) : networkStatus.isOnline ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      <span>
        {networkStatus.isConnecting ? '连接中' :
         networkStatus.isOnline ? '在线' : '离线'}
      </span>
    </div>
  );
}