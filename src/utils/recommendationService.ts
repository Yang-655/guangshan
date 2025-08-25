/**
 * 推荐服务 - 数据库版本
 * 使用数据库API替代localStorage存储
 */

// 导入数据库版本的推荐服务
import { 
  databaseRecommendationService,
  type VideoContent,
  type UserBehavior,
  type RecommendationResult,
  type UserPreference
} from '../services/databaseRecommendationService.js';

// 重新导出所有接口和类型，保持向后兼容
export type {
  VideoContent,
  UserBehavior,
  RecommendationResult,
  UserPreference
};

// 导出推荐服务实例
export const recommendationService = databaseRecommendationService;

// 默认导出
export default databaseRecommendationService;