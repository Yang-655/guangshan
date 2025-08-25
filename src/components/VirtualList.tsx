import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    const visibleItems = items.slice(start, end + 1).map((item, index) => ({
      item,
      index: start + index
    }));

    return {
      visibleItems,
      totalHeight: items.length * itemHeight,
      offsetY: start * itemHeight
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 专门用于交易记录的虚拟列表组件
interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

interface VirtualTransactionListProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
  className?: string;
}

export const VirtualTransactionList: React.FC<VirtualTransactionListProps> = ({
  transactions,
  onTransactionClick,
  className = ''
}) => {
  const renderTransaction = useCallback((transaction: Transaction, index: number) => {
    const getTransactionIcon = (type: string) => {
      switch (type) {
        case 'income':
          return '+';
        case 'expense':
          return '-';
        case 'transfer':
          return '↑';
        default:
          return '•';
      }
    };

    const getAmountColor = (type: string) => {
      switch (type) {
        case 'income':
          return 'text-green-600';
        case 'expense':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return 'text-green-600';
        case 'pending':
          return 'text-yellow-600';
        case 'failed':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <div 
        className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
        onClick={() => onTransactionClick?.(transaction)}
      >
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
            <span className={`text-lg font-bold ${getAmountColor(transaction.type)}`}>
              {getTransactionIcon(transaction.type)}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-800">{transaction.description}</div>
            <div className="text-sm text-gray-500">{transaction.timestamp}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-semibold ${getAmountColor(transaction.type)}`}>
            {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}¥{transaction.amount.toLocaleString()}
          </div>
          <div className={`text-sm ${getStatusColor(transaction.status)}`}>
            {transaction.status === 'completed' ? '已完成' : transaction.status === 'pending' ? '处理中' : '失败'}
          </div>
        </div>
      </div>
    );
  }, [onTransactionClick]);

  return (
    <VirtualList
      items={transactions}
      itemHeight={80}
      containerHeight={400}
      renderItem={renderTransaction}
      className={className}
    />
  );
};

// 专门用于视频列表的虚拟网格组件
interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  likes: number;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
}

interface VirtualVideoGridProps {
  videos: Video[];
  onVideoClick?: (video: Video) => void;
  className?: string;
  columns?: number;
}

export const VirtualVideoGrid: React.FC<VirtualVideoGridProps> = ({
  videos,
  onVideoClick,
  className = '',
  columns = 2
}) => {
  // 将视频数组转换为行数组
  const videoRows = useMemo(() => {
    const rows: Video[][] = [];
    for (let i = 0; i < videos.length; i += columns) {
      rows.push(videos.slice(i, i + columns));
    }
    return rows;
  }, [videos, columns]);

  const renderVideoRow = useCallback((row: Video[], index: number) => {
    return (
      <div className="flex gap-4 px-4">
        {row.map((video) => (
          <div 
            key={video.id}
            className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onVideoClick?.(video)}
          >
            <div className="relative">
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm line-clamp-2">{video.title}</h3>
              <div className="flex items-center mb-2">
                <img 
                  src={video.author.avatar} 
                  alt={video.author.name}
                  className="w-4 h-4 rounded-full mr-2"
                  loading="lazy"
                />
                <span className="text-xs text-gray-600 truncate">{video.author.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{video.views >= 10000 ? `${(video.views / 10000).toFixed(1)}万` : video.views} 观看</span>
                <span>{video.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
        {/* 填充空白位置 */}
        {row.length < columns && Array.from({ length: columns - row.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex-1" />
        ))}
      </div>
    );
  }, [onVideoClick, columns]);

  return (
    <VirtualList
      items={videoRows}
      itemHeight={220}
      containerHeight={600}
      renderItem={renderVideoRow}
      className={className}
    />
  );
};