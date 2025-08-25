import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormValidation, validationRules, checkPasswordStrength } from '../utils/validation';
import { FieldFeedback, ActionFeedback, InlineFeedback } from '../components/UserFeedback';
import { useToast } from '../components/Toast';

export default function Register() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const {
    data: formData,
    errors,
    touched,
    updateField,
    touchField,
    validateAll
  } = useFormValidation(
    {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    {
      username: validationRules.username,
      email: validationRules.email,
      password: validationRules.password,
      confirmPassword: {
        required: true,
        custom: (value: string) => {
          if (!value) return '请确认密码';
          if (value !== formData.password) return '两次输入的密码不一致';
          return null;
        }
      }
    }
  );
  
  const passwordStrength = checkPasswordStrength(formData.password);

  // 移除旧的验证函数，使用新的验证系统

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAll();
    if (!validation.isValid) {
      showError('请检查输入信息');
      return;
    }
    
    if (passwordStrength.level === 'weak') {
      showError('密码强度太弱，请使用更复杂的密码');
      return;
    }

    setIsLoading(true);
    setSubmitError('');

    try {
      // 模拟注册API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟发送验证邮件
      success('注册成功！验证邮件已发送到您的邮箱');
      setStep('verify');
    } catch (err) {
      setSubmitError('注册失败，请检查网络连接后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      showError('请输入验证码');
      return;
    }
    
    if (!/^\d{6}$/.test(verificationCode)) {
      showError('验证码必须是6位数字');
      return;
    }

    setIsVerifying(true);
    setSubmitError('');

    try {
      // 模拟验证API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟验证成功
      if (verificationCode === '123456') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', formData.email);
        success('验证成功！欢迎加入光闪');
        setTimeout(() => navigate('/'), 1000);
      } else {
        setSubmitError('验证码错误，请重新输入');
      }
    } catch (err) {
      setSubmitError('验证失败，请检查网络连接后重试');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      // 模拟重发验证码
      await new Promise(resolve => setTimeout(resolve, 1000));
      success('验证码已重新发送到您的邮箱');
    } catch (err) {
      showError('重发失败，请稍后重试');
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 pt-12">
          <button 
            onClick={() => setStep('register')}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">邮箱验证</h1>
          <div className="w-10" />
        </div>

        {/* 验证内容 */}
        <div className="flex-1 flex flex-col justify-center px-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">验证您的邮箱</h2>
            <p className="text-gray-600 mb-4">
              我们已向 <span className="font-medium text-gray-800">{formData.email}</span> 发送了验证码
            </p>
            <p className="text-sm text-gray-500">
              请查看您的邮箱并输入6位验证码
            </p>
          </div>

          <form onSubmit={handleVerification} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                验证码
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            {/* 验证反馈 */}
            <ActionFeedback 
              isLoading={isVerifying}
              error={submitError}
              onRetry={() => setSubmitError('')}
              className="mb-4"
            />

            <button
              type="submit"
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isVerifying ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  验证中...
                </div>
              ) : (
                '验证邮箱'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm mb-2">没有收到验证码？</p>
            <button 
              onClick={resendVerificationCode}
              className="text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              重新发送
            </button>
          </div>

          {/* 测试提示 */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>测试验证码：</strong>123456
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 pt-12">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">注册</h1>
        <div className="w-10" />
      </div>

      {/* 主要内容 */}
      <div className="flex-1 flex flex-col justify-center px-6">
        {/* Logo区域 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">光</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">创建账户</h2>
          <p className="text-gray-600">加入我们，开始您的创作之旅</p>
        </div>

        {/* 注册表单 */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* 用户名输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                onBlur={() => touchField('username')}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                  touched.username && errors.username 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-purple-500'
                }`}
                placeholder="请输入用户名"
                required
              />
              <FieldFeedback error={touched.username ? errors.username : undefined} />
              <FieldFeedback error={touched.email ? errors.email : undefined} />
            </div>
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
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
                value={formData.password}
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <FieldFeedback error={touched.password ? errors.password : undefined} />
            
            {/* 密码强度指示器 */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-600">密码强度:</span>
                  <div className={`text-xs font-medium ${
                    passwordStrength.level === 'weak' ? 'text-red-600' :
                    passwordStrength.level === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength.level === 'weak' ? '弱' :
                     passwordStrength.level === 'medium' ? '中' : '强'}
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.score
                          ? passwordStrength.level === 'weak' ? 'bg-red-500' :
                            passwordStrength.level === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.suggestions.length > 0 && (
                  <div className="mt-1">
                    <InlineFeedback 
                      type="info" 
                      message={`建议: ${passwordStrength.suggestions.join('、')}`}
                      className="text-xs py-1 px-2"
                      showIcon={false}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 确认密码输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              确认密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                onBlur={() => touchField('confirmPassword')}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                  touched.confirmPassword && errors.confirmPassword 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-purple-500'
                }`}
                placeholder="请再次输入密码"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <FieldFeedback error={touched.confirmPassword ? errors.confirmPassword : undefined} />
          </div>

          {/* 操作反馈 */}
          <ActionFeedback 
            isLoading={isLoading}
            error={submitError}
            onRetry={() => setSubmitError('')}
            className="mb-4"
          />

          {/* 服务条款 */}
          <div className="flex items-start space-x-3">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              我已阅读并同意{' '}
              <Link to="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
                服务条款
              </Link>
              {' '}和{' '}
              <Link to="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
                隐私政策
              </Link>
            </div>
          </div>

          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                注册中...
              </div>
            ) : (
              '创建账户'
            )}
          </button>
        </form>

        {/* 登录链接 */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            已有账户？{' '}
            <Link 
              to="/login" 
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}