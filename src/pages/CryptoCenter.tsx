import React, { useState } from 'react';
import { ArrowLeft, Bitcoin, DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, Shield, Eye, EyeOff, RefreshCw, Plus, Minus, History, Settings, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  value: number;
  price: number;
  change24h: number;
  icon: string;
}

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'send' | 'receive' | 'convert';
  asset: string;
  amount: number;
  value: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  hash?: string;
  fee?: number;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  change: number;
}

export default function CryptoCenter() {
  const navigate = useNavigate();
  const { success, info, error } = useToast();
  const [activeTab, setActiveTab] = useState<'wallet' | 'exchange' | 'history' | 'security'>('wallet');
  const [showBalance, setShowBalance] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('ETH');

  // 模拟加密货币资产
  const cryptoAssets: CryptoAsset[] = [
    {
      id: 'BTC',
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 0.05234,
      value: 2340.56,
      price: 44720.30,
      change24h: 2.45,
      icon: '₿'
    },
    {
      id: 'ETH',
      symbol: 'ETH',
      name: 'Ethereum',
      balance: 1.2456,
      value: 2890.34,
      price: 2321.45,
      change24h: -1.23,
      icon: 'Ξ'
    },
    {
      id: 'USDT',
      symbol: 'USDT',
      name: 'Tether',
      balance: 1500.00,
      value: 1500.00,
      price: 1.00,
      change24h: 0.01,
      icon: '₮'
    },
    {
      id: 'BNB',
      symbol: 'BNB',
      name: 'Binance Coin',
      balance: 5.6789,
      value: 1456.78,
      price: 256.45,
      change24h: 3.67,
      icon: 'B'
    }
  ];

  // 模拟交易记录
  const transactions: Transaction[] = [
    {
      id: 'TX001',
      type: 'buy',
      asset: 'BTC',
      amount: 0.01,
      value: 447.20,
      status: 'completed',
      timestamp: '2024-01-15 14:30',
      hash: '0x1234...5678',
      fee: 2.50
    },
    {
      id: 'TX002',
      type: 'convert',
      asset: 'ETH',
      amount: 0.5,
      value: 1160.73,
      status: 'completed',
      timestamp: '2024-01-15 12:15',
      hash: '0x2345...6789',
      fee: 5.80
    },
    {
      id: 'TX003',
      type: 'send',
      asset: 'USDT',
      amount: 500,
      value: 500.00,
      status: 'pending',
      timestamp: '2024-01-15 10:45',
      hash: '0x3456...7890',
      fee: 1.00
    },
    {
      id: 'TX004',
      type: 'receive',
      asset: 'BNB',
      amount: 2.0,
      value: 512.90,
      status: 'completed',
      timestamp: '2024-01-14 16:20',
      hash: '0x4567...8901'
    }
  ];

  // 模拟汇率数据
  const exchangeRates: ExchangeRate[] = [
    { from: 'BTC', to: 'ETH', rate: 19.26, change: 1.45 },
    { from: 'BTC', to: 'USDT', rate: 44720.30, change: 2.45 },
    { from: 'ETH', to: 'BTC', rate: 0.0519, change: -1.23 },
    { from: 'ETH', to: 'USDT', rate: 2321.45, change: -1.23 },
    { from: 'USDT', to: 'BTC', rate: 0.0000224, change: -2.45 },
    { from: 'USDT', to: 'ETH', rate: 0.000431, change: 1.23 }
  ];

  const totalValue = cryptoAssets.reduce((sum, asset) => sum + asset.value, 0);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatCrypto = (amount: number, decimals: number = 6): string => {
    return amount.toFixed(decimals);
  };

  const getChangeColor = (change: number): string => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy': return <Plus className="w-4 h-4 text-green-600" />;
      case 'sell': return <Minus className="w-4 h-4 text-red-600" />;
      case 'send': return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      case 'receive': return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'convert': return <RefreshCw className="w-4 h-4 text-purple-600" />;
      default: return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionText = (type: string): string => {
    switch (type) {
      case 'buy': return '买入';
      case 'sell': return '卖出';
      case 'send': return '发送';
      case 'receive': return '接收';
      case 'convert': return '兑换';
      default: return '未知';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed': return '已完成';
      case 'pending': return '处理中';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  const getCurrentRate = (): number => {
    const rate = exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency);
    return rate ? rate.rate : 0;
  };

  const calculateExchange = (): number => {
    const amount = parseFloat(exchangeAmount) || 0;
    return amount * getCurrentRate();
  };

  // 事件处理函数
  const handleRefresh = () => {
    info('正在刷新数据...');
    // 这里可以添加刷新数据的逻辑
  };

  const handleSettings = () => {
    info('打开设置页面');
    // 这里可以添加跳转到设置页面的逻辑
  };

  const handleBuy = () => {
    info('跳转到买入页面');
    // 这里可以添加跳转到买入页面的逻辑
  };

  const handleSell = () => {
    info('跳转到卖出页面');
    // 这里可以添加跳转到卖出页面的逻辑
  };

  const handleMaxAmount = () => {
    const selectedAssetData = cryptoAssets.find(asset => asset.symbol === fromCurrency);
    if (selectedAssetData) {
      setExchangeAmount(selectedAssetData.balance.toString());
      info(`已设置为最大可用余额: ${selectedAssetData.balance} ${fromCurrency}`);
    }
  };

  const handleExchange = () => {
    if (!exchangeAmount || parseFloat(exchangeAmount) <= 0) {
      error('请输入有效的兑换数量');
      return;
    }
    success(`兑换成功: ${exchangeAmount} ${fromCurrency} → ${calculateExchange().toFixed(6)} ${toCurrency}`);
    setExchangeAmount('');
    // 这里可以添加实际的兑换逻辑
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部导航 */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">加密货币中心</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={handleSettings}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'wallet'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            钱包
          </button>
          <button
            onClick={() => setActiveTab('exchange')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'exchange'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            兑换
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            历史
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            安全
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'wallet' && (
          <div>
            {/* 总资产 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Wallet className="w-6 h-6 mr-2" />
                  <span className="text-lg font-semibold">总资产</span>
                </div>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-3xl font-bold mb-2">
                {showBalance ? formatCurrency(totalValue) : '****'}
              </div>
              <div className="text-sm opacity-90">
                约 {showBalance ? formatCurrency(totalValue * 0.14) : '****'} USD
              </div>
            </div>

            {/* 资产列表 */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">我的资产</h3>
              </div>
              <div className="divide-y">
                {cryptoAssets.map((asset) => (
                  <div key={asset.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {asset.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{asset.name}</div>
                          <div className="text-sm text-gray-500">{asset.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800">
                          {showBalance ? formatCurrency(asset.value) : '****'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {showBalance ? formatCrypto(asset.balance, 6) : '****'} {asset.symbol}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-gray-600">
                        {formatCurrency(asset.price)}
                      </div>
                      <div className={`flex items-center text-sm ${getChangeColor(asset.change24h)}`}>
                        {getChangeIcon(asset.change24h)}
                        <span className="ml-1">{asset.change24h > 0 ? '+' : ''}{asset.change24h.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button 
                onClick={handleBuy}
                className="bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                买入
              </button>
              <button 
                onClick={handleSell}
                className="bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                卖出
              </button>
            </div>
          </div>
        )}

        {activeTab === 'exchange' && (
          <div>
            {/* 汇率转换器 */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">货币兑换</h3>
              
              {/* 兑换输入 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">兑换数量</label>
                  <div className="flex">
                    <select 
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {cryptoAssets.map(asset => (
                        <option key={asset.id} value={asset.symbol}>{asset.symbol}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={exchangeAmount}
                      onChange={(e) => setExchangeAmount(e.target.value)}
                      placeholder="输入数量"
                      className="flex-1 px-3 py-2 border-t border-b border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button 
                      onClick={handleMaxAmount}
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                    >
                      最大
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button 
                    onClick={() => {
                      const temp = fromCurrency;
                      setFromCurrency(toCurrency);
                      setToCurrency(temp);
                    }}
                    className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">兑换结果</label>
                  <div className="flex">
                    <select 
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {cryptoAssets.map(asset => (
                        <option key={asset.id} value={asset.symbol}>{asset.symbol}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={calculateExchange().toFixed(6)}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>
              
              {/* 汇率信息 */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <span>汇率：1 {fromCurrency} = {getCurrentRate().toFixed(6)} {toCurrency}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  预估手续费：0.1%
                </div>
              </div>
              
              <button 
                onClick={handleExchange}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium mt-4 hover:bg-blue-700 transition-colors"
              >
                立即兑换
              </button>
            </div>

            {/* 实时汇率 */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">实时汇率</h3>
              <div className="space-y-3">
                {exchangeRates.slice(0, 6).map((rate, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{rate.from}/{rate.to}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-800 mr-2">
                        {rate.rate.toFixed(6)}
                      </span>
                      <div className={`flex items-center text-xs ${getChangeColor(rate.change)}`}>
                        {getChangeIcon(rate.change)}
                        <span className="ml-1">{rate.change > 0 ? '+' : ''}{rate.change.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {/* 交易历史 */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">交易历史</h3>
              </div>
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {getTransactionIcon(tx.type)}
                        <div className="ml-3">
                          <div className="font-medium text-gray-800">
                            {getTransactionText(tx.type)} {tx.asset}
                          </div>
                          <div className="text-sm text-gray-500">{tx.timestamp}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800">
                          {tx.type === 'buy' || tx.type === 'receive' ? '+' : '-'}
                          {formatCrypto(tx.amount)} {tx.asset}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(tx.value)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                          {getStatusText(tx.status)}
                        </span>
                        {tx.hash && (
                          <span className="ml-2 text-xs text-gray-500">
                            {tx.hash}
                          </span>
                        )}
                      </div>
                      {tx.fee && (
                        <div className="text-xs text-gray-500">
                          手续费: {formatCurrency(tx.fee)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            {/* 安全设置 */}
            <div className="bg-white rounded-xl overflow-hidden mb-6">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">安全设置</h3>
              </div>
              <div className="divide-y">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-800">交易密码</div>
                      <div className="text-sm text-gray-500">保护您的交易安全</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm text-green-600">已设置</span>
                  </div>
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-800">双重验证</div>
                      <div className="text-sm text-gray-500">增强账户安全性</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm text-green-600">已启用</span>
                  </div>
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-800">风险控制</div>
                      <div className="text-sm text-gray-500">异常交易监控</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm text-green-600">已启用</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 安全提示 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">安全提示</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 请妥善保管您的私钥和助记词</li>
                    <li>• 不要在不安全的网络环境下进行交易</li>
                    <li>• 定期检查账户异常活动</li>
                    <li>• 启用所有可用的安全功能</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}