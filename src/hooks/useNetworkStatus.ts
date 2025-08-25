import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService.js';

export interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnlineTime: number | null;
  connectionType: string;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastOnlineTime: navigator.onLine ? Date.now() : null,
    connectionType: 'unknown'
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      
      setNetworkStatus(prev => ({
        ...prev,
        isOnline,
        lastOnlineTime: isOnline ? Date.now() : prev.lastOnlineTime,
        isConnecting: false
      }));
    };

    const handleOnline = () => {
      console.log('🌐 网络连接已恢复');
      updateNetworkStatus();
    };

    const handleOffline = () => {
      console.log('🚫 网络连接已断开');
      updateNetworkStatus();
    };

    // 监听网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 定期检查网络连接状态
    const checkConnection = async () => {
      try {
        setNetworkStatus(prev => ({ ...prev, isConnecting: true }));
        
        // 使用apiService检测真实的网络连接
        const response = await apiService.healthCheck();
        
        const isReallyOnline = response && response.success;
        
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: isReallyOnline,
          isConnecting: false,
          lastOnlineTime: isReallyOnline ? Date.now() : prev.lastOnlineTime
        }));
      } catch (error) {
        console.warn('网络连接检查失败:', error);
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: false,
          isConnecting: false
        }));
      }
    };

    // 每30秒检查一次网络连接
    const intervalId = setInterval(checkConnection, 30000);

    // 获取连接类型信息（如果支持）
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const updateConnectionType = () => {
          setNetworkStatus(prev => ({
            ...prev,
            connectionType: connection.effectiveType || connection.type || 'unknown'
          }));
        };
        
        updateConnectionType();
        connection.addEventListener('change', updateConnectionType);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          connection.removeEventListener('change', updateConnectionType);
          clearInterval(intervalId);
        };
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return networkStatus;
}

// 网络状态变化监听器
export function useNetworkStatusChange(callback: (status: NetworkStatus) => void) {
  const networkStatus = useNetworkStatus();
  
  useEffect(() => {
    callback(networkStatus);
  }, [networkStatus, callback]);
  
  return networkStatus;
}