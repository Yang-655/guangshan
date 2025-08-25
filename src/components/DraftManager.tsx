import { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Edit3,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle,
  X,
  Play,
  Calendar,
  Tag
} from 'lucide-react';
import { databaseRecommendationService, type VideoDraft } from '../services/databaseRecommendationService';

interface DraftManagerProps {
  onClose: () => void;
  onEditDraft?: (draft: VideoDraft) => void;
  onRepublishDraft?: (draftId: string) => void;
}

export default function DraftManager({ onClose, onEditDraft, onRepublishDraft }: DraftManagerProps) {
  const [drafts, setDrafts] = useState<VideoDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [republishingId, setRepublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 加载草稿列表
  const loadDrafts = () => {
    try {
      const draftList = databaseRecommendationService.getDrafts();
      setDrafts(draftList);
    } catch (error) {
      console.error('加载草稿失败:', error);
      setError('加载草稿失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  // 重新发布草稿
  const handleRepublish = async (draftId: string) => {
    setRepublishingId(draftId);
    setError(null);
    
    try {
      await databaseRecommendationService.republishFromDraft(draftId);
      setSuccess('草稿重新发布成功！');
      loadDrafts(); // 重新加载草稿列表
      
      // 3秒后隐藏成功消息
      setTimeout(() => setSuccess(null), 3000);
      
      if (onRepublishDraft) {
        onRepublishDraft(draftId);
      }
    } catch (error) {
      console.error('重新发布失败:', error);
      setError(error instanceof Error ? error.message : '重新发布失败');
      loadDrafts(); // 重新加载以更新状态
    } finally {
      setRepublishingId(null);
    }
  };

  // 删除草稿
  const handleDelete = async (draftId: string) => {
    if (!confirm('确定要删除这个草稿吗？此操作无法撤销。')) {
      return;
    }
    
    setDeletingId(draftId);
    
    try {
      const success = databaseRecommendationService.deleteDraft(draftId);
      if (success) {
        setSuccess('草稿已删除');
        loadDrafts();
        
        // 3秒后隐藏成功消息
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('删除草稿失败');
      }
    } catch (error) {
      console.error('删除草稿失败:', error);
      setError('删除草稿失败');
    } finally {
      setDeletingId(null);
    }
  };

  // 编辑草稿
  const handleEdit = (draft: VideoDraft) => {
    if (onEditDraft) {
      onEditDraft(draft);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // 获取状态颜色和图标
  const getStatusInfo = (status: VideoDraft['status']) => {
    switch (status) {
      case 'draft':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          icon: FileText,
          label: '草稿'
        };
      case 'failed':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          icon: AlertCircle,
          label: '发布失败'
        };
      case 'pending':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          icon: Clock,
          label: '发布中'
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          icon: FileText,
          label: '未知'
        };
    }
  };

  // 获取草稿统计
  const stats = databaseRecommendationService.getDraftStats();

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 顶部操作栏 */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-white text-lg font-semibold">草稿管理</h2>
              <p className="text-gray-400 text-sm">
                共 {stats.total} 个草稿
              </p>
            </div>
          </div>
          
          {/* 统计信息 */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1 text-blue-400">
              <FileText className="w-4 h-4" />
              <span>{stats.draft}</span>
            </div>
            <div className="flex items-center space-x-1 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{stats.failed}</span>
            </div>
            <div className="flex items-center space-x-1 text-yellow-400">
              <Clock className="w-4 h-4" />
              <span>{stats.pending}</span>
            </div>
          </div>
        </div>
        
        {/* 错误/成功提示 */}
        {(error || success) && (
          <div className={`px-4 pb-3 flex items-center space-x-2 ${
            success ? 'text-green-400' : 'text-red-400'
          }`}>
            {success ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm">{success || error}</span>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto bg-black">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p>加载草稿中...</p>
            </div>
          </div>
        ) : drafts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">暂无草稿</p>
              <p className="text-sm">当网络连接失败时，视频会自动保存为草稿</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {drafts.map((draft) => {
              const statusInfo = getStatusInfo(draft.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div
                  key={draft.id}
                  className="bg-gray-900 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
                >
                  {/* 草稿头部信息 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-medium truncate">
                          {draft.title || '未命名视频'}
                        </h3>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                          statusInfo.bgColor
                        }`}>
                          <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                          <span className={statusInfo.color}>{statusInfo.label}</span>
                        </div>
                      </div>
                      
                      {draft.description && (
                        <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                          {draft.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatTime(draft.updatedAt)}</span>
                        </div>
                        
                        {draft.hashtags && draft.hashtags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span>{draft.hashtags.slice(0, 2).join(', ')}</span>
                            {draft.hashtags.length > 2 && (
                              <span>+{draft.hashtags.length - 2}</span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Play className="w-3 h-3" />
                          <span>{draft.duration}s</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 缩略图 */}
                    {draft.thumbnailUrl && (
                      <div className="ml-4 flex-shrink-0">
                        <img
                          src={draft.thumbnailUrl}
                          alt="缩略图"
                          className="w-16 h-12 object-cover rounded bg-gray-800"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* 错误信息 */}
                  {draft.status === 'failed' && draft.errorMessage && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                      {draft.errorMessage}
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center justify-end space-x-2">
                    {/* 编辑按钮 */}
                    <button
                      onClick={() => handleEdit(draft)}
                      className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors flex items-center space-x-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>编辑</span>
                    </button>
                    
                    {/* 重新发布按钮 */}
                    <button
                      onClick={() => handleRepublish(draft.id)}
                      disabled={republishingId === draft.id || draft.status === 'pending'}
                      className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center space-x-1 ${
                        republishingId === draft.id || draft.status === 'pending'
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>
                        {republishingId === draft.id ? '发布中...' : 
                         draft.status === 'pending' ? '发布中' : '重新发布'}
                      </span>
                    </button>
                    
                    {/* 删除按钮 */}
                    <button
                      onClick={() => handleDelete(draft.id)}
                      disabled={deletingId === draft.id}
                      className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center space-x-1 ${
                        deletingId === draft.id
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{deletingId === draft.id ? '删除中...' : '删除'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}