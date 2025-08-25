import React, { useState } from 'react';
import { ArrowLeft, CreditCard, TrendingUp, Download, Upload, Eye, EyeOff, MoreHorizontal, Plus, Minus, DollarSign, Bitcoin, Smartphone, Shield, X, Check, AlertTriangle, QrCode, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { ErrorDisplay } from '../components/ErrorBoundary';
import { useToast } from '../components/Toast';
// import { OptimizedTransactionItem, OptimizedEarningsItem } from '../components/OptimizedComponents';
import { VirtualTransactionList } from '../components/VirtualList';
import { usePerformance, useDebounce } from '../hooks/usePerformance';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

interface EarningsData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export default function Wallet() {
  const navigate = useNavigate();
  const { success, error: showError, warning, info } = useToast();
  const { renderTime } = usePerformance('Wallet');
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'earnings'>('overview');
  const [selectedCurrency, setSelectedCurrency] = useState('CNY');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const debouncedRechargeAmount = useDebounce(rechargeAmount, 300);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'alipay' | 'wechat' | 'bank' | 'crypto'>('alipay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // 模拟数据
  const balance = {
    CNY: 12580.50,
    USD: 1850.25,
    BTC: 0.0234,
    ETH: 0.8567
  };

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'income',
      amount: 288.50,
      currency: 'CNY',
      description: '直播打赏收入',
      timestamp: '2024-01-15 14:30',
      status: 'completed'
    },
    {
      id: '2',
      type: 'expense',
      amount: 99.00,
      currency: 'CNY',
      description: '广告推广费用',
      timestamp: '2024-01-15 10:15',
      status: 'completed'
    },
    {
      id: '3',
      type: 'income',
      amount: 156.80,
      currency: 'CNY',
      description: '视频创作奖励',
      timestamp: '2024-01-14 16:45',
      status: 'completed'
    },
    {
      id: '4',
      type: 'transfer',
      amount: 500.00,
      currency: 'CNY',
      description: '提现到银行卡',
      timestamp: '2024-01-14 09:20',
      status: 'pending'
    },
    {
      id: '5',
      type: 'income',
      amount: 45.20,
      currency: 'CNY',
      description: '电商佣金收入',
      timestamp: '2024-01-13 20:10',
      status: 'completed'
    }
  ];

  const earningsData: EarningsData[] = [
    { category: '直播打赏', amount: 3580.50, percentage: 45, color: 'bg-red-500' },
    { category: '视频创作', amount: 2240.80, percentage: 28, color: 'bg-blue-500' },
    { category: '电商佣金', amount: 1680.20, percentage: 21, color: 'bg-green-500' },
    { category: '广告分成', amount: 480.60, percentage: 6, color: 'bg-purple-500' }
  ];

  const formatCurrency = (amount: number, currency: string) => {
    switch (currency) {
      case 'CNY':
        return `¥${amount.toLocaleString()}`;
      case 'USD':
        return `$${amount.toLocaleString()}`;
      case 'BTC':
        return `₿${amount.toFixed(4)}`;
      case 'ETH':
        return `Ξ${amount.toFixed(4)}`;
      default:
        return `${amount.toLocaleString()} ${currency}`;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'expense':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'transfer':
        return <Upload className="w-4 h-4 text-blue-600" />;
      default:
        return <MoreHorizontal className="w-4 h-4 text-gray-600" />;
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

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      showError('请输入有效的充值金额');
      return;
    }

    if (parseFloat(rechargeAmount) < 1) {
      showError('充值金额不能少于1元');
      return;
    }

    if (parseFloat(rechargeAmount) > 50000) {
      warning('单次充值金额较大，请确认操作');
    }

    setIsProcessing(true);
    setOperationError(null);

    try {
      // 模拟支付处理
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.9) {
            reject(new Error('支付失败，请重试'));
          } else {
            resolve(true);
          }
        }, 3000);
      });

      success(`充值成功！已到账 ¥${rechargeAmount}`);
      setShowRechargeModal(false);
      setRechargeAmount('');
      setShowPaymentInfo(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '充值失败，请重试';
      setOperationError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setOperationError(null);

    try {
      // 模拟提现处理
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.85) {
            reject(new Error('提现失败，请检查银行卡信息'));
          } else {
            resolve(true);
          }
        }, 2000);
      });

      success('提现申请已提交，预计1-3个工作日到账');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提现失败，请重试';
      setOperationError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleTransfer = async () => {
    setIsTransferring(true);
    setOperationError(null);

    try {
      // 模拟转账处理
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.9) {
            reject(new Error('转账失败，请检查收款方信息'));
          } else {
            resolve(true);
          }
        }, 1500);
      });

      success('转账成功！');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '转账失败，请重试';
      setOperationError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsTransferring(false);
    }
  };

  const refreshBalance = async () => {
    setIsLoadingBalance(true);
    try {
      // 模拟刷新余额
      await new Promise(resolve => setTimeout(resolve, 1000));
      success('余额已刷新');
    } catch (error) {
      showError('刷新失败，请重试');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // 处理交易更多操作
  const handleTransactionMore = (transactionId: string) => {
    console.log('交易更多操作:', transactionId);
    // TODO: 显示交易详情或操作菜单
  };

  // 处理复制地址
  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      success('地址已复制到剪贴板');
    } catch (error) {
      showError('复制失败，请重试');
    }
  };

  // 处理快捷操作按钮点击
  const handleQuickAction = (action: string) => {
    console.log(`快捷操作: ${action}`);
    const actionNames = {
      mobile: '手机充值',
      card: '银行卡管理',
      security: '安全中心',
      investment: '理财产品'
    };
    
    const actionName = actionNames[action as keyof typeof actionNames] || action;
    info(`${actionName}功能开发中！`);
    
    switch (action) {
      case 'mobile':
        // TODO: 跳转到手机充值页面
        console.log('手机充值');
        break;
      case 'card':
        // TODO: 跳转到银行卡管理页面
        console.log('银行卡管理');
        break;
      case 'security':
        // TODO: 跳转到安全中心页面
        console.log('安全中心');
        break;
      case 'investment':
        // TODO: 跳转到理财页面
        console.log('理财产品');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-sm:pb-24">
      {/* 头部导航 */}
      <div className="bg-white px-3 max-sm:px-4 py-3 max-sm:py-4 flex items-center justify-between border-b pt-safe-top max-sm:pt-12">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 max-sm:p-2 hover:bg-gray-100 rounded-full transition-colors mr-1.5 max-sm:mr-2"
          >
            <ArrowLeft className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-gray-600" />
          </button>
          <h1 className="text-lg max-sm:text-xl font-semibold text-gray-800">我的钱包</h1>
        </div>
        <button 
          onClick={() => navigate('/crypto')}
          className="p-1.5 max-sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="加密货币中心"
        >
          <Bitcoin className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-orange-500" />
        </button>
      </div>

      {/* 余额卡片 */}
      <div className="p-3 max-sm:p-4">
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl max-sm:rounded-2xl p-4 max-sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3 max-sm:mb-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 max-sm:w-6 max-sm:h-6 mr-1.5 max-sm:mr-2" />
              <span className="text-base max-sm:text-lg font-medium">总余额</span>
              {isLoadingBalance && <LoadingSpinner size="sm" className="ml-1.5 max-sm:ml-2" />}
            </div>
            <div className="flex items-center space-x-1.5 max-sm:space-x-2">
              <button 
                onClick={refreshBalance}
                disabled={isLoadingBalance}
                className="p-1.5 max-sm:p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                title="刷新余额"
              >
                <TrendingUp className="w-4 h-4 max-sm:w-5 max-sm:h-5" />
              </button>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 max-sm:p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {showBalance ? <Eye className="w-4 h-4 max-sm:w-5 max-sm:h-5" /> : <EyeOff className="w-4 h-4 max-sm:w-5 max-sm:h-5" />}
              </button>
            </div>
          </div>
          
          <div className="mb-4 max-sm:mb-6">
            <div className="text-2xl max-sm:text-3xl font-bold mb-1.5 max-sm:mb-2">
              {showBalance ? formatCurrency(balance[selectedCurrency as keyof typeof balance], selectedCurrency) : '****'}
            </div>
            <div className="text-blue-100 text-xs max-sm:text-sm">约等于 ¥{showBalance ? balance.CNY.toLocaleString() : '****'}</div>
          </div>

          {/* 货币选择 */}
          <div className="flex space-x-1.5 max-sm:space-x-2 mb-4 max-sm:mb-6">
            {Object.keys(balance).map((currency) => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                className={`px-2.5 max-sm:px-3 py-1 rounded-full text-xs max-sm:text-sm font-medium transition-colors ${
                  selectedCurrency === currency
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>

          {/* 错误显示 */}
          {operationError && (
            <div className="mb-4">
              <ErrorDisplay 
                error={operationError} 
                onRetry={() => setOperationError(null)}
                variant="compact"
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-2 max-sm:space-x-3">
            <button 
              onClick={() => setShowRechargeModal(true)}
              disabled={isProcessing || isWithdrawing || isTransferring}
              className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg max-sm:rounded-xl py-2.5 max-sm:py-3 px-3 max-sm:px-4 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4 max-sm:w-5 max-sm:h-5 mr-1.5 max-sm:mr-2" />
              <span className="font-medium text-sm max-sm:text-base">充值</span>
            </button>
            <button 
              onClick={handleWithdraw}
              disabled={isProcessing || isWithdrawing || isTransferring}
              className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg max-sm:rounded-xl py-2.5 max-sm:py-3 px-3 max-sm:px-4 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWithdrawing ? (
                <LoadingSpinner size="sm" className="mr-1.5 max-sm:mr-2" />
              ) : (
                <Download className="w-4 h-4 max-sm:w-5 max-sm:h-5 mr-1.5 max-sm:mr-2" />
              )}
              <span className="font-medium text-sm max-sm:text-base">{isWithdrawing ? '提现中...' : '提现'}</span>
            </button>
            <button 
              onClick={handleTransfer}
              disabled={isProcessing || isWithdrawing || isTransferring}
              className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg max-sm:rounded-xl py-2.5 max-sm:py-3 px-3 max-sm:px-4 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTransferring ? (
                <LoadingSpinner size="sm" className="mr-1.5 max-sm:mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 max-sm:w-5 max-sm:h-5 mr-1.5 max-sm:mr-2" />
              )}
              <span className="font-medium text-sm max-sm:text-base">{isTransferring ? '转账中...' : '转账'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 功能快捷入口 */}
      <div className="px-3 max-sm:px-4 mb-3 max-sm:mb-4">
        <div className="bg-white rounded-lg max-sm:rounded-xl p-3 max-sm:p-4">
          <div className="grid grid-cols-4 gap-2 max-sm:gap-4">
            <button 
              onClick={() => handleQuickAction('mobile')}
              className="flex flex-col items-center p-2 max-sm:p-3 hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
            >
              <div className="w-10 h-10 max-sm:w-12 max-sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-1.5 max-sm:mb-2">
                <Smartphone className="w-5 h-5 max-sm:w-6 max-sm:h-6 text-blue-600" />
              </div>
              <span className="text-xs max-sm:text-sm text-gray-600">手机充值</span>
            </button>
            <button 
              onClick={() => handleQuickAction('card')}
              className="flex flex-col items-center p-2 max-sm:p-3 hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
            >
              <div className="w-10 h-10 max-sm:w-12 max-sm:h-12 bg-green-100 rounded-full flex items-center justify-center mb-1.5 max-sm:mb-2">
                <CreditCard className="w-5 h-5 max-sm:w-6 max-sm:h-6 text-green-600" />
              </div>
              <span className="text-xs max-sm:text-sm text-gray-600">银行卡</span>
            </button>
            <button 
              onClick={() => handleQuickAction('security')}
              className="flex flex-col items-center p-2 max-sm:p-3 hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
            >
              <div className="w-10 h-10 max-sm:w-12 max-sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mb-1.5 max-sm:mb-2">
                <Shield className="w-5 h-5 max-sm:w-6 max-sm:h-6 text-purple-600" />
              </div>
              <span className="text-xs max-sm:text-sm text-gray-600">安全中心</span>
            </button>
            <button 
              onClick={() => handleQuickAction('investment')}
              className="flex flex-col items-center p-2 max-sm:p-3 hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
            >
              <div className="w-10 h-10 max-sm:w-12 max-sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mb-1.5 max-sm:mb-2">
                <TrendingUp className="w-5 h-5 max-sm:w-6 max-sm:h-6 text-orange-600" />
              </div>
              <span className="text-xs max-sm:text-sm text-gray-600">理财</span>
            </button>
          </div>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="px-3 max-sm:px-4 mb-3 max-sm:mb-4">
        <div className="bg-white rounded-lg max-sm:rounded-xl p-1">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 max-sm:py-2 px-2 max-sm:px-4 rounded-lg text-xs max-sm:text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              概览
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 py-1.5 max-sm:py-2 px-2 max-sm:px-4 rounded-lg text-xs max-sm:text-sm font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              交易记录
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`flex-1 py-1.5 max-sm:py-2 px-2 max-sm:px-4 rounded-lg text-xs max-sm:text-sm font-medium transition-colors ${
                activeTab === 'earnings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              收益统计
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-3 max-sm:px-4">
        {activeTab === 'overview' && (
          <div className="space-y-3 max-sm:space-y-4">
            {/* 今日收益 */}
            <div className="bg-white rounded-lg max-sm:rounded-xl p-3 max-sm:p-4">
              <h3 className="text-base max-sm:text-lg font-semibold text-gray-800 mb-2 max-sm:mb-3">今日收益</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl max-sm:text-2xl font-bold text-green-600">+¥288.50</div>
                  <div className="text-xs max-sm:text-sm text-gray-500">较昨日 +12.5%</div>
                </div>
                <div className="w-12 h-12 max-sm:w-16 max-sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 max-sm:w-8 max-sm:h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* 最近交易 */}
            <div className="bg-white rounded-lg max-sm:rounded-xl p-3 max-sm:p-4">
              <div className="flex items-center justify-between mb-2 max-sm:mb-3">
                <h3 className="text-base max-sm:text-lg font-semibold text-gray-800">最近交易</h3>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="text-blue-600 text-xs max-sm:text-sm hover:text-blue-700"
                >
                  查看全部
                </button>
              </div>
              <div className="space-y-2 max-sm:space-y-3">
                {transactions.slice(0, 3).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      console.log('Transaction clicked:', transaction.id);
                      setActiveTab('transactions');
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg max-sm:rounded-xl p-3 max-sm:p-4">
            <h3 className="text-base max-sm:text-lg font-semibold text-gray-800 mb-3 max-sm:mb-4">交易记录</h3>
            <VirtualTransactionList 
              transactions={transactions}
              onTransactionClick={(transaction) => {
                console.log('Transaction clicked:', transaction);
                // 这里可以添加交易详情查看逻辑
              }}
              className="border border-gray-100 rounded-lg"
            />
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-3 max-sm:space-y-4">
            {/* 收益概览 */}
            <div className="bg-white rounded-lg max-sm:rounded-xl p-3 max-sm:p-4">
              <h3 className="text-base max-sm:text-lg font-semibold text-gray-800 mb-3 max-sm:mb-4">本月收益统计</h3>
              <div className="text-center mb-4 max-sm:mb-6">
                <div className="text-2xl max-sm:text-3xl font-bold text-gray-800 mb-1">¥7,982.10</div>
                <div className="text-xs max-sm:text-sm text-gray-500">总收益</div>
              </div>
              
              {/* 收益分布 */}
               <div className="space-y-2 max-sm:space-y-3">
                 {earningsData.map((item, index) => (
                   <div
                     key={index}
                     className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                   >
                     <span className="text-sm font-medium">{item.category}</span>
                     <span className="text-sm text-gray-600">${item.amount}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* 收益趋势 */}
            <div className="bg-white rounded-lg max-sm:rounded-xl p-3 max-sm:p-4">
              <h3 className="text-base max-sm:text-lg font-semibold text-gray-800 mb-3 max-sm:mb-4">收益趋势</h3>
              <div className="h-24 max-sm:h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <TrendingUp className="w-6 h-6 max-sm:w-8 max-sm:h-8 mx-auto mb-1 max-sm:mb-2" />
                  <div className="text-xs max-sm:text-sm">收益趋势图表</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 充值弹窗 */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 max-sm:p-4">
          <div className="bg-white rounded-xl max-sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-4 max-sm:p-6 border-b">
              <h2 className="text-lg max-sm:text-xl font-semibold text-gray-800">钱包充值</h2>
              <button 
                onClick={() => {
                  setShowRechargeModal(false);
                  setShowPaymentInfo(false);
                  setRechargeAmount('');
                  setIsProcessing(false);
                }}
                className="p-1.5 max-sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-gray-600" />
              </button>
            </div>

            {!showPaymentInfo ? (
              <div className="p-4 max-sm:p-6">
                {/* 充值金额 */}
                <div className="mb-4 max-sm:mb-6">
                  <label className="block text-xs max-sm:text-sm font-medium text-gray-700 mb-1.5 max-sm:mb-2">充值金额</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="请输入充值金额"
                      className="w-full px-3 max-sm:px-4 py-2.5 max-sm:py-3 border border-gray-300 rounded-lg max-sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base max-sm:text-lg"
                    />
                    <span className="absolute right-3 max-sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm max-sm:text-base">¥</span>
                  </div>
                  {/* 快捷金额 */}
                  <div className="flex flex-wrap gap-1.5 max-sm:gap-2 mt-2 max-sm:mt-3">
                    {[100, 200, 500, 1000, 2000, 5000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setRechargeAmount(amount.toString())}
                        className="px-3 max-sm:px-4 py-1.5 max-sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-md max-sm:rounded-lg text-xs max-sm:text-sm font-medium transition-colors"
                      >
                        ¥{amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 支付方式 */}
                <div className="mb-4 max-sm:mb-6">
                  <label className="block text-xs max-sm:text-sm font-medium text-gray-700 mb-2 max-sm:mb-3">支付方式</label>
                  <div className="space-y-2 max-sm:space-y-3">
                    <button
                      onClick={() => setSelectedPaymentMethod('alipay')}
                      className={`w-full p-3 max-sm:p-4 border rounded-lg max-sm:rounded-xl flex items-center justify-between transition-colors ${
                        selectedPaymentMethod === 'alipay'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 max-sm:w-10 max-sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2.5 max-sm:mr-3">
                          <Smartphone className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm max-sm:text-base font-medium text-gray-800">支付宝</div>
                          <div className="text-xs max-sm:text-sm text-gray-500">推荐使用，到账快速</div>
                        </div>
                      </div>
                      {selectedPaymentMethod === 'alipay' && (
                        <Check className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-blue-600" />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedPaymentMethod('wechat')}
                      className={`w-full p-3 max-sm:p-4 border rounded-lg max-sm:rounded-xl flex items-center justify-between transition-colors ${
                        selectedPaymentMethod === 'wechat'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 max-sm:w-10 max-sm:h-10 bg-green-100 rounded-full flex items-center justify-center mr-2.5 max-sm:mr-3">
                          <Smartphone className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm max-sm:text-base font-medium text-gray-800">微信支付</div>
                          <div className="text-xs max-sm:text-sm text-gray-500">安全便捷，实时到账</div>
                        </div>
                      </div>
                      {selectedPaymentMethod === 'wechat' && (
                        <Check className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-green-600" />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedPaymentMethod('bank')}
                      className={`w-full p-3 max-sm:p-4 border rounded-lg max-sm:rounded-xl flex items-center justify-between transition-colors ${
                        selectedPaymentMethod === 'bank'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 max-sm:w-10 max-sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mr-2.5 max-sm:mr-3">
                          <CreditCard className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm max-sm:text-base font-medium text-gray-800">银行卡</div>
                          <div className="text-xs max-sm:text-sm text-gray-500">支持各大银行储蓄卡</div>
                        </div>
                      </div>
                      {selectedPaymentMethod === 'bank' && (
                        <Check className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-purple-600" />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedPaymentMethod('crypto')}
                      className={`w-full p-3 max-sm:p-4 border rounded-lg max-sm:rounded-xl flex items-center justify-between transition-colors ${
                        selectedPaymentMethod === 'crypto'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 max-sm:w-10 max-sm:h-10 bg-orange-100 rounded-full flex items-center justify-center mr-2.5 max-sm:mr-3">
                          <Bitcoin className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-orange-600" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm max-sm:text-base font-medium text-gray-800">数字货币</div>
                          <div className="text-xs max-sm:text-sm text-gray-500">BTC、ETH、USDT</div>
                        </div>
                      </div>
                      {selectedPaymentMethod === 'crypto' && (
                        <Check className="w-4 h-4 max-sm:w-5 max-sm:h-5 text-orange-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 错误显示 */}
                {operationError && (
                  <div className="mb-3 max-sm:mb-4">
                    <ErrorDisplay 
                      error={operationError} 
                      onRetry={() => setOperationError(null)}
                      variant="compact"
                    />
                  </div>
                )}

                {/* 确认按钮 */}
                <button
                  onClick={() => {
                    if (rechargeAmount && parseFloat(rechargeAmount) > 0) {
                      setOperationError(null);
                      setShowPaymentInfo(true);
                    }
                  }}
                  disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0 || isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 max-sm:py-3 rounded-lg max-sm:rounded-xl transition-colors text-sm max-sm:text-base"
                >
                  确认充值 ¥{rechargeAmount || '0'}
                </button>
              </div>
            ) : (
              <div className="p-4 max-sm:p-6">
                {/* 支付信息页面 */}
                <div className="text-center mb-4 max-sm:mb-6">
                  <div className="text-xl max-sm:text-2xl font-bold text-gray-800 mb-1.5 max-sm:mb-2">¥{rechargeAmount}</div>
                  <div className="text-xs max-sm:text-sm text-gray-500">
                    {selectedPaymentMethod === 'alipay' && '支付宝充值'}
                    {selectedPaymentMethod === 'wechat' && '微信支付充值'}
                    {selectedPaymentMethod === 'bank' && '银行卡充值'}
                    {selectedPaymentMethod === 'crypto' && '数字货币充值'}
                  </div>
                </div>

                {/* 支付信息 */}
                {selectedPaymentMethod === 'alipay' && (
                  <div className="space-y-3 max-sm:space-y-4">
                    <div className="bg-blue-50 rounded-lg max-sm:rounded-xl p-3 max-sm:p-4 text-center">
                      <QrCode className="w-24 h-24 max-sm:w-32 max-sm:h-32 mx-auto mb-3 max-sm:mb-4 text-blue-600" />
                      <div className="text-xs max-sm:text-sm text-gray-600 mb-1.5 max-sm:mb-2">请使用支付宝扫描二维码支付</div>
                      <div className="text-xs text-gray-500">订单号：{Date.now()}</div>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'wechat' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <QrCode className="w-32 h-32 mx-auto mb-4 text-green-600" />
                      <div className="text-sm text-gray-600 mb-2">请使用微信扫描二维码支付</div>
                      <div className="text-xs text-gray-500">订单号：{Date.now()}</div>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'bank' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">收款账户信息</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">收款人：</span>
                          <span className="font-medium">光闪科技有限公司</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">开户行：</span>
                          <span className="font-medium">中国工商银行</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">账号：</span>
                          <div className="flex items-center">
                            <span className="font-medium mr-2">6222 0202 0000 1234 567</span>
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">转账备注：</span>
                          <span className="font-medium text-red-600">充值-{Date.now()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <div className="font-medium mb-1">重要提醒</div>
                          <div>请务必在转账备注中填写订单号，否则无法自动到账</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'crypto' && (
                  <div className="space-y-4">
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">数字货币充值地址</div>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="text-xs text-gray-500 mb-1">USDT (TRC20)</div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm break-all">TQn9Y2khEsLMWuBDaqzoeQjHp2SS7K6...</span>
                            <button 
                              onClick={() => handleCopyAddress('TQn9Y2khEsLMWuBDaqzoeQjHp2SS7K6...')}
                              className="p-1 hover:bg-gray-100 rounded ml-2"
                            >
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="text-xs text-gray-500 mb-1">BTC</div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm break-all">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</span>
                            <button 
                              onClick={() => handleCopyAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')}
                              className="p-1 hover:bg-gray-100 rounded ml-2"
                            >
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                        <div className="text-sm text-red-800">
                          <div className="font-medium mb-1">安全提醒</div>
                          <div>请确认网络类型，转错网络将导致资产丢失</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 支付错误显示 */}
                {operationError && (
                  <div className="mb-4">
                    <ErrorDisplay 
                      error={operationError} 
                      onRetry={() => setOperationError(null)}
                      variant="compact"
                    />
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPaymentInfo(false);
                      setOperationError(null);
                    }}
                    disabled={isProcessing}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    返回修改
                  </button>
                  <button
                    onClick={handleRecharge}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        处理中...
                      </>
                    ) : (
                      '确认支付'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}