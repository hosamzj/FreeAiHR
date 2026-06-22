# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── (dashboard)/    # 仪表盘路由组
│   │   │   ├── layout.tsx  # 仪表盘布局（侧边栏+顶栏）
│   │   │   ├── dashboard/  # 招聘看板与数据大屏
│   │   │   ├── resumes/    # 简历AI解析与智能筛选
│   │   │   ├── interviews/ # 面试智能分配与排期
│   │   │   ├── analysis/   # 面试过程AI分析
│   │   │   └── offers/     # Offer智能生成与审批
│   │   ├── layout.tsx      # 根布局
│   │   ├── page.tsx        # 首页（重定向到dashboard）
│   │   └── globals.css     # 全局样式（深色科技风主题）
│   ├── components/
│   │   ├── layout/         # 布局组件（sidebar, topbar）
│   │   └── ui/             # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   └── lib/                # 工具库
│       ├── utils.ts        # 通用工具函数 (cn)
│       ├── app-context.tsx # 全局应用状态上下文
│       └── mock-data.ts    # 模拟数据
├── DESIGN.md               # 设计规范
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码
- 禁止隐式 `any` 和 `as any`
- React 组件使用函数式组件 + Hooks
- 全局状态通过 `AppContext` 管理（位于 `src/lib/app-context.tsx`）

### 页面模块说明

- **招聘看板** (`/dashboard`): 数据概览、招聘漏斗、部门统计、周度趋势
- **简历管理** (`/resumes`): 拖拽上传、AI解析、匹配度评分、候选人池
- **面试排期** (`/interviews`): 日历视图、列表视图、面试官匹配、冲突检测
- **面试分析** (`/analysis`): 评价总览、多维对比、AI问题推荐
- **Offer管理** (`/offers`): 审批流、AI录用建议、薪酬参考、状态追踪

### 设计风格

- 深色科技风（深蓝黑底 #0a0e1a + 冰蓝 #38bdf8 / 暖橙 #f97316）
- 卡片式布局，hover 微上浮 + 冰蓝边框光效
- AI 功能使用脉冲动画和渐变高亮标识
