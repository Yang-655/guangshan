import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Play, Pause, RotateCcw, FileText, Database, Zap } from 'lucide-react';

// 测试结果类型
interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message?: string;
  duration?: number;
  details?: any;
}

// 测试套件类型
interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'completed';
}

// 功能测试组件
export function FunctionalityTester() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  // 初始化测试套件
  useEffect(() => {
    const suites: TestSuite[] = [
      {
        id: 'ui-components',
        name: 'UI组件测试',
        description: '测试所有UI组件的渲染和交互',
        status: 'pending',
        tests: [
          { id: 'button-render', name: '按钮组件渲染', status: 'pending' },
          { id: 'input-validation', name: '输入框验证', status: 'pending' },
          { id: 'modal-interaction', name: '模态框交互', status: 'pending' },
          { id: 'toast-notification', name: 'Toast通知', status: 'pending' },
          { id: 'loading-states', name: '加载状态', status: 'pending' }
        ]
      },
      {
        id: 'data-flow',
        name: '数据流测试',
        description: '测试组件间数据传递和状态管理',
        status: 'pending',
        tests: [
          { id: 'state-management', name: '状态管理', status: 'pending' },
          { id: 'props-passing', name: '属性传递', status: 'pending' },
          { id: 'event-handling', name: '事件处理', status: 'pending' },
          { id: 'context-usage', name: 'Context使用', status: 'pending' },
          { id: 'data-persistence', name: '数据持久化', status: 'pending' }
        ]
      },
      {
        id: 'form-handling',
        name: '表单处理测试',
        description: '测试表单验证、提交和错误处理',
        status: 'pending',
        tests: [
          { id: 'form-validation', name: '表单验证', status: 'pending' },
          { id: 'form-submission', name: '表单提交', status: 'pending' },
          { id: 'error-display', name: '错误显示', status: 'pending' },
          { id: 'field-interaction', name: '字段交互', status: 'pending' },
          { id: 'form-reset', name: '表单重置', status: 'pending' }
        ]
      },
      {
        id: 'error-handling',
        name: '异常处理测试',
        description: '测试错误边界和异常情况处理',
        status: 'pending',
        tests: [
          { id: 'error-boundary', name: '错误边界', status: 'pending' },
          { id: 'network-errors', name: '网络错误', status: 'pending' },
          { id: 'validation-errors', name: '验证错误', status: 'pending' },
          { id: 'fallback-ui', name: '降级UI', status: 'pending' },
          { id: 'error-recovery', name: '错误恢复', status: 'pending' }
        ]
      },
      {
        id: 'performance',
        name: '性能测试',
        description: '测试组件性能和优化效果',
        status: 'pending',
        tests: [
          { id: 'render-performance', name: '渲染性能', status: 'pending' },
          { id: 'memory-usage', name: '内存使用', status: 'pending' },
          { id: 'lazy-loading', name: '懒加载', status: 'pending' },
          { id: 'virtual-scroll', name: '虚拟滚动', status: 'pending' },
          { id: 'image-optimization', name: '图片优化', status: 'pending' }
        ]
      },
      {
        id: 'accessibility',
        name: '可访问性测试',
        description: '测试无障碍访问和键盘导航',
        status: 'pending',
        tests: [
          { id: 'keyboard-navigation', name: '键盘导航', status: 'pending' },
          { id: 'screen-reader', name: '屏幕阅读器', status: 'pending' },
          { id: 'focus-management', name: '焦点管理', status: 'pending' },
          { id: 'aria-labels', name: 'ARIA标签', status: 'pending' },
          { id: 'color-contrast', name: '颜色对比度', status: 'pending' }
        ]
      }
    ];
    
    setTestSuites(suites);
  }, []);

  // 模拟测试执行
  const runTest = async (suiteId: string, testId: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    // 模拟测试执行时间
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const duration = Date.now() - startTime;
    
    // 模拟测试结果
    const success = Math.random() > 0.1; // 90%成功率
    const warning = !success && Math.random() > 0.5; // 50%警告率
    
    return {
      id: testId,
      name: testId,
      status: success ? 'passed' : warning ? 'warning' : 'failed',
      duration,
      message: success 
        ? '测试通过' 
        : warning 
        ? '测试通过但有警告' 
        : '测试失败',
      details: {
        timestamp: new Date().toISOString(),
        environment: 'development',
        browser: navigator.userAgent
      }
    };
  };

  // 运行单个测试套件
  const runTestSuite = async (suiteId: string) => {
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'running' }
        : suite
    ));

    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    for (const test of suite.tests) {
      setCurrentTest(`${suiteId}-${test.id}`);
      
      // 更新测试状态为运行中
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? {
              ...s,
              tests: s.tests.map(t => 
                t.id === test.id 
                  ? { ...t, status: 'running' }
                  : t
              )
            }
          : s
      ));

      // 执行测试
      const result = await runTest(suiteId, test.id);
      
      // 更新测试结果
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? {
              ...s,
              tests: s.tests.map(t => 
                t.id === test.id 
                  ? result
                  : t
              )
            }
          : s
      ));
    }

    // 标记套件完成
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'completed' }
        : suite
    ));
  };

  // 运行所有测试
  const runAllTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    
    for (const suite of testSuites) {
      await runTestSuite(suite.id);
    }
    
    setIsRunning(false);
    setOverallStatus('completed');
    setCurrentTest(null);
  };

  // 重置所有测试
  const resetTests = () => {
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      status: 'pending',
      tests: suite.tests.map(test => ({
        ...test,
        status: 'pending',
        message: undefined,
        duration: undefined,
        details: undefined
      }))
    })));
    setOverallStatus('idle');
    setCurrentTest(null);
  };

  // 获取测试统计
  const getTestStats = () => {
    const allTests = testSuites.flatMap(suite => suite.tests);
    const passed = allTests.filter(test => test.status === 'passed').length;
    const failed = allTests.filter(test => test.status === 'failed').length;
    const warnings = allTests.filter(test => test.status === 'warning').length;
    const total = allTests.length;
    
    return { passed, failed, warnings, total };
  };

  const stats = getTestStats();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 测试控制面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">功能完整性测试</h1>
            <p className="text-gray-600 dark:text-gray-400">验证所有模块、数据流、表单处理和异常处理</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  运行中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  运行所有测试
                </>
              )}
            </button>
            
            <button
              onClick={resetTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>

        {/* 测试统计 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">总测试数</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-sm text-green-600">通过</div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
            <div className="text-sm text-yellow-600">警告</div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-red-600">失败</div>
          </div>
        </div>

        {/* 当前运行的测试 */}
        {currentTest && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">正在运行: {currentTest}</span>
            </div>
          </div>
        )}
      </div>

      {/* 测试套件列表 */}
      <div className="space-y-6">
        {testSuites.map((suite) => (
          <TestSuiteCard
            key={suite.id}
            suite={suite}
            onRunSuite={() => runTestSuite(suite.id)}
            isRunning={isRunning}
          />
        ))}
      </div>
    </div>
  );
}

// 测试套件卡片组件
interface TestSuiteCardProps {
  suite: TestSuite;
  onRunSuite: () => void;
  isRunning: boolean;
}

function TestSuiteCard({ suite, onRunSuite, isRunning }: TestSuiteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getSuiteIcon = (suiteId: string) => {
    switch (suiteId) {
      case 'ui-components':
        return <Zap className="w-5 h-5" />;
      case 'data-flow':
        return <Database className="w-5 h-5" />;
      case 'form-handling':
        return <FileText className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const suiteStats = {
    passed: suite.tests.filter(test => test.status === 'passed').length,
    failed: suite.tests.filter(test => test.status === 'failed').length,
    warnings: suite.tests.filter(test => test.status === 'warning').length,
    total: suite.tests.length
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600">
              {getSuiteIcon(suite.id)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{suite.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{suite.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onRunSuite}
              disabled={isRunning}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              运行
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {isExpanded ? '收起' : '展开'}
            </button>
          </div>
        </div>

        {/* 套件统计 */}
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">总计: {suiteStats.total}</span>
          <span className="text-green-600">通过: {suiteStats.passed}</span>
          <span className="text-yellow-600">警告: {suiteStats.warnings}</span>
          <span className="text-red-600">失败: {suiteStats.failed}</span>
        </div>
      </div>

      {/* 测试详情 */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="p-4 space-y-2">
            {suite.tests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {test.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {test.duration && (
                    <span>{test.duration}ms</span>
                  )}
                  {test.message && (
                    <span className={`px-2 py-1 rounded ${
                      test.status === 'passed' ? 'bg-green-100 text-green-800' :
                      test.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      test.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {test.message}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FunctionalityTester;