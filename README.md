# 考公工作台 v1

> 个人公务员考试刷题工作台。基于 pnpm Monorepo + Next.js 15 + Prisma + PostgreSQL + Auth.js v5。

## 架构

- `apps/web` — Next.js 15 主应用（App Router、shadcn/ui、TanStack Query、Zustand）
- `packages/db` — Prisma schema + Postgres 客户端
- `packages/importer` — Node CLI：粉笔公开真题 → JSON → 数据库
- `packages/ui` — 共享 UI 组件

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp apps/web/.env.example apps/web/.env.local
# 编辑 DATABASE_URL、EMAIL_SERVER、EMAIL_FROM

# 3. 初始化数据库
pnpm db:migrate
pnpm db:seed

# 4. 启动开发服务器
pnpm dev
# 浏览器打开 http://localhost:3000
```

## 测试

```bash
pnpm test
```

## 部署

目标：Vercel + Vercel Postgres（详见 `docs/superpowers/plans/`）。

## 文档

- `docs/superpowers/specs/` — 产品设计 spec
- `docs/superpowers/plans/` — 实施计划（W1-W5）
