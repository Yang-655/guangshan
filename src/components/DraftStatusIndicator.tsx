import { useState, useEffect } from 'react';
import { FileText, AlertCircle, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { databaseRecommendationService } from '../services/databaseRecommendationService';
import { draftAutoRepublishService } from '../services/draftAutoRepublishService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface DraftStatusIndicatorProps {
  variant?: 'badge' | 'button' | 'card';
  showDetails?: boolean;
  onClick?: () => void;
}

export default function DraftStatusIndicator({ 
  variant = 'badge', 
  showDetails = false,
  onClick 
}: DraftStatusIndicatorProps) {
  const navigate = useNavigate();
  const networkStatus = useNetworkStatus();
  const [draftStats, setDraftStats] = useState({
    total: 0,
    draft: 0,
    failed: 0,
    pending: 0
  });
  const [isRepublishing, setIsRepublishing] = useState(false);

  // 更新草稿统计
  const updateDraftStats = () => {
    const stats = databaseRecommendationService.getDraftStats();
    setDraftStats(stats);
  };

  useEffect(() => {
    updateDraftStats();
    
    // 每5秒更新一次统计
    const interval = setInterval(updateDraftStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // 处理点击事件
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/drafts');
    }
  };

  // 手动重新发布失败的草稿
  const handleRepublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!networkStatus.isOnline) {
      alert('网络连接不可用，无法重新发布草稿');
      return;
    }
    
    setIsRepublishing(true);
    
    try {
      await draftAutoRepublishService.republishAllFailedDrafts();
      updateDraftStats();
    } catch (error) {
      console.error('重新发布失败:', error);
    } finally {
      setIsRepublishing(false);
    }
  };

  // 如果没有草稿，根据variant决定是否显示
  if (draftStats.total === 0) {
    return variant === 'card' ? (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">暂无草稿</p>
      </div>
    ) : null;
  }

  // Badge 变体
  if (variant === 'badge') {
    return (
      <button
        onClick={handleClick}
        className="relative inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200 transition-colors"
      >
        <FileText className="w-3 h-3" />
        <span>{draftStats.total}</span>
        
        {draftStats.failed > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{draftStats.failed}</span>
          </div>
        )}
      </button>
    );
  }

  // Button 变体
  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FileText className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">草稿 ({draftStats.total})</span>
        
        {draftStats.failed > 0 && (
          <div className="flex items-center space-x-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600">{draftStats.failed} 失败</span>
          </div>
        )}
      </button>
    );
  }

  // Card 变体
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium text-gray-900">草稿箱</h3>
        </div>
        
        <button
          onClick={handleClick}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          查看全部
        </button>
      </div>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{draftStats.draft}</div>
          <div className="text-xs text-gray-500 flex items-center justify-center space-x-1">
            <FileText className="w-3 h-3" />
            <span>草稿</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">{draftStats.failed}</div>
          <div className="text-xs text-gray-500 flex items-center justify-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>失败</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-600">{draftStats.pending}</div>
          <div className="text-xs text-gray-500 flex items-center justify-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>发布中</span>
          </div>
        </div>
      </div>
      
      {/* 操作按钮 */}
      {draftStats.failed > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{draftStats.failed} 个草稿发布失败</span>
          </div>
          
          <button
            onClick={handleRepublish}
            disabled={isRepublishing || !networkStatus.isOnline}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
              isRepublishing || !networkStatus.isOnline
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isRepublishing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            <span>{isRepublishing ? '发布中...' : '重新发布'}</span>
          </button>
        </div>
      )}
      
      {/* 网络状态提示 */}
      {!networkStatus.isOnline && draftStats.failed > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          网络连接不可用，无法重新发布草稿
        </div>
      )}
      
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <div>• 网络断开时视频会自动保存为草稿</div>
            <div>• 网络恢复后会自动尝试重新发布</div>
            <div>• 可以手动管理和重新发布草稿</div>
          </div>
        </div>
      )}
    </div>
  );
}

// 简化的草稿计数器
export function DraftCounter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const updateCount = () => {
      const stats = databaseRecommendationService.getDraftStats();
      setCount(stats.total);
    };
    
    updateCount();
    const interval = setInterval(updateCount, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (count === 0) return null;
  
  return (
    <div className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
      {count > 99 ? '99+' : count}
    </div>
  );
}