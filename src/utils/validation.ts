// 表单验证工具函数

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// 基础验证规则
export const validationRules = {
  // 邮箱验证
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value) return '请输入邮箱地址';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return '请输入有效的邮箱地址';
      }
      return null;
    }
  },

  // 密码验证
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (!value) return '请输入密码';
      if (value.length < 6) return '密码至少需要6个字符';
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return '密码需要包含大小写字母和数字';
      }
      return null;
    }
  },

  // 用户名验证
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    custom: (value: string) => {
      if (!value) return '请输入用户名';
      if (value.length < 3) return '用户名至少需要3个字符';
      if (value.length > 20) return '用户名不能超过20个字符';
      if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
        return '用户名只能包含字母、数字、下划线和中文';
      }
      return null;
    }
  },

  // 手机号验证
  phone: {
    required: true,
    pattern: /^1[3-9]\d{9}$/,
    custom: (value: string) => {
      if (!value) return '请输入手机号';
      if (!/^1[3-9]\d{9}$/.test(value)) {
        return '请输入有效的手机号';
      }
      return null;
    }
  },

  // 金额验证
  amount: {
    required: true,
    custom: (value: string | number) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return '请输入有效的金额';
      if (num <= 0) return '金额必须大于0';
      if (num > 1000000) return '金额不能超过100万';
      return null;
    }
  },

  // 验证码验证
  verificationCode: {
    required: true,
    pattern: /^\d{6}$/,
    custom: (value: string) => {
      if (!value) return '请输入验证码';
      if (!/^\d{6}$/.test(value)) {
        return '验证码必须是6位数字';
      }
      return null;
    }
  },

  // 标题验证
  title: {
    required: true,
    minLength: 5,
    maxLength: 100,
    custom: (value: string) => {
      if (!value) return '请输入标题';
      if (value.length < 5) return '标题至少需要5个字符';
      if (value.length > 100) return '标题不能超过100个字符';
      return null;
    }
  },

  // 描述验证
  description: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    custom: (value: string) => {
      if (!value) return '请输入描述';
      if (value.length < 10) return '描述至少需要10个字符';
      if (value.length > 1000) return '描述不能超过1000个字符';
      return null;
    }
  }
};

// 验证单个字段
export function validateField(value: any, rule: ValidationRule): string | null {
  // 必填验证
  if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return '此字段为必填项';
  }

  // 如果值为空且不是必填，则通过验证
  if (!value && !rule.required) {
    return null;
  }

  // 最小长度验证
  if (rule.minLength && value.length < rule.minLength) {
    return `至少需要${rule.minLength}个字符`;
  }

  // 最大长度验证
  if (rule.maxLength && value.length > rule.maxLength) {
    return `不能超过${rule.maxLength}个字符`;
  }

  // 正则表达式验证
  if (rule.pattern && !rule.pattern.test(value)) {
    return '格式不正确';
  }

  // 自定义验证
  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
}

// 验证整个表单
export function validateForm(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const error = validateField(data[field], rule);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// 实时验证Hook
import { useState, useCallback } from 'react';

export function useFormValidation(
  initialData: Record<string, any>,
  rules: Record<string, ValidationRule>
) {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((field: string, value: any) => {
    const rule = rules[field];
    if (!rule) return null;

    const error = validateField(value, rule);
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
    return error;
  }, [rules]);

  const updateField = useCallback((field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // 如果字段已经被触摸过，则实时验证
    if (touched[field]) {
      validateField(field, value);
    }
  }, [touched, validateField]);

  const touchField = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, data[field]);
  }, [data, validateField]);

  const validateAll = useCallback(() => {
    const result = validateForm(data, rules);
    setErrors(result.errors);
    
    // 标记所有字段为已触摸
    const allTouched = Object.keys(rules).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
    return result;
  }, [data, rules]);

  const reset = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  return {
    data,
    errors,
    touched,
    updateField,
    touchField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
}

// 密码强度检查
export function checkPasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'medium' | 'strong';
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  // 长度检查
  if (password.length >= 8) {
    score += 1;
  } else {
    suggestions.push('密码长度至少8位');
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含小写字母');
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含大写字母');
  }

  // 包含数字
  if (/\d/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含数字');
  }

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('包含特殊字符');
  }

  let level: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    level = 'weak';
  } else if (score <= 3) {
    level = 'medium';
  } else {
    level = 'strong';
  }

  return { score, level, suggestions };
}

// 敏感词检查
const sensitiveWords = [
  '投资理财', '高收益', '稳赚不赔', '内幕消息', '股票推荐',
  '贷款', '借钱', '网贷', '信用卡套现', '刷单',
  '色情', '赌博', '毒品', '枪支', '爆炸物'
];

export function checkSensitiveWords(text: string): {
  hasSensitiveWords: boolean;
  detectedWords: string[];
} {
  const detectedWords: string[] = [];
  
  for (const word of sensitiveWords) {
    if (text.includes(word)) {
      detectedWords.push(word);
    }
  }

  return {
    hasSensitiveWords: detectedWords.length > 0,
    detectedWords
  };
}