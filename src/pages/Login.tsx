import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useFormValidation, validationRules } from '../utils/validation';
import { FieldFeedback, ActionFeedback } from '../components/UserFeedback';
import { useToast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const {
    data,
    errors,
    touched,
    updateField,
    touchField,
    validateAll
  } = useFormValidation(
    { email: '', password: '' },
    {
      email: validationRules.email,
      password: validationRules.password
    }
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAll();
    if (!validation.isValid) {
      showError('请检查输入信息');
      return;
    }
    
    setIsLoading(true);
    setSubmitError('');

    try {
      // 模拟登录API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟登录成功
      if (data.email === 'test@example.com' && data.password === 'password') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', data.email);
        success('登录成功！');
        setTimeout(() => navigate('/'), 1000);
      } else {
        setSubmitError('邮箱或密码错误，请检查后重试');
      }
    } catch (err) {
      setSubmitError('登录失败，请检查网络连接后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理Google登录
  const handleGoogleLogin = async () => {
    console.log('Google登录');
    setIsLoading(true);
    try {
      // TODO: 集成Google OAuth
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', 'google@example.com');
      success('Google登录成功！正在跳转...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      showError('Google登录失败，请重试');
      setSubmitError('Google登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理Apple登录
  const handleAppleLogin = async () => {
    console.log('Apple登录');
    setIsLoading(true);
    try {
      // TODO: 集成Apple Sign In
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', 'apple@example.com');
      success('Apple登录成功！正在跳转...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      showError('Apple登录失败，请重试');
      setSubmitError('Apple登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 pt-12">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">登录</h1>
        <div className="w-10" /> {/* 占位符保持居中 */}
      </div>

      {/* 主要内容 */}
      <div className="flex-1 flex flex-col justify-center px-6">
        {/* Logo区域 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">光</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎回来</h2>
          <p className="text-gray-600">登录您的账户继续使用</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* 邮箱输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
              type="email"
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() => touchField('email')}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                touched.email && errors.email 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
              placeholder="请输入邮箱地址"
              required
            />
            <FieldFeedback error={touched.email ? errors.email : undefined} />
            </div>
          </div>

          {/* 密码输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
              type={showPassword ? 'text' : 'password'}
              value={data.password}
              onChange={(e) => updateField('password', e.target.value)}
              onBlur={() => touchField('password')}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                touched.password && errors.password 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
              placeholder="请输入密码"
              required
            />
            <FieldFeedback error={touched.password ? errors.password : undefined} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 错误信息 */}
          <ActionFeedback 
            isLoading={isLoading}
            error={submitError}
            onRetry={() => setSubmitError('')}
            className="mb-4"
          />

          {/* 忘记密码 */}
          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              忘记密码？
            </Link>
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={isLoading || !data.email || !data.password}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                登录中...
              </div>
            ) : (
              '登录'
            )}
          </button>
        </form>

        {/* 分割线 */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300" />
          <span className="px-4 text-sm text-gray-500">或</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        {/* 第三方登录 */}
        <div className="space-y-3">
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img 
              src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=google%20logo%20icon&image_size=square" 
              alt="Google" 
              className="w-5 h-5 mr-3" 
            />
            <span className="text-gray-700 font-medium">使用 Google 登录</span>
          </button>
          
          <button 
            onClick={handleAppleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img 
              src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=apple%20logo%20icon&image_size=square" 
              alt="Apple" 
              className="w-5 h-5 mr-3" 
            />
            <span className="text-gray-700 font-medium">使用 Apple 登录</span>
          </button>
        </div>

        {/* 注册链接 */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            还没有账户？{' '}
            <Link 
              to="/register" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              立即注册
            </Link>
          </p>
        </div>

        {/* 测试提示 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>测试账户：</strong><br />
            邮箱：test@example.com<br />
            密码：password
          </p>
        </div>
      </div>
    </div>
  );
}