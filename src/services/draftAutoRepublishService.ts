import { databaseRecommendationService, type VideoDraft } from './databaseRecommendationService';
import { useToast } from '../components/Toast';

class DraftAutoRepublishService {
  private isProcessing = false;
  private retryQueue: Set<string> = new Set();
  private maxRetries = 3;
  private retryDelay = 5000; // 5秒
  private toastCallbacks: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  } | null = null;

  // 设置Toast回调函数
  setToastCallbacks(callbacks: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  }) {
    this.toastCallbacks = callbacks;
  }

  // 当网络恢复时自动重新发布失败的草稿
  async onNetworkRestore(): Promise<void> {
    if (this.isProcessing) {
      console.log('📝 草稿自动重新发布正在进行中，跳过此次触发');
      return;
    }

    this.isProcessing = true;
    console.log('🌐 网络已恢复，开始自动重新发布草稿...');

    try {
      // 获取所有失败的草稿
      const drafts = databaseRecommendationService.getDrafts();
      const failedDrafts = drafts.filter(draft => 
        draft.status === 'failed' && !this.retryQueue.has(draft.id)
      );

      if (failedDrafts.length === 0) {
        console.log('📝 没有需要重新发布的草稿');
        return;
      }

      console.log(`📝 发现 ${failedDrafts.length} 个失败的草稿，开始自动重新发布...`);
      
      if (this.toastCallbacks) {
        this.toastCallbacks.info(`发现 ${failedDrafts.length} 个草稿需要重新发布`);
      }

      // 逐个尝试重新发布
      let successCount = 0;
      let failCount = 0;

      for (const draft of failedDrafts) {
        try {
          this.retryQueue.add(draft.id);
          console.log(`📝 正在重新发布草稿: ${draft.title} (${draft.id})`);
          
          await databaseRecommendationService.republishFromDraft(draft.id);
          
          successCount++;
          console.log(`✅ 草稿重新发布成功: ${draft.title}`);
          
        } catch (error) {
          failCount++;
          console.error(`❌ 草稿重新发布失败: ${draft.title}`, error);
        } finally {
          this.retryQueue.delete(draft.id);
        }

        // 在每次发布之间添加短暂延迟，避免过于频繁的请求
        if (failedDrafts.indexOf(draft) < failedDrafts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 显示结果通知
      if (this.toastCallbacks) {
        if (successCount > 0) {
          this.toastCallbacks.success(`成功重新发布 ${successCount} 个草稿`);
        }
        if (failCount > 0) {
          this.toastCallbacks.error(`${failCount} 个草稿重新发布失败`);
        }
      }

      console.log(`📝 自动重新发布完成: 成功 ${successCount} 个，失败 ${failCount} 个`);

    } catch (error) {
      console.error('📝 自动重新发布草稿过程中发生错误:', error);
      if (this.toastCallbacks) {
        this.toastCallbacks.error('自动重新发布草稿失败');
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // 手动触发重新发布所有失败的草稿
  async republishAllFailedDrafts(): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    console.log('📝 手动触发重新发布所有失败的草稿...');
    
    const drafts = databaseRecommendationService.getDrafts();
    const failedDrafts = drafts.filter(draft => draft.status === 'failed');
    
    if (failedDrafts.length === 0) {
      if (this.toastCallbacks) {
        this.toastCallbacks.info('没有失败的草稿需要重新发布');
      }
      return { success: 0, failed: 0, total: 0 };
    }

    let successCount = 0;
    let failCount = 0;

    for (const draft of failedDrafts) {
      try {
        await databaseRecommendationService.republishFromDraft(draft.id);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`重新发布草稿失败: ${draft.title}`, error);
      }
    }

    const result = {
      success: successCount,
      failed: failCount,
      total: failedDrafts.length
    };

    if (this.toastCallbacks) {
      if (successCount > 0) {
        this.toastCallbacks.success(`成功重新发布 ${successCount} 个草稿`);
      }
      if (failCount > 0) {
        this.toastCallbacks.error(`${failCount} 个草稿重新发布失败`);
      }
    }

    return result;
  }

  // 检查是否有待重新发布的草稿
  hasFailedDrafts(): boolean {
    const drafts = databaseRecommendationService.getDrafts();
    return drafts.some(draft => draft.status === 'failed');
  }

  // 获取失败草稿的数量
  getFailedDraftsCount(): number {
    const drafts = databaseRecommendationService.getDrafts();
    return drafts.filter(draft => draft.status === 'failed').length;
  }

  // 清理重试队列
  clearRetryQueue(): void {
    this.retryQueue.clear();
  }

  // 获取当前处理状态
  getProcessingStatus(): {
    isProcessing: boolean;
    queueSize: number;
    failedDraftsCount: number;
  } {
    return {
      isProcessing: this.isProcessing,
      queueSize: this.retryQueue.size,
      failedDraftsCount: this.getFailedDraftsCount()
    };
  }
}

// 导出单例实例
export const draftAutoRepublishService = new DraftAutoRepublishService();
export default draftAutoRepublishService;