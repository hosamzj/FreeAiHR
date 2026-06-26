# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (httpOnly cookie) + bcrypt

## 目录结构

```
├── prisma/                 # 数据库Schema与迁移
│   ├── schema.prisma       # Prisma数据模型定义
│   ├── seed.ts             # 数据库种子数据
│   └── data/dev.db         # SQLite数据库文件
├── public/                 # 静态资源
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── (dashboard)/    # 仪表盘路由组（需登录）
│   │   │   ├── layout.tsx  # 仪表盘布局（侧边栏+顶栏+AuthGuard）
│   │   │   ├── dashboard/  # 招聘看板与数据大屏
│   │   │   ├── resumes/    # 简历AI解析与智能筛选
│   │   │   ├── interviews/ # 面试智能分配与排期
│   │   │   ├── analysis/   # 面试过程AI分析
│   │   │   ├── offers/     # Offer智能生成与审批
│   │   │   ├── users/      # 用户管理（admin专属）
│   │   │   ├── templates/  # 岗位模板库（AI生成+类别管理）
│   │   │   └── settings/   # 系统设置（admin专属）
│   │   ├── api/            # 后端API路由
│   │   │   ├── auth/       # 认证（登录/登出/SSO/SMS）
│   │   │   ├── users/      # 用户CRUD
│   │   │   ├── dashboard/  # 看板数据
│   │   │   ├── candidates/ # 候选人管理（含简历解析/邮箱导入）
│   │   │   ├── interviews/ # 面试管理
│   │   │   ├── offers/     # Offer管理
│   │   │   ├── positions/  # 职位管理
│   │   │   ├── position-templates/ # 岗位模板CRUD
│   │   │   ├── position-categories/ # 岗位类别管理
│   │   │   ├── ai/         # AI服务（JD生成/面试问题/匹配评分/薪资建议/配置）
│   │   │   ├── notifications/ # 通知
│   │   │   └── system/     # 系统配置（SSO/密码策略/基础配置）
│   │   ├── login/          # 登录页
│   │   ├── 403/            # 无权限页
│   │   ├── change-password/ # 修改密码页
│   │   ├── layout.tsx      # 根布局（AuthProvider）
│   │   ├── page.tsx        # 首页（重定向到dashboard）
│   │   └── globals.css     # 全局样式（深色科技风主题）
│   ├── components/
│   │   ├── layout/         # 布局组件（sidebar, topbar, mobile-bottom-nav）
│   │   ├── auth-guard.tsx  # 路由守卫组件
│   │   └── ui/             # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   └── lib/                # 工具库
│       ├── utils.ts        # 通用工具函数 (cn)
│       ├── prisma.ts       # Prisma客户端单例
│       ├── auth.ts         # 认证工具（JWT/密码/角色/响应格式）
│       ├── audit.ts        # 操作日志工具
│       ├── auth-context.tsx # 前端认证上下文
│       └── app-context.tsx  # 全局应用状态上下文
├── .env                    # 环境变量（DATABASE_URL, JWT_SECRET）
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
- 认证状态通过 `AuthContext` 管理（位于 `src/lib/auth-context.tsx`）

### API规范

- 所有API统一返回格式：`{code: 0, data: {}, message: 'success'}`
- 错误码：401未登录/403无权限/422参数错误/500服务器错误
- 认证通过httpOnly cookie传递JWT token
- 使用 `requireAuth()` / `requireRole()` 进行API鉴权

### 角色权限

| 角色 | 权限范围 |
|------|----------|
| admin | 全部功能 + 用户管理 + 系统设置 |
| hr_manager | 看板 + 简历 + 面试 + 分析 + Offer |
| interviewer | 面试安排 + 面试评价 |
| candidate | 我的面试 + 我的Offer |

### 页面模块说明

- **招聘看板** (`/dashboard`): 数据概览、招聘漏斗、部门统计、周度趋势
- **简历管理** (`/resumes`): 拖拽上传、AI解析、匹配度评分、候选人池
- **面试排期** (`/interviews`): 日历视图、列表视图、面试官匹配、冲突检测
- **面试分析** (`/analysis`): 评价总览、多维对比、AI问题推荐
- **Offer管理** (`/offers`): 审批流、AI录用建议、薪酬参考、状态追踪
- **用户管理** (`/users`): 用户CRUD、角色分配、启用/禁用（admin专属）
- **系统设置** (`/settings`): SSO配置、密码策略、基础配置（admin专属）

### 演示账号

- 管理员：admin@recruit.ai / Admin@123
- HR经理：hr@recruit.ai / Hr@12345
- 面试官：interviewer@recruit.ai / Test@1234

### 数据库操作

```bash
# 运行种子数据
npx tsx prisma/seed.ts

# 数据库迁移
npx prisma migrate dev --name <migration_name>

# 重新生成Prisma Client
npx prisma generate
```

### 设计风格

- 深色科技风（深蓝黑底 #0a0e1a + 冰蓝 #38bdf8 / 暖橙 #f97316）
- 卡片式布局，hover 微上浮 + 冰蓝边框光效
- AI 功能使用脉冲动画和渐变高亮标识
- 移动端自适应（底部Tab栏 + 汉堡菜单抽屉）
