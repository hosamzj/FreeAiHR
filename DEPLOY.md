# 部署指南

## 方式一：Vercel + Neon（推荐，5分钟部署）

### 1. 准备数据库

1. 访问 [Neon](https://neon.tech) 注册并创建项目
2. 获取连接字符串：`postgresql://user:password@host.neon.tech/dbname?sslmode=require`
3. 记录 `DATABASE_URL`

### 2. 部署到 Vercel

1. 访问 [Vercel](https://vercel.com) → New Project → Import GitHub Repo
2. 选择 `ai-recruit` 仓库
3. 环境变量配置：
   | 变量名 | 值 |
   |--------|-----|
   | `DATABASE_URL` | `postgresql://...` (Neon 提供) |
   | `JWT_SECRET` | 随机字符串，可用 `openssl rand -base64 32` 生成 |
   | `NEXT_PUBLIC_ENABLE_DEMO` | `false`（生产环境）或 `true`（演示） |
4. 点击 Deploy

### 3. 初始化数据库

部署完成后，进入 Vercel 项目 → Settings → General → Build Command，添加：

```bash
npx prisma migrate deploy && npx prisma db seed && next build
```

或执行 Vercel CLI：

```bash
vercel --prod
```

---

## 方式二：Docker 本地部署

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入实际的 DATABASE_URL 和 JWT_SECRET
```

### 2. 启动服务

```bash
# 使用 docker-compose（含 PostgreSQL）
docker-compose up -d

# 等待数据库启动
docker-compose logs -f db

# 运行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 初始化种子数据
docker-compose exec app npx tsx prisma/seed.ts

# 查看应用日志
docker-compose logs -f app
```

### 3. 访问

打开 http://localhost:3000

---

## 方式三：Docker 云服务器部署

### 1. 构建镜像

```bash
# 本地构建
docker build \
  --build-arg DATABASE_URL="postgresql://..." \
  --build-arg JWT_SECRET="your-secret" \
  -t ai-recruit:latest .

# 推送到镜像仓库
docker tag ai-recruit:latest your-registry/ai-recruit:latest
docker push your-registry/ai-recruit:latest
```

### 2. 服务器上运行

```bash
docker pull your-registry/ai-recruit:latest

docker run -d \
  --name ai-recruit \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV=production \
  --restart unless-stopped \
  your-registry/ai-recruit:latest
```

---

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `JWT_SECRET` | ✅ | JWT 签名密钥，生产环境必须随机且保密 |
| `NEXT_PUBLIC_ENABLE_DEMO` | ❌ | 是否显示演示账号，默认 `false` |
| `AI_API_KEY` | ❌ | DeepSeek API Key，用于 AI 功能 |

---

## 验证部署

1. 访问首页 → 应重定向到 `/login`
2. 使用演示账号登录（如启用）→ 验证各模块功能
3. 访问 `/api/health` → 应返回 `{"status":"ok","database":"connected"}`

---

## 故障排查

| 问题 | 原因 | 解决 |
|------|------|------|
| 500 错误 | 数据库未连接 | 检查 `DATABASE_URL` |
| 登录失败 | JWT_SECRET 不匹配 | 确认 env 变量已设置 |
| 构建失败 | Prisma 未生成 | 确保 `npx prisma generate` 在 build 步骤中 |
| 静态资源 404 | standalone 输出问题 | 确认 `.next/static` 已复制到容器 |
