import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

// 动态导入大型组件
const Home = lazy(() => import("@/pages/Home"));
const Discover = lazy(() => import("@/pages/Discover"));
const Camera = lazy(() => import("@/pages/Camera"));
const Messages = lazy(() => import("@/pages/Messages"));
const Profile = lazy(() => import("@/pages/Profile"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const SubtitleCenter = lazy(() => import("@/pages/SubtitleCenter"));
const ImagePublish = lazy(() => import("@/pages/ImagePublish"));
const LiveStreaming = lazy(() => import("@/pages/LiveStreaming"));
const ChatDetail = lazy(() => import("@/pages/ChatDetail"));
const Wallet = lazy(() => import("@/pages/Wallet"));
const Shop = lazy(() => import("@/pages/Shop"));
const AdsCenter = lazy(() => import("@/pages/AdsCenter"));
const Settings = lazy(() => import("@/pages/Settings"));
const ModerationCenter = lazy(() => import("@/pages/ModerationCenter"));
const AnalyticsCenter = lazy(() => import("@/pages/AnalyticsCenter"));
const CryptoCenter = lazy(() => import("@/pages/CryptoCenter"));
const FraudShield = lazy(() => import("@/pages/FraudShield"));
const SecondHand = lazy(() => import("@/pages/SecondHand"));
const Square = lazy(() => import("@/pages/Square"));
const Reward = lazy(() => import("@/pages/Reward"));
const RewardPublish = lazy(() => import("@/pages/RewardPublish"));
const RewardDetail = lazy(() => import("@/pages/RewardDetail"));
const RewardRules = lazy(() => import("@/pages/RewardRules"));
const RewardManage = lazy(() => import("@/pages/RewardManage"));
const CreditCenter = lazy(() => import("@/pages/CreditCenter"));
const VideoDetail = lazy(() => import("@/pages/VideoDetail"));
const VideoDebug = lazy(() => import("@/pages/VideoDebug"));
import TestPage from "@/pages/TestPage";
import DraftManager from "@/components/DraftManager";
import NetworkStatusMonitor from "@/components/NetworkStatusMonitor";
import TabNavigation from "@/components/TabNavigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastManager, useToast } from "@/components/Toast";
import IncomingCallNotification from './components/IncomingCallNotification';
import { Toaster } from "sonner";
import { useEffect, useState } from "react";

export default function App() {
  const { toasts, removeToast } = useToast();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // 标记应用已准备就绪
    setIsAppReady(true);
    console.log('App component mounted');
    console.log('Environment variables:', {
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      APP_NAME: import.meta.env.VITE_APP_NAME,
      NODE_ENV: import.meta.env.NODE_ENV,
      BASE_URL: import.meta.env.BASE_URL,
      MODE: import.meta.env.MODE
    });
    console.log('Current location:', window.location.href);
    console.log('Document ready state:', document.readyState);
    
    // 添加全局错误监听
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 显示加载状态
  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>正在加载应用...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="relative">
          <Suspense fallback={<div className="h-screen flex items-center justify-center bg-black"><LoadingSpinner /></div>}>
            <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/subtitle-center" element={<SubtitleCenter />} />
          <Route path="/image-publish" element={<ImagePublish />} />
          <Route path="/live" element={<LiveStreaming />} />
          <Route path="/live-streaming" element={<LiveStreaming />} />
          <Route path="/chat/:chatId" element={<ChatDetail />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/secondhand" element={<SecondHand />} />
          <Route path="/square" element={<Square />} />
          <Route path="/reward" element={<Reward />} />
          <Route path="/reward/publish" element={<RewardPublish />} />
          <Route path="/reward/:taskId" element={<RewardDetail />} />
          <Route path="/reward/rules" element={<RewardRules />} />
          <Route path="/reward/manage" element={<RewardManage />} />
          <Route path="/credit" element={<CreditCenter />} />
          <Route path="/ads" element={<AdsCenter />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/moderation" element={<ModerationCenter />} />
          <Route path="/analytics" element={<AnalyticsCenter />} />
          <Route path="/crypto" element={<CryptoCenter />} />
          <Route path="/fraud-shield" element={<FraudShield />} />
          <Route path="/video/:videoId" element={<VideoDetail />} />
          <Route path="/debug/video" element={<VideoDebug />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/drafts" element={<DraftManager onClose={() => window.history.back()} />} />
          <Route path="/terms" element={<div className="text-center text-xl p-8">服务条款 - 开发中</div>} />
          <Route path="/privacy" element={<div className="text-center text-xl p-8">隐私政策 - 开发中</div>} />
          <Route path="/forgot-password" element={<div className="text-center text-xl p-8">忘记密码 - 开发中</div>} />
            </Routes>
          </Suspense>
          <TabNavigation />
          <NetworkStatusMonitor showIndicator={true} autoRepublish={true} />
          <ToastManager toasts={toasts} onRemove={removeToast} />
          <IncomingCallNotification />
          <Toaster position="top-center" richColors />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
