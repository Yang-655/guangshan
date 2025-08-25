import React, { createContext, useContext, useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Palette, Grid, Smartphone, Tablet, Monitor as Desktop } from 'lucide-react';

// 设计系统配置
interface DesignSystemConfig {
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
}

const designSystem: DesignSystemConfig = {
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem'    // 64px
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  typography: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem' // 30px
  }
};

// 主题类型
type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'blue' | 'purple' | 'green' | 'red' | 'orange';

interface ThemeContextType {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题提供者组件
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  defaultColorScheme?: ColorScheme;
}

export function ThemeProvider({
  children,
  defaultMode = 'system',
  defaultColorScheme = 'blue'
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultColorScheme);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark = false;
      
      if (mode === 'dark') {
        shouldBeDark = true;
      } else if (mode === 'system') {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setIsDark(shouldBeDark);
      
      // 更新HTML类名
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // 更新CSS变量
      document.documentElement.style.setProperty('--color-scheme', colorScheme);
    };

    updateTheme();

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        updateTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, colorScheme]);

  return (
    <ThemeContext.Provider value={{
      mode,
      colorScheme,
      setMode,
      setColorScheme,
      isDark
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 主题Hook
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 响应式断点Hook
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    screenSize,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop'
  };
}

// 统一间距组件
interface SpacingProps {
  size?: keyof typeof designSystem.spacing;
  direction?: 'horizontal' | 'vertical' | 'all';
  className?: string;
}

export function Spacing({ size = 'md', direction = 'all', className = '' }: SpacingProps) {
  const spacingValue = designSystem.spacing[size];
  
  const getSpacingClass = () => {
    switch (direction) {
      case 'horizontal':
        return `px-[${spacingValue}]`;
      case 'vertical':
        return `py-[${spacingValue}]`;
      default:
        return `p-[${spacingValue}]`;
    }
  };

  return <div className={`${getSpacingClass()} ${className}`} />;
}

// 统一卡片组件
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  hoverable = false
}: CardProps) {
  const { isDark } = useTheme();
  
  const variants = {
    default: `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`,
    elevated: `bg-white dark:bg-gray-800 ${designSystem.shadows.md} border-0`,
    outlined: `bg-transparent border-2 border-gray-300 dark:border-gray-600`,
    filled: `bg-gray-50 dark:bg-gray-900 border-0`
  };
  
  const sizes = {
    sm: `p-[${designSystem.spacing.sm}] rounded-[${designSystem.borderRadius.sm}]`,
    md: `p-[${designSystem.spacing.md}] rounded-[${designSystem.borderRadius.md}]`,
    lg: `p-[${designSystem.spacing.lg}] rounded-[${designSystem.borderRadius.lg}]`
  };
  
  const hoverClass = hoverable ? 'hover:shadow-lg hover:scale-[1.02] transition-all duration-200' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${hoverClass}
        ${clickableClass}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// 主题切换器组件
interface ThemeSwitcherProps {
  className?: string;
  showColorScheme?: boolean;
}

export function ThemeSwitcher({ className = '', showColorScheme = true }: ThemeSwitcherProps) {
  const { mode, colorScheme, setMode, setColorScheme, isDark } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const themeOptions = [
    { value: 'light' as ThemeMode, label: '浅色', icon: Sun },
    { value: 'dark' as ThemeMode, label: '深色', icon: Moon },
    { value: 'system' as ThemeMode, label: '跟随系统', icon: Monitor }
  ];

  const colorOptions = [
    { value: 'blue' as ColorScheme, label: '蓝色', color: 'bg-blue-500' },
    { value: 'purple' as ColorScheme, label: '紫色', color: 'bg-purple-500' },
    { value: 'green' as ColorScheme, label: '绿色', color: 'bg-green-500' },
    { value: 'red' as ColorScheme, label: '红色', color: 'bg-red-500' },
    { value: 'orange' as ColorScheme, label: '橙色', color: 'bg-orange-500' }
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {showOptions && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-48 z-50">
          {/* 主题模式选择 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">主题模式</h3>
            <div className="space-y-1">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setMode(option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      mode === option.value
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 颜色方案选择 */}
          {showColorScheme && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">颜色方案</h3>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setColorScheme(option.value)}
                    className={`w-8 h-8 rounded-full ${option.color} border-2 transition-all ${
                      colorScheme === option.value
                        ? 'border-gray-900 dark:border-gray-100 scale-110'
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 响应式网格组件
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: keyof typeof designSystem.spacing;
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = ''
}: ResponsiveGridProps) {
  const { breakpoint } = useBreakpoint();
  
  const currentCols = cols[breakpoint] || cols.mobile || 1;
  const gapValue = designSystem.spacing[gap];

  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${currentCols}, 1fr)`,
        gap: gapValue
      }}
    >
      {children}
    </div>
  );
}

// 视觉反馈组件
interface VisualFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  variant?: 'subtle' | 'solid' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VisualFeedback({
  type,
  children,
  variant = 'subtle',
  size = 'md',
  className = ''
}: VisualFeedbackProps) {
  const colors = {
    success: {
      subtle: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
      solid: 'bg-green-600 text-white',
      outline: 'border-2 border-green-600 text-green-600 dark:text-green-400'
    },
    error: {
      subtle: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
      solid: 'bg-red-600 text-white',
      outline: 'border-2 border-red-600 text-red-600 dark:text-red-400'
    },
    warning: {
      subtle: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      solid: 'bg-yellow-600 text-white',
      outline: 'border-2 border-yellow-600 text-yellow-600 dark:text-yellow-400'
    },
    info: {
      subtle: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      solid: 'bg-blue-600 text-white',
      outline: 'border-2 border-blue-600 text-blue-600 dark:text-blue-400'
    }
  };

  const sizes = {
    sm: `px-[${designSystem.spacing.sm}] py-[${designSystem.spacing.xs}] text-[${designSystem.typography.sm}]`,
    md: `px-[${designSystem.spacing.md}] py-[${designSystem.spacing.sm}] text-[${designSystem.typography.base}]`,
    lg: `px-[${designSystem.spacing.lg}] py-[${designSystem.spacing.md}] text-[${designSystem.typography.lg}]`
  };

  return (
    <div
      className={`
        ${colors[type][variant]}
        ${sizes[size]}
        rounded-[${designSystem.borderRadius.md}]
        ${variant === 'subtle' ? 'border' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// 设备预览组件
interface DevicePreviewProps {
  children: React.ReactNode;
  device?: 'mobile' | 'tablet' | 'desktop';
  className?: string;
}

export function DevicePreview({ children, device = 'mobile', className = '' }: DevicePreviewProps) {
  const deviceStyles = {
    mobile: {
      width: '375px',
      height: '667px',
      icon: Smartphone
    },
    tablet: {
      width: '768px',
      height: '1024px',
      icon: Tablet
    },
    desktop: {
      width: '1200px',
      height: '800px',
      icon: Desktop
    }
  };

  const style = deviceStyles[device];
  const Icon = style.icon;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium capitalize">{device}</span>
        <span className="text-xs text-gray-500">{style.width} × {style.height}</span>
      </div>
      
      <div
        className="border-8 border-gray-800 dark:border-gray-200 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: style.width,
          height: style.height,
          maxWidth: '100%',
          maxHeight: '70vh'
        }}
      >
        <div className="w-full h-full overflow-auto bg-white dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
}

// 导出设计系统配置
export { designSystem };