import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Heart, Reply, MoreHorizontal, Send, X } from 'lucide-react';
import { useToast } from './Toast';

// 评论数据接口
interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
  parentId?: string;
}

// 评论组件属性
interface CommentSystemProps {
  videoId: string;
  onClose: () => void;
  className?: string;
}

// 单个评论项组件
interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: string) => void;
  onReply: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  isReply?: boolean;
}

function CommentItem({ comment, onLike, onReply, onDelete, isReply = false }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { success, warning } = useToast();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  const handleLike = () => {
    onLike(comment.id);
    if (!comment.isLiked) {
      success('点赞成功！');
    }
  };

  const handleReply = () => {
    onReply(comment);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(comment.id);
      success('评论已删除');
    }
    setShowMenu(false);
  };

  return (
    <div className={`${isReply ? 'ml-8 mt-3' : 'mb-4'} relative`}>
      <div className="flex space-x-3">
        {/* 用户头像 */}
        <img
          src={comment.avatar}
          alt={comment.username}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        
        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-4 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-gray-900">{comment.username}</span>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
                
                {/* 更多菜单 */}
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-24">
                    <button
                      onClick={() => {
                        warning('举报功能开发中');
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-700"
                    >
                      举报
                    </button>
                    {comment.userId === 'user_demo_001' && onDelete && (
                      <button
                        onClick={handleDelete}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                      >
                        删除
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">{comment.content}</p>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span>{formatTime(comment.createdAt)}</span>
            
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 hover:text-red-500 transition-colors ${
                comment.isLiked ? 'text-red-500' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes > 0 ? comment.likes : ''}</span>
            </button>
            
            <button
              onClick={handleReply}
              className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
            >
              <Reply className="w-4 h-4" />
              <span>回复</span>
            </button>
          </div>
          
          {/* 回复列表 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {!showReplies && (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-blue-500 text-sm hover:underline"
                >
                  查看 {comment.replies.length} 条回复
                </button>
              )}
              
              {showReplies && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowReplies(false)}
                    className="text-gray-500 text-sm hover:underline"
                  >
                    收起回复
                  </button>
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onLike={onLike}
                      onReply={onReply}
                      onDelete={onDelete}
                      isReply={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 评论输入框组件
interface CommentInputProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  replyTo?: Comment | null;
  onCancelReply?: () => void;
}

function CommentInput({ onSubmit, placeholder = '写评论...', replyTo, onCancelReply }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      if (onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      console.error('发送评论失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t bg-white p-4">
      {/* 回复提示 */}
      {replyTo && (
        <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            回复 @{replyTo.username}
          </span>
          <button
            onClick={onCancelReply}
            className="text-blue-500 hover:text-blue-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* 输入框 */}
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={replyTo ? `回复 @${replyTo.username}` : placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className={`p-2 rounded-full transition-colors ${
            content.trim() && !isSubmitting
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

// 主评论系统组件
export default function CommentSystem({ videoId, onClose, className = '' }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const { success, warning, error } = useToast();

  const loadComments = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟评论数据
      const mockComments: Comment[] = [
        {
          id: '1',
          userId: 'user1',
          username: '用户A',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20A&image_size=square',
          content: '这个视频太棒了！👍',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          likes: 12,
          isLiked: false,
          replies: [
            {
              id: '1-1',
              userId: 'user_demo_001',
              username: '我',
              avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=my%20avatar&image_size=square',
              content: '谢谢支持！',
              createdAt: new Date(Date.now() - 3000000).toISOString(),
              likes: 3,
              isLiked: false,
              parentId: '1'
            }
          ]
        },
        {
          id: '2',
          userId: 'user2',
          username: '用户B',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20B&image_size=square',
          content: '学到了很多，感谢分享！',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          likes: 8,
          isLiked: true
        },
        {
          id: '3',
          userId: 'user3',
          username: '用户C',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20C&image_size=square',
          content: '请问这个是怎么做的？可以详细说说吗？',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          likes: 2,
          isLiked: false
        }
      ];
      
      setComments(mockComments);
    } catch (err) {
      error('加载评论失败');
    } finally {
      setLoading(false);
    }
  };

  // 模拟评论数据
  useEffect(() => {
    if (videoId) {
      loadComments();
    }
  }, [videoId, loadComments]);

  const handleLike = async (commentId: string) => {
    try {
      // 模拟API调用
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  isLiked: !reply.isLiked,
                  likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1
                };
              }
              return reply;
            })
          };
        }
        return comment;
      }));
    } catch (err) {
      error('操作失败');
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
  };

  const handleSubmitComment = async (content: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newComment: Comment = {
        id: Date.now().toString(),
        userId: 'user_demo_001',
        username: '我',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=my%20avatar&image_size=square',
        content,
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        parentId: replyTo?.id
      };
      
      if (replyTo) {
        // 添加回复
        setComments(prev => prev.map(comment => {
          if (comment.id === replyTo.id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment]
            };
          }
          return comment;
        }));
      } else {
        // 添加新评论
        setComments(prev => [newComment, ...prev]);
      }
      
      success('评论发送成功！');
    } catch (err) {
      error('发送评论失败');
      throw err;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setComments(prev => prev.filter(comment => {
        if (comment.id === commentId) return false;
        if (comment.replies) {
          comment.replies = comment.replies.filter(reply => reply.id !== commentId);
        }
        return true;
      }));
    } catch (err) {
      error('删除评论失败');
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end ${className}`}>
      <div className="bg-white w-full h-3/4 rounded-t-2xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            评论 {comments.length > 0 && `(${comments.length})`}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        {/* 评论列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">还没有评论，快来抢沙发吧！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onLike={handleLike}
                  onReply={handleReply}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* 评论输入框 */}
        <CommentInput
          onSubmit={handleSubmitComment}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
}

// 导出评论相关类型
export type { Comment, CommentSystemProps };