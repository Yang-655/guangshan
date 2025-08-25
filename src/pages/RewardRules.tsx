import React from 'react';
import { ArrowLeft, Shield, DollarSign, Clock, Star, AlertTriangle, CheckCircle, XCircle, Users, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RewardRules() {
  const navigate = useNavigate();

  const rulesSections = [
    {
      id: 'deposit',
      title: '质押机制',
      icon: Shield,
      color: 'blue',
      rules: [
        '发布悬赏任务需要质押等额资金作为保证金',
        '质押金额自动等于悬赏金额，确保雇主有足够资金支付',
        '任务完成并确认后，质押金自动退还至雇主账户',
        '如雇主恶意拒绝确认完成，平台将介入仲裁',
        '质押期间资金被冻结，无法用于其他用途'
      ]
    },
    {
      id: 'bidding',
      title: '竞标机制',
      icon: DollarSign,
      color: 'green',
      rules: [
        '接单者可以给出低于悬赏金额的报价进行竞标',
        '雇主可以查看所有竞标者的报价和资料',
        '雇主有权选择最合适的接单者，不一定是最低价',
        '支持多人同时竞标，增加选择机会',
        '竞标时需要提供详细的执行方案和时间安排'
      ]
    },
    {
      id: 'auto-increase',
      title: '自动加价',
      icon: Clock,
      color: 'purple',
      rules: [
        '雇主可以设置自动加价功能，提高任务吸引力',
        '可设定加价金额、加价间隔和最高悬赏限额',
        '自动加价会在设定时间自动执行，无需人工干预',
        '加价后的质押金额也会相应增加',
        '达到最高限额后停止自动加价'
      ]
    },
    {
      id: 'credit',
      title: '信用机制',
      icon: Star,
      color: 'yellow',
      rules: [
        '所有用户都有信用评分，初始分数为100分',
        '按时完成任务可获得信用加分',
        '未按时完成任务将扣除信用分数',
        '连续3次未完成任务将被禁止接单30天',
        '信用分数影响接单优先级和可接任务类型'
      ]
    },
    {
      id: 'task-flow',
      title: '任务流程',
      icon: CheckCircle,
      color: 'indigo',
      rules: [
        '发布任务 → 接单者竞标 → 雇主选择 → 任务执行 → 确认完成 → 评价',
        '任务开始后，接单者需要定期汇报进度',
        '雇主可以随时查看任务进展情况',
        '任务完成后，雇主需要在3天内确认',
        '超时未确认将自动确认完成并支付费用'
      ]
    },
    {
      id: 'dispute',
      title: '纠纷处理',
      icon: AlertTriangle,
      color: 'red',
      rules: [
        '任务过程中如有纠纷，可申请平台介入仲裁',
        '平台会根据聊天记录、交付物等证据进行判断',
        '仲裁结果为最终决定，双方必须执行',
        '恶意发起纠纷的用户将被扣除信用分',
        '严重违规用户将被永久封禁'
      ]
    }
  ];

  const creditScoreRules = [
    { range: '95-100', level: '钻石', color: 'text-purple-600', benefits: ['优先接单权', '高价值任务', '专属客服'] },
    { range: '85-94', level: '黄金', color: 'text-yellow-600', benefits: ['优先推荐', '快速提现', '任务保障'] },
    { range: '70-84', level: '白银', color: 'text-gray-600', benefits: ['正常接单', '标准服务', '基础保障'] },
    { range: '60-69', level: '青铜', color: 'text-orange-600', benefits: ['限制接单', '延迟提现', '基础功能'] },
    { range: '0-59', level: '黑名单', color: 'text-red-600', benefits: ['禁止接单', '账户冻结', '限制功能'] }
  ];

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      indigo: 'text-indigo-600 bg-indigo-100',
      red: 'text-red-600 bg-red-100'
    };
    return colors[color as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">悬赏规则</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 概述 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">平台规则概述</h2>
          <p className="text-gray-700 leading-relaxed">
            为了保障所有用户的权益，维护平台的公平交易环境，我们制定了完善的悬赏任务规则体系。
            这些规则涵盖了从任务发布到完成的全流程，包括质押机制、信用体系、纠纷处理等各个方面。
            请仔细阅读并遵守这些规则，共同营造良好的交易氛围。
          </p>
        </div>

        {/* 规则详情 */}
        {rulesSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg ${getIconColor(section.color)}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.rules.map((rule, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* 信用等级详情 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">信用等级体系</h3>
          </div>
          <div className="space-y-4">
            {creditScoreRules.map((level, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold text-lg ${level.color}`}>{level.level}</span>
                    <span className="text-sm text-gray-500">({level.range} 分)</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {level.benefits.map((benefit, benefitIndex) => (
                    <span
                      key={benefitIndex}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 违规处罚 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">违规处罚</h3>
          </div>
          <div className="space-y-3">
            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="font-medium text-gray-900">轻微违规</h4>
              <p className="text-sm text-gray-600">延迟交付、质量不达标等 → 扣除5-10信用分</p>
            </div>
            <div className="border-l-4 border-orange-400 pl-4">
              <h4 className="font-medium text-gray-900">中等违规</h4>
              <p className="text-sm text-gray-600">恶意竞标、虚假信息等 → 扣除10-20信用分，限制功能</p>
            </div>
            <div className="border-l-4 border-red-400 pl-4">
              <h4 className="font-medium text-gray-900">严重违规</h4>
              <p className="text-sm text-gray-600">欺诈行为、恶意纠纷等 → 扣除20-50信用分，临时封禁</p>
            </div>
            <div className="border-l-4 border-red-600 pl-4">
              <h4 className="font-medium text-gray-900">极严重违规</h4>
              <p className="text-sm text-gray-600">诈骗、洗钱等违法行为 → 永久封禁，移交司法机关</p>
            </div>
          </div>
        </div>

        {/* 费用说明 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">费用说明</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>平台服务费</span>
              <span className="font-medium">悬赏金额的 5%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>提现手续费</span>
              <span className="font-medium">2元/笔（单笔≥100元免费）</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>争议仲裁费</span>
              <span className="font-medium">败诉方承担（50-200元）</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>加急处理费</span>
              <span className="font-medium">20元/次</span>
            </div>
          </div>
        </div>

        {/* 联系我们 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">联系我们</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <p>如有任何疑问或需要帮助，请通过以下方式联系我们：</p>
            <div className="space-y-1">
              <p>• 在线客服：工作日 9:00-18:00</p>
              <p>• 客服热线：400-123-4567</p>
              <p>• 邮箱：support@example.com</p>
              <p>• QQ群：123456789</p>
            </div>
          </div>
        </div>

        {/* 免责声明 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">免责声明</h4>
              <p className="text-sm text-yellow-700">
                平台仅提供信息撮合服务，不参与具体交易过程。用户应自行判断交易风险，
                平台不对因用户违约、欺诈等行为造成的损失承担责任。请谨慎选择交易对象，
                保护个人信息和财产安全。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}