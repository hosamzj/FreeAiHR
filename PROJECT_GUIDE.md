# AI 智能招聘管理系统 - 项目开发指南

> 本文档汇总了项目的关键信息，便于后续开发时快速了解项目结构和历史变更。
> 最后更新：2026-07-05

---

## 一、项目概述

**项目名称**：AI 智能招聘管理系统  
**技术栈**：Next.js 16 + React 19 + TypeScript 5 + shadcn/ui + Tailwind CSS v4 + PostgreSQL + Prisma ORM  
**开发模式**：全栈应用，前后端同仓库  
**包管理器**：pnpm（强制）  
**设计风格**：深色科技风（深蓝黑底 + 冰蓝/暖橙强调色）

---

## 二、技术架构

### 2.1 核心技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16.1.1 (App Router) |
| UI 库 | shadcn/ui (基于 Radix UI) |
| 样式 | Tailwind CSS v4 |
| 数据库 | PostgreSQL (Docker 容器 `ai-recruit-db`) |
| ORM | Prisma 6 |
| 认证 | JWT (httpOnly cookie) + bcrypt |
| 表单 | React Hook Form + Zod |
| 图标 | Lucide React |
| 字体 | Geist Sans & Geist Mono |

### 2.2 目录结构

```
ai-recruit/
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   ├── seed.ts                # 种子数据
│   └── migrations/            # 数据库迁移文件
├── public/                    # 静态资源
├── scripts/                   # 构建/开发脚本
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # 仪表盘路由组（需登录）
│   │   │   ├── layout.tsx     # 仪表盘布局（侧边栏+顶栏+AuthGuard）
│   │   │   ├── dashboard/     # 招聘看板
│   │   │   ├── resumes/       # 简历管理（AI解析、筛选）
│   │   │   ├── interviews/    # 面试排期
│   │   │   ├── analysis/      # 面试分析
│   │   │   ├── offers/        # Offer管理
│   │   │   ├── positions/     # 职位管理
│   │   │   ├── candidate-pool/  # 候选人池
│   │   │   ├── collection/    # 简历采集
│   │   │   ├── contracts/     # 合同管理
│   │   │   ├── onboarding/    # 入职管理
│   │   │   ├── reports/       # 招聘报表
│   │   │   ├── users/         # 用户管理
│   │   │   ├── settings/      # 系统设置
│   │   │   ├── templates/     # 岗位模板库
│   │   │   └── notifications/ # 通知中心
│   │   ├── api/               # 后端API路由
│   │   │   ├── auth/          # 认证（登录/登出/SSO/SMS）
│   │   │   ├── candidates/    # 候选人CRUD
│   │   │   ├── interviews/    # 面试管理
│   │   │   ├── offers/        # Offer管理
│   │   │   ├── positions/     # 职位管理
│   │   │   ├── users/         # 用户管理
│   │   │   ├── system/        # 系统配置
│   │   │   └── ...
│   │   ├── login/             # 登录页
│   │   ├── 403/               # 无权限页
│   │   ├── change-password/   # 修改密码页
│   │   ├── layout.tsx         # 根布局（AuthProvider）
│   │   ├── page.tsx           # 首页（重定向到dashboard）
│   │   └── globals.css        # 全局样式（深色主题）
│   ├── components/
│   │   ├── layout/            # 布局组件（sidebar, topbar, mobile-nav）
│   │   ├── ui/                # shadcn/ui 基础组件库
│   │   └── *.tsx              # 业务组件
│   ├── hooks/                 # 自定义 Hooks
│   └── lib/                   # 工具库
│       ├── utils.ts           # cn() 等工具函数
│       ├── prisma.ts          # Prisma客户端单例
│       ├── auth.ts            # 认证工具（JWT/密码/响应格式）
│       ├── auth-context.tsx   # 前端认证上下文
│       ├── app-context.tsx    # 全局应用状态上下文
│       ├── audit.ts           # 操作日志工具
│       └── validation.ts      # 表单验证规则
├── .env                       # 环境变量
├── DESIGN.md                  # 设计规范文档
├── ROADMAP.md                 # 功能路线图
├── AGENTS.md                  # 项目上下文（Agent参考）
└── PROJECT_GUIDE.md           # 本文件
```

---

## 三、数据库模型

### 3.1 核心实体关系

```
User (用户)
  ├── interviews (Interview[])     # 面试官关联的面试
  ├── evaluations (InterviewEvaluation[])
  ├── offers (Offer[])
  └── auditLogs (AuditLog[])

Candidate (候选人)
  ├── interviews (Interview[])
  ├── applications (Application[])
  ├── feedbacks (CandidateFeedback[])
  ├── interviewAnalyses (InterviewAnalysis[])
  └── offers (Offer[])

JobPosition (职位)
  ├── candidates (Application[])
  └── interviews (Interview[])

Interview (面试)
  ├── candidate (Candidate)
  ├── position (JobPosition)
  └── interviewer (User)

Offer (Offer)
  ├── candidate (Candidate)
  └── creator (User)
```

### 3.2 关键状态枚举

**候选人状态 (`Candidate.status`)**：
- `new` - 新简历
- `screening` - 筛选中
- `interviewing` - 面试中
- `offered` - 待Offer
- `hired` - 已入职
- `rejected` - 已淘汰
- `archived` - 已归档

**用户角色 (`User.role`)**：
- `admin` - 管理员（全部权限）
- `hr_manager` - HR经理
- `interviewer` - 面试官
- `candidate` - 候选人

---

## 四、API 规范

### 4.1 统一响应格式

```json
{
  "code": 0,          // 0=成功，非0=错误
  "data": {},         // 响应数据
  "message": "success" // 提示信息
}
```

### 4.2 错误码定义

| 状态码 | 含义 |
|--------|------|
| 401 | 未登录或登录已过期 |
| 403 | 无权限访问 |
| 422 | 参数校验错误 |
| 500 | 服务器内部错误 |

### 4.3 认证方式

- JWT Token 存储在 httpOnly cookie 中（名称为 `token`）
- API 鉴权使用 `requireAuth()` / `requireRole()` 中间件
- 前端通过 `AuthContext` 管理登录状态

### 4.4 核心 API 列表

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 登录 |
| `/api/auth/logout` | POST | 登出 |
| `/api/auth/me` | GET | 获取当前用户 |
| `/api/candidates` | GET/POST | 候选人列表/创建 |
| `/api/candidates/[id]` | GET/PUT/DELETE | 候选人详情/更新/删除 |
| `/api/interviews` | GET/POST | 面试列表/创建 |
| `/api/offers` | GET/POST | Offer列表/创建 |
| `/api/users` | GET/POST | 用户列表/创建 |
| `/api/dashboard` | GET | 看板数据 |

---

## 五、开发规范

### 5.1 编码规范

- TypeScript `strict` 模式
- 禁止隐式 `any` 和 `as any`
- 函数式组件 + Hooks
- 使用 `@/` 路径别名导入模块

### 5.2 组件开发规范

- **优先使用 shadcn/ui 基础组件**，不要从零开发
- 业务组件放在 `src/components/` 下
- 布局组件放在 `src/components/layout/` 下

### 5.3 样式规范

- 使用 Tailwind CSS 类名
- 使用 `cn()` 工具函数合并类名
- 主题变量定义在 `src/app/globals.css`

### 5.4 关键设计变量

```css
/* 背景 */
--background: #0a0e1a       /* 深夜蓝黑 */
--card: #111827              /* 卡片底色 */
--hover: #1a2236             /* 悬浮状态 */

/* 强调色 */
--primary: #38bdf8           /* 冰蓝 */
--accent: #f97316            /* 暖橙 */
--success: #22c55e           /* 成功绿 */
--warning: #eab308           /* 警告黄 */
--destructive: #ef4444      /* 错误红 */

/* 文字 */
--foreground: #e2e8f0        /* 主文字 */
--muted-foreground: #94a3b8  /* 次文字 */

/* 边框 */
--border: #1e293b
```

---

## 六、环境配置

### 6.1 环境变量 (.env)

```bash
DATABASE_URL="postgresql://recruit:recruit_password@localhost:5432/ai_recruit?sslmode=disable"
JWT_SECRET="dev-jwt-secret-change-in-production"
NEXT_PUBLIC_ENABLE_DEMO="true"
```

### 6.2 开发服务器

```bash
# 启动开发服务器（端口 5001）
pnpm dev

# 或
bash ./scripts/dev.sh
```

### 6.3 数据库操作

```bash
# 运行种子数据
npx tsx prisma/seed.ts

# 数据库迁移
npx prisma migrate dev --name <migration_name>

# 重新生成 Prisma Client
npx prisma generate

# 直接连接数据库
PGPASSWORD=recruit_password psql -h localhost -p 5432 -U recruit -d ai_recruit
```

### 6.4 Docker 数据库

```bash
# 数据库容器
# 名称: ai-recruit-db
# 端口: 5432
# 用户名: recruit
# 密码: recruit_password
# 数据库: ai_recruit
```

---

## 七、演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@recruit.ai | admin123 |
| HR经理 | hr@recruit.ai | Hr@12345 |
| 面试官 | interviewer@recruit.ai | Test@1234 |

---

## 八、功能模块清单

### 8.1 已完成功能

- [x] 多角色认证（JWT + Cookie）
- [x] 用户管理（CRUD、角色分配）
- [x] 候选人管理（简历解析、AI筛选、候选人池）
- [x] 面试管理（排期、日历、评价、评分）
- [x] Offer管理（审批流、AI建议）
- [x] 系统设置（SSO、密码策略）
- [x] 简历采集（拖拽上传、Excel导入）
- [x] 合同管理
- [x] 入职管理
- [x] 招聘报表
- [x] 通知中心
- [x] 岗位模板库
- [x] 候选人删除功能

### 8.2 已知问题与修复记录

#### 问题 1：候选人删除按钮无响应（2026-07-05 修复）

**现象**：点击简历卡片上的"删除"按钮，确认后候选人未被删除。

**根因**：前端状态值与数据库 Schema 不匹配。前端使用 `'interview'`、`'offer'`，但数据库实际值为 `'interviewing'`、`'offered'`。

**修复内容**：
1. `src/app/api/candidates/[id]/route.ts` - 扩展 DELETE 接口接受的状态值
2. `src/app/(dashboard)/resumes/page.tsx` - 统一所有状态引用为数据库实际值
3. 添加错误处理，删除失败时显示 alert 提示

**验证**：API 测试通过，数据库确认删除，前端自动化测试通过。

---

## 九、路线图（ROADMAP 摘要）

### 阶段一：核心增强（优先）
- [ ] API 速率限制
- [ ] 邮件通知系统
- [ ] 站内消息中心
- [ ] AI 简历智能匹配
- [ ] 操作日志持久化

### 阶段二：体验优化
- [ ] 招聘漏斗数据可视化
- [ ] 移动端适配优化
- [ ] Excel 批量导入/导出
- [ ] 日历同步（Google/Outlook）

### 阶段三：企业级功能
- [ ] 多租户支持
- [ ] 企业微信/钉钉/飞书集成
- [ ] 第三方招聘平台 API 对接
- [ ] 视频面试集成

---

## 十、关键文件速查

| 文件 | 用途 |
|------|------|
| `src/lib/auth.ts` | 认证工具（JWT签发/验证、密码哈希、统一响应格式） |
| `src/lib/auth-context.tsx` | 前端认证状态管理 |
| `src/lib/app-context.tsx` | 全局应用状态管理 |
| `src/lib/prisma.ts` | Prisma 客户端单例 |
| `src/middleware.ts` | Next.js 路由中间件（权限校验） |
| `prisma/schema.prisma` | 数据库模型定义 |
| `prisma/seed.ts` | 种子数据（演示账号、测试数据） |
| `src/app/globals.css` | 全局样式、主题变量 |
| `DESIGN.md` | 设计规范（配色、字体、动效） |
| `ROADMAP.md` | 功能路线图 |
| `AGENTS.md` | 项目上下文（Agent 开发参考） |

---

## 十一、开发注意事项

1. **必须使用 pnpm**，项目配置了 `preinstall` 脚本阻止 npm/yarn
2. **优先使用 shadcn/ui 组件**，避免重复造轮子
3. **数据库状态值**：前端使用 `'interviewing'` 而非 `'interview'`，`'offered'` 而非 `'offer'`
4. **API 返回格式**：始终使用 `{code, data, message}` 结构
5. **认证 Cookie**：名称为 `token`，httpOnly，通过 `/api/auth/me` 验证登录状态
6. **角色权限**：admin 可访问全部，其他角色受限于对应菜单
7. **深色主题**：所有页面基于深色背景开发，不要使用浅色主题

---

## 十二、联系方式

- 项目路径：`/Users/huosam/Documents/HR/ai-recruit`
- 开发服务器：`http://localhost:5001`
- 数据库端口：`5432` (PostgreSQL)

---

*本文档由 AI 助手生成，如有遗漏请参考原始文档：README.md, DESIGN.md, ROADMAP.md, AGENTS.md*
