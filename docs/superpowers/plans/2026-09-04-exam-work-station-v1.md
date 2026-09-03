# 考公工作台 v1 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4-6 周内交付考公个人工作台 v1：行测刷题闭环 + 错题本（答对 3 次即掌握）+ 手动个人计划 + 学习进度可视化 + 移动 PWA + 邮箱魔法链接登录。

**Architecture:** 基于 pnpm Monorepo 的 Next.js 15 全栈应用。`apps/web` 是 Next.js 主应用；`packages/db` 放 Prisma schema 和 Postgres 客户端；`packages/importer` 是 Node CLI，用来把粉笔公开真题导入 Postgres；`packages/ui` 共享 UI 组件。单用户（v1），但所有表都带 `userId`，未来开放零成本。

**Tech Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Prisma + PostgreSQL + Auth.js v5 + TanStack Query + Zustand + Recharts + next-pwa + Vercel。

---

## Global Constraints

以下约束**适用于所有任务**。每条都从 spec 抄过来（verbatim），所有任务的实现都隐式包含这些：

- v1 **不做**：模考、申论、AI 能力（v2+）、收藏夹（v2+）、声音/振动反馈、数据导出
- v1 仅支持**客观题**自动判分（单选/多选/不定项）；主观题标"待人工评"
- 错题"答对 **3 次**"即标记 `mastered=true, masteredAt=now()`（v1 硬编码，不暴露给用户配置）
- 题库数据源：**粉笔**公开真题（仅本地解析 Excel/JSON，**不调用粉笔任何 API**，避免账号/合规风险）
- v1 单用户；所有表带 `userId` 字段，按多用户设计
- 移动端 PWA 仅支持**只读离线**（最近 50 题缓存）+ 写操作 outbox 同步
- 包管理：**pnpm + workspaces**（禁止 npm / yarn）
- 部署目标：**Vercel**（Vercel Postgres 或 Supabase Postgres）
- 提交规范：每个 task 单独 commit，message 用 `feat:` / `fix:` / `chore:` / `test:` 前缀
- TypeScript：**strict 模式**（`tsconfig.json` `strict: true`）
- Prisma 变更必须 migration（`pnpm --filter @exam/db prisma migrate dev`）
- 测试：**Vitest**（单测 + 集成）；E2E（Playwright）v1 后期可选
- 路径别名：`@/` 指 `apps/web/src/`；`@exam/db` 指 `packages/db/src`

---

## 文件结构

```
exam-work-station/
├── apps/
│   └── web/                                # Next.js 主应用
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/
│       │   │   │   └── login/page.tsx
│       │   │   ├── (main)/
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx            # 首页 dashboard
│       │   │   │   ├── questions/
│       │   │   │   │   ├── page.tsx        # 题库列表
│       │   │   │   │   └── [id]/page.tsx   # 题目详情
│       │   │   │   ├── practice/
│       │   │   │   │   ├── new/page.tsx    # 配置新练习
│       │   │   │   │   └── [sessionId]/page.tsx
│       │   │   │   ├── mistakes/
│       │   │   │   │   ├── page.tsx        # 错题本
│       │   │   │   │   └── [id]/page.tsx   # 单题重做
│       │   │   │   ├── stats/page.tsx      # 统计
│       │   │   │   └── plans/
│       │   │   │       ├── page.tsx        # 计划列表
│       │   │   │       ├── new/page.tsx
│       │   │   │       └── [planId]/page.tsx
│       │   │   ├── api/auth/[...nextauth]/route.ts
│       │   │   ├── layout.tsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── ui/                     # shadcn 组件
│       │   │   ├── nav-tabs.tsx
│       │   │   ├── question-card.tsx
│       │   │   ├── practice-session.tsx
│       │   │   ├── stats-chart.tsx
│       │   │   └── plan-card.tsx
│       │   ├── lib/
│       │   │   ├── auth.ts
│       │   │   ├── db.ts
│       │   │   ├── judge.ts                # 纯函数判分
│       │   │   ├── wrong-book.ts           # 错题归集
│       │   │   ├── stats.ts                # 统计聚合
│       │   │   ├── plan.ts                 # 计划生成
│       │   │   ├── offline-db.ts           # IndexedDB 封装
│       │   │   └── outbox.ts               # 离线写队列
│       │   ├── server/actions/
│       │   │   ├── question.ts
│       │   │   ├── attempt.ts
│       │   │   ├── wrong.ts
│       │   │   ├── plan.ts
│       │   │   └── session.ts
│       │   ├── hooks/
│       │   │   ├── use-questions.ts
│       │   │   └── use-stats.ts
│       │   └── types/
│       │       └── domain.ts
│       ├── tests/
│       │   ├── judge.test.ts
│       │   ├── wrong-book.test.ts
│       │   ├── stats.test.ts
│       │   └── plan.test.ts
│       ├── public/
│       │   ├── manifest.webmanifest
│       │   ├── sw.js
│       │   └── icons/
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── package.json
│       └── .env.local                       # gitignore
├── packages/
│   ├── db/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── src/index.ts                    # 导出 prisma client
│   │   └── package.json
│   ├── ui/
│   │   ├── src/index.ts
│   │   └── package.json
│   └── importer/
│       ├── src/
│       │   ├── fenbi-import.ts             # 主脚本
│       │   ├── parsers/
│       │   │   ├── json.ts
│       │   │   └── excel.ts
│       │   └── schema.ts                   # 题目 schema 校验
│       ├── tests/
│       │   └── parsers.test.ts
│       ├── tsconfig.json
│       └── package.json
├── docs/superpowers/
│   ├── specs/
│   └── plans/
├── package.json
├── pnpm-workspace.yaml
├── .gitignore
├── .nvmrc
└── README.md
```

---

# W1：脚手架与基础（5-7 天）

## Task 1.1：Monorepo 脚手架

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.nvmrc`, `README.md`

- [ ] **Step 1: 安装 pnpm**

```bash
npm install -g pnpm@9
pnpm --version  # 验证 >= 9
```

- [ ] **Step 2: 写 `package.json`**

```json
{
  "name": "exam-work-station",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @exam/web dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "db:migrate": "pnpm --filter @exam/db prisma migrate dev",
    "db:seed": "pnpm --filter @exam/db seed"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": { "node": ">=20.0.0" }
}
```

- [ ] **Step 3: 写 `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: 写 `.nvmrc` 和 `.gitignore`**

`.nvmrc`:
```
20
```

`.gitignore`（最少包含）：
```
node_modules/
.next/
out/
dist/
build/
.env
.env.local
.env.*.local
*.log
.DS_Store
.pnpm-store/
coverage/
```

- [ ] **Step 5: 安装 workspace 依赖并 commit**

```bash
pnpm install
git add .
git commit -m "chore: monorepo 脚手架 (pnpm workspaces)"
```

---

## Task 1.2：Next.js 应用初始化

**Files:**
- Create: `apps/web/*`（create-next-app 生成）

- [ ] **Step 1: 创建 Next.js 应用**

```bash
cd apps
pnpm create next-app@latest web --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm --no-eslint
cd ..
```

- [ ] **Step 2: 改 `apps/web/package.json` 名称**

```json
{
  "name": "@exam/web",
  "version": "0.1.0",
  ...
}
```

- [ ] **Step 3: 启用 TS strict**

`apps/web/tsconfig.json` 确保 `"strict": true`（create-next-app 默认已开）

- [ ] **Step 4: 本地启动验证**

```bash
pnpm dev
# 浏览器访问 http://localhost:3000 看默认页
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): Next.js 15 应用初始化"
```

---

## Task 1.3：shadcn/ui 集成

**Files:**
- Create: `apps/web/components.json`, `apps/web/src/components/ui/*`
- Modify: `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts`

- [ ] **Step 1: 初始化 shadcn/ui**

```bash
cd apps/web
pnpm dlx shadcn@latest init
# 选择: Default style, Neutral 颜色, CSS variables yes
```

- [ ] **Step 2: 装基础组件**

```bash
pnpm dlx shadcn@latest add button card input label select dialog tabs
```

- [ ] **Step 3: 验证 button 渲染**

修改 `apps/web/src/app/page.tsx`，临时加一个 `<Button>Test</Button>`，浏览器看效果，再回滚。

- [ ] **Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat(web): shadcn/ui 集成 (button/card/input/...)"
```

---

## Task 1.4：packages/db + Prisma 初始化

**Files:**
- Create: `packages/db/package.json`, `packages/db/prisma/schema.prisma`, `packages/db/src/index.ts`, `packages/db/tsconfig.json`
- Create: `apps/web/src/lib/db.ts`

- [ ] **Step 1: 创建 db package**

`packages/db/package.json`:
```json
{
  "name": "@exam/db",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "scripts": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.20.0"
  },
  "devDependencies": {
    "prisma": "^5.20.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

`packages/db/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist" } }
```

- [ ] **Step 2: 装依赖**

```bash
pnpm install
```

- [ ] **Step 3: 写完整 `schema.prisma`**（从 spec §6.1 抄，删除 `@@index` 行如有 schema 报错可调整）

把 spec §6.1 的完整 schema 写入 `packages/db/prisma/schema.prisma`。

- [ ] **Step 4: 写 db 客户端封装**

`packages/db/src/index.ts`:
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: 写 `apps/web/src/lib/db.ts`**

```ts
export { prisma } from '@exam/db';
```

- [ ] **Step 6: 设置 DATABASE_URL**

`apps/web/.env.local`:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/examdb?schema=public"
```

> v1 本地开发用 Docker Postgres 或 Supabase 免费实例。生产用 Vercel Postgres。

- [ ] **Step 7: 跑 prisma generate + 首次 migration**

```bash
pnpm --filter @exam/db prisma generate
pnpm --filter @exam/db prisma migrate dev --name init
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(db): Prisma schema + 客户端 (User/Exam/Question/Attempt/WrongQuestion/StudySession/Plan/PlanTask)"
```

---

## Task 1.5：Auth.js v5 + 邮箱魔法链接

**Files:**
- Create: `apps/web/src/lib/auth.ts`, `apps/web/src/app/api/auth/[...nextauth]/route.ts`, `apps/web/src/app/(auth)/login/page.tsx`
- Modify: `apps/web/src/app/layout.tsx`（加 SessionProvider）

- [ ] **Step 1: 装依赖**

```bash
cd apps/web
pnpm add next-auth@beta @auth/prisma-adapter nodemailer
pnpm add -D @types/nodemailer
```

- [ ] **Step 2: 写 `lib/auth.ts`**

```ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/nodemailer";
import { prisma } from "@exam/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,  // smtp://user:pass@smtp.example.com:587
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "database" },
});
```

> 开发期用 [Mailpit](https://github.com/axllent/mailpit) 或 [Mailtrap](https://mailtrap.io/) 看邮件；生产用 Resend / SendGrid。

- [ ] **Step 3: 写 NextAuth route handler**

`apps/web/src/app/api/auth/[...nextauth]/route.ts`:
```ts
export { GET, POST } from "@/lib/auth";
```

- [ ] **Step 4: 写登录页**

`apps/web/src/app/(auth)/login/page.tsx`:
```tsx
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">登录考公工作台</h1>
      <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      <Button className="mt-4" onClick={() => signIn("nodemailer", { email })}>发送登录链接</Button>
    </div>
  );
}
```

- [ ] **Step 5: 写测试逻辑**

启动 dev server，访问 `/login`，输入邮箱，看 Mailpit/Mailtrap 是否收到邮件，点击链接能跳回应用并登录。

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(web): Auth.js v5 + 邮箱魔法链接登录"
```

---

## Task 1.6：packages/importer 初始化 + JSON 解析器

**Files:**
- Create: `packages/importer/package.json`, `packages/importer/src/parsers/json.ts`, `packages/importer/src/schema.ts`, `packages/importer/tests/parsers.test.ts`

- [ ] **Step 1: 创建 importer package**

`packages/importer/package.json`:
```json
{
  "name": "@exam/importer",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "scripts": { "test": "vitest run" },
  "dependencies": {
    "zod": "^3.23.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: 装依赖**

```bash
pnpm install
```

- [ ] **Step 3: 写题目 schema 校验**

`packages/importer/src/schema.ts`:
```ts
import { z } from "zod";

export const QuestionSchema = z.object({
  module: z.enum(["常识", "言语", "数量", "判断", "资料"]),
  type: z.enum(["单选", "多选", "不定项"]),
  stem: z.string().min(1),
  options: z.array(z.object({ key: z.string(), value: z.string() })).min(2),
  answer: z.string().min(1),
  analysis: z.string().optional(),
  difficulty: z.number().int().min(1).max(5),
  tags: z.array(z.string()).default([]),
  year: z.number().int().optional(),
});

export const ImportFileSchema = z.object({
  examId: z.string(),
  questions: z.array(QuestionSchema),
});

export type ImportQuestion = z.infer<typeof QuestionSchema>;
```

- [ ] **Step 4: 写 JSON 解析器**

`packages/importer/src/parsers/json.ts`:
```ts
import { ImportFileSchema } from "../schema.js";
import type { ImportQuestion } from "../schema.js";

export function parseJsonFile(content: string): ImportQuestion[] {
  const data = JSON.parse(content);
  const parsed = ImportFileSchema.parse(data);
  return parsed.questions;
}
```

- [ ] **Step 5: 写测试**

`packages/importer/tests/parsers.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseJsonFile } from "../src/parsers/json.js";

describe("parseJsonFile", () => {
  it("parses a valid file", () => {
    const content = JSON.stringify({
      examId: "guokao-2024",
      questions: [{
        module: "言语",
        type: "单选",
        stem: "下列词语中正确的是？",
        options: [{ key: "A", value: "正确" }, { key: "B", value: "错" }],
        answer: "A",
        difficulty: 2,
        tags: ["字形"],
      }]
    });
    const result = parseJsonFile(content);
    expect(result).toHaveLength(1);
    expect(result[0].module).toBe("言语");
  });

  it("rejects invalid schema", () => {
    const bad = JSON.stringify({ examId: "x", questions: [{ module: "未知" }] });
    expect(() => parseJsonFile(bad)).toThrow();
  });
});
```

- [ ] **Step 6: 跑测试**

```bash
pnpm --filter @exam/importer test
# Expected: 2 passed
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(importer): JSON 解析器 + Zod 校验 + 测试"
```

---

## Task 1.7：粉笔种子数据 + 导入脚本

**Files:**
- Create: `packages/db/seed-data/guokao-2024/*.json`（5 模块各 50 题）
- Create: `packages/importer/src/fenbi-import.ts`
- Create: `packages/db/prisma/seed.ts`

> **数据准备说明**：v1 不从粉笔 App 实时拉取（合规风险）。手动从粉笔官网/导出的公开真题 PDF/Excel 整理成 JSON 格式存到 `seed-data/`。后期可加 Excel 解析器（v1 阶段先 JSON 即可）。

- [ ] **Step 1: 准备 5 模块种子数据**

`packages/db/seed-data/guokao-2024/常识.json`、`言语.json`、`数量.json`、`判断.json`、`资料.json`，每文件 50 道题。

格式示例（参考 Task 1.6 的 schema）。

- [ ] **Step 2: 写粉笔导入主脚本**

`packages/importer/src/fenbi-import.ts`:
```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@exam/db";
import { parseJsonFile } from "./parsers/json.js";

export async function importFromDir(dir: string, examId: string) {
  const files = readdirSync(dir).filter(f => f.endsWith(".json"));
  let totalImported = 0;
  for (const file of files) {
    const content = readFileSync(join(dir, file), "utf-8");
    const questions = parseJsonFile(content);
    for (const q of questions) {
      await prisma.question.create({
        data: {
          examId,
          module: q.module,
          type: q.type,
          stem: q.stem,
          options: q.options,
          answer: q.answer,
          analysis: q.analysis,
          difficulty: q.difficulty,
          tags: q.tags,
          source: "真题",
          year: q.year,
        },
      });
      totalImported++;
    }
  }
  return totalImported;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , dir, examId] = process.argv;
  importFromDir(dir, examId).then(n => {
    console.log(`✅ 导入 ${n} 道题`);
    process.exit(0);
  });
}
```

- [ ] **Step 3: 写 Prisma seed 脚本**

`packages/db/prisma/seed.ts`:
```ts
import { PrismaClient } from "@prisma/client";
import { importFromDir } from "@exam/importer";

const prisma = new PrismaClient();

async function main() {
  // 确保 exam 存在
  await prisma.exam.upsert({
    where: { id: "guokao-2024" },
    update: {},
    create: { id: "guokao-2024", name: "国考 2024", type: "GUO_KAO", year: 2024 },
  });

  const count = await importFromDir(
    "./seed-data/guokao-2024",
    "guokao-2024"
  );
  console.log(`导入完成：${count} 道题`);
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 4: 跑 seed**

```bash
pnpm --filter @exam/db seed
# Expected: 导入完成：250 道题
```

- [ ] **Step 5: 验证**

```bash
pnpm --filter @exam/db prisma studio
# 浏览器打开 prisma studio，看 Question 表是否有 ~250 条
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(db+importer): 粉笔国考行测种子数据 250 题"
```

---

# W2：刷题核心（5-7 天）

## Task 2.1：判分逻辑（纯函数 + 测试）

**Files:**
- Create: `apps/web/src/lib/judge.ts`, `apps/web/tests/judge.test.ts`

- [ ] **Step 1: 写测试（先失败）**

`apps/web/tests/judge.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { judge } from "@/lib/judge";

describe("judge", () => {
  it("单选：精确匹配", () => {
    expect(judge("单选", "A", "A")).toBe(true);
    expect(judge("单选", "B", "A")).toBe(false);
  });
  it("多选：完全匹配（无序）", () => {
    expect(judge("多选", "ABC", "BCA")).toBe(true);
    expect(judge("多选", "AB", "ABC")).toBe(false);
    expect(judge("多选", "ABC", "ABD")).toBe(false);
  });
  it("不定项：完全匹配", () => {
    expect(judge("不定项", "AC", "CA")).toBe(true);
  });
  it("大小写不敏感", () => {
    expect(judge("单选", "a", "A")).toBe(true);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm --filter @exam/web test
# Expected: 4 failed (judge not defined)
```

- [ ] **Step 3: 实现 judge**

`apps/web/src/lib/judge.ts`:
```ts
export type QuestionType = "单选" | "多选" | "不定项";

function normalize(s: string): string {
  return s.toUpperCase().split("").sort().join("");
}

export function judge(type: QuestionType, userAnswer: string, correctAnswer: string): boolean {
  return normalize(userAnswer) === normalize(correctAnswer);
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm --filter @exam/web test
# Expected: 4 passed
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(web): 客观题判分逻辑 (单选/多选/不定项) + 测试"
```

---

## Task 2.2：server action - question 列表查询

**Files:**
- Create: `apps/web/src/server/actions/question.ts`

- [ ] **Step 1: 写 question list action**

```ts
"use server";
import { prisma } from "@/lib/db";

export type ListQuestionsInput = {
  examId?: string;
  module?: string;
  difficulty?: number;
  tags?: string[];
  page?: number;
  pageSize?: number;
};

export async function listQuestions(input: ListQuestionsInput = {}) {
  const { examId, module, difficulty, tags, page = 1, pageSize = 20 } = input;
  const where: any = {};
  if (examId) where.examId = examId;
  if (module) where.module = module;
  if (difficulty) where.difficulty = difficulty;
  if (tags?.length) where.tags = { hasSome: tags };

  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.question.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getQuestion(id: string) {
  return prisma.question.findUnique({ where: { id } });
}
```

- [ ] **Step 2: 浏览器/curl 自测**

```bash
pnpm dev
# 在 RSC 里直接调用 listQuestions({}) 验证返回
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): question 列表/详情 server action"
```

---

## Task 2.3：题库列表页

**Files:**
- Create: `apps/web/src/app/(main)/questions/page.tsx`, `apps/web/src/components/question-card.tsx`

- [ ] **Step 1: 写 QuestionCard 组件**

`apps/web/src/components/question-card.tsx`:
```tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function QuestionCard({ q }: { q: { id: string; module: string; type: string; stem: string; difficulty: number; tags: string[] } }) {
  return (
    <Link href={`/questions/${q.id}`}>
      <Card className="p-4 hover:bg-accent">
        <div className="flex gap-2 mb-2">
          <Badge>{q.module}</Badge>
          <Badge variant="outline">{q.type}</Badge>
          <Badge variant="secondary">难度 {q.difficulty}</Badge>
        </div>
        <p className="line-clamp-2">{q.stem}</p>
        <div className="flex gap-1 mt-2">
          {q.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: 写题库列表页**

`apps/web/src/app/(main)/questions/page.tsx`:
```tsx
import { listQuestions } from "@/server/actions/question";
import { QuestionCard } from "@/components/question-card";
import { Select } from "@/components/ui/select";

export default async function QuestionsPage({ searchParams }: { searchParams: { module?: string } }) {
  const { items, total } = await listQuestions({ module: searchParams.module });
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">题库（{total}）</h1>
      <form className="mb-4">
        <Select name="module" defaultValue={searchParams.module}>
          <option value="">全部模块</option>
          <option value="常识">常识</option>
          <option value="言语">言语</option>
          <option value="数量">数量</option>
          <option value="判断">判断</option>
          <option value="资料">资料</option>
        </Select>
      </form>
      <div className="space-y-3">
        {items.map(q => <QuestionCard key={q.id} q={q} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 浏览器验证**

访问 `/questions`，看到题列表；切换模块筛选能过滤。

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): 题库列表页 + 筛选"
```

---

## Task 2.4：题目详情页（解析 + 笔记）

**Files:**
- Create: `apps/web/src/app/(main)/questions/[id]/page.tsx`

- [ ] **Step 1: 写详情页**

```tsx
import { notFound } from "next/navigation";
import { getQuestion } from "@/server/actions/question";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function QuestionDetailPage({ params }: { params: { id: string } }) {
  const q = await getQuestion(params.id);
  if (!q) notFound();

  const options = (q.options as Array<{ key: string; value: string }>) || [];

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex gap-2">
        <Badge>{q.module}</Badge>
        <Badge variant="outline">{q.type}</Badge>
        <Badge variant="secondary">难度 {q.difficulty}</Badge>
      </div>
      <Card className="p-6">
        <p className="text-lg mb-4 whitespace-pre-wrap">{q.stem}</p>
        <div className="space-y-2">
          {options.map(o => (
            <div key={o.key} className={`p-3 rounded border ${o.key === q.answer ? "border-green-500 bg-green-50" : ""}`}>
              <strong>{o.key}.</strong> {o.value}
            </div>
          ))}
        </div>
      </Card>
      {q.analysis && (
        <Card className="p-6 bg-blue-50">
          <h3 className="font-bold mb-2">解析</h3>
          <p className="whitespace-pre-wrap">{q.analysis}</p>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 浏览器验证**

从列表点进详情，看到题干、选项、答案高亮、解析。

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): 题目详情页 (含答案+解析)"
```

---

## Task 2.5：逐题练习 Session 启动

**Files:**
- Create: `apps/web/src/server/actions/session.ts`, `apps/web/src/app/(main)/practice/new/page.tsx`

- [ ] **Step 1: 写 session action**

`apps/web/src/server/actions/session.ts`:
```ts
"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export type StartSessionInput = {
  mode: "逐题";
  modules?: string[];
  difficulty?: number;
  count: number;
};

export async function startSession(input: StartSessionInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const where: any = {};
  if (input.modules?.length) where.module = { in: input.modules };
  if (input.difficulty) where.difficulty = input.difficulty;

  const questions = await prisma.question.findMany({ where, take: input.count, orderBy: { id: "asc" } });

  const studySession = await prisma.studySession.create({
    data: {
      userId: session.user.id,
      mode: input.mode,
      config: input as any,
    },
  });

  return { sessionId: studySession.id, questionIds: questions.map(q => q.id) };
}
```

- [ ] **Step 2: 写新练习配置页**

`apps/web/src/app/(main)/practice/new/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startSession } from "@/server/actions/session";

export default function NewPracticePage() {
  const router = useRouter();
  const [count, setCount] = useState(20);
  const [module, setModule] = useState<string>("");

  async function handleStart() {
    const res = await startSession({ mode: "逐题", count, modules: module ? [module] : undefined });
    router.push(`/practice/${res.sessionId}`);
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">新建练习</h1>
      <div>
        <label>模块</label>
        <select value={module} onChange={e => setModule(e.target.value)} className="border rounded p-2 w-full">
          <option value="">不限</option>
          <option value="常识">常识</option>
          <option value="言语">言语</option>
          <option value="数量">数量</option>
          <option value="判断">判断</option>
          <option value="资料">资料</option>
        </select>
      </div>
      <div>
        <label>题数</label>
        <Input type="number" value={count} onChange={e => setCount(+e.target.value)} min={1} max={100} />
      </div>
      <Button onClick={handleStart}>开始</Button>
    </div>
  );
}
```

- [ ] **Step 3: 浏览器验证**

访问 `/practice/new`，配置后点开始，跳到 `/practice/{id}`（虽然该页面还没建，但 URL 应该生成）。

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): 新建练习 + Session 启动"
```

---

## Task 2.6：答题交互 + 判分 + 入库

**Files:**
- Create: `apps/web/src/server/actions/attempt.ts`, `apps/web/src/app/(main)/practice/[sessionId]/page.tsx`, `apps/web/src/components/practice-session.tsx`

> **注意**：W3 任务 3.1 才会加错题归集；这里 attempt 写入后**不**触发错题逻辑（仅写 Attempt + 更新 StudySession.stats）。

- [ ] **Step 1: 写 attempt action**

`apps/web/src/server/actions/attempt.ts`:
```ts
"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { judge } from "@/lib/judge";
import { revalidatePath } from "next/cache";

export async function submitAnswer(input: { questionId: string; userAnswer: string; durationMs: number; mode: string; sessionId: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const q = await prisma.question.findUnique({ where: { id: input.questionId } });
  if (!q) throw new Error("Question not found");

  const isCorrect = judge(q.type as any, input.userAnswer, q.answer);

  await prisma.attempt.create({
    data: {
      userId: session.user.id,
      questionId: input.questionId,
      userAnswer: input.userAnswer,
      isCorrect,
      durationMs: input.durationMs,
      mode: input.mode,
    },
  });

  // 更新 StudySession.stats
  const study = await prisma.studySession.findUnique({ where: { id: input.sessionId } });
  if (study) {
    const stats = (study.stats as any) || { total: 0, correct: 0, byModule: {} };
    stats.total += 1;
    if (isCorrect) stats.correct += 1;
    stats.byModule[q.module] = stats.byModule[q.module] || { total: 0, correct: 0 };
    stats.byModule[q.module].total += 1;
    if (isCorrect) stats.byModule[q.module].correct += 1;
    await prisma.studySession.update({ where: { id: input.sessionId }, data: { stats } });
  }

  revalidatePath("/stats");
  return { isCorrect, correctAnswer: q.answer, analysis: q.analysis };
}
```

- [ ] **Step 2: 写练习组件**

`apps/web/src/components/practice-session.tsx`:
```tsx
"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { submitAnswer } from "@/server/actions/attempt";
import type { Question } from "@prisma/client";

type Q = Question & { options: Array<{ key: string; value: string }> | null };

export function PracticeSession({ questions, sessionId }: { questions: Q[]; sessionId: string }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string; analysis: string | null } | null>(null);
  const [startTime] = useState(Date.now());

  const q = questions[idx];
  if (!q) return <div className="p-4">练习完成！</div>;
  const options = (q.options as any) || [];

  async function handleSubmit() {
    const r = await submitAnswer({
      questionId: q.id, userAnswer: selected, durationMs: Date.now() - startTime,
      mode: "逐题", sessionId,
    });
    setResult(r);
  }

  function handleNext() {
    setIdx(idx + 1);
    setSelected("");
    setResult(null);
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="text-sm text-muted-foreground">第 {idx + 1} / {questions.length} 题</div>
      <Card className="p-6">
        <p className="text-lg mb-4 whitespace-pre-wrap">{q.stem}</p>
        <div className="space-y-2">
          {options.map((o: any) => (
            <button
              key={o.key}
              onClick={() => !result && setSelected(o.key)}
              disabled={!!result}
              className={`w-full text-left p-3 rounded border ${selected === o.key ? "border-primary bg-primary/10" : ""} ${
                result && o.key === result.correctAnswer ? "border-green-500 bg-green-50" : ""
              } ${result && selected === o.key && !result.isCorrect ? "border-red-500 bg-red-50" : ""}`}
            >
              <strong>{o.key}.</strong> {o.value}
            </button>
          ))}
        </div>
      </Card>

      {!result ? (
        <Button onClick={handleSubmit} disabled={!selected} className="w-full">提交</Button>
      ) : (
        <>
          {result.analysis && (
            <Card className="p-4 bg-blue-50">
              <h4 className="font-bold mb-2">解析</h4>
              <p className="whitespace-pre-wrap">{result.analysis}</p>
            </Card>
          )}
          <Button onClick={handleNext} className="w-full">下一题</Button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 写练习页**

`apps/web/src/app/(main)/practice/[sessionId]/page.tsx`:
```tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PracticeSession } from "@/components/practice-session";

export default async function PracticePage({ params, searchParams }: { params: { sessionId: string }; searchParams: { ids?: string } }) {
  if (!searchParams.ids) notFound();
  const ids = searchParams.ids.split(",");
  const questions = await prisma.question.findMany({ where: { id: { in: ids } } });
  return <PracticeSession questions={questions as any} sessionId={params.sessionId} />;
}
```

> **简化说明**：v1 通过 URL query 传题目 ID 列表（保持简单）。v1.1 改为 StudySession 关联 QuestionSessionItem 表。

- [ ] **Step 4: 更新 startSession 返回 questionIds 并跳转到带 query 的 URL**

修改 Task 2.5 的 `handleStart`：
```ts
router.push(`/practice/${res.sessionId}?ids=${res.questionIds.join(",")}`);
```

- [ ] **Step 5: 浏览器验证**

走完一遍：新建练习 → 答题 → 看到判分结果 → 下一题。

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(web): 答题交互 + 判分 + Attempt 入库"
```

---

## Task 2.7：移动端响应式基础

**Files:**
- Modify: `apps/web/src/app/(main)/layout.tsx`, 各页面
- Create: `apps/web/src/components/nav-tabs.tsx`

- [ ] **Step 1: 写 NavTabs 组件**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "首页" },
  { href: "/questions", label: "题库" },
  { href: "/practice/new", label: "练习" },
  { href: "/mistakes", label: "错题" },
  { href: "/stats", label: "统计" },
];

export function NavTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:static md:border-b md:border-t-0">
      <div className="flex justify-around md:justify-start md:gap-6">
        {tabs.map(t => (
          <Link key={t.href} href={t.href} className={cn("p-3 text-sm md:text-base", pathname === t.href && "font-bold text-primary")}>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: 在 main layout 引入**

`apps/web/src/app/(main)/layout.tsx`:
```tsx
import { NavTabs } from "@/components/nav-tabs";
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16 md:pb-0">
      <NavTabs />
      {children}
    </div>
  );
}
```

- [ ] **Step 3: 真机/浏览器 dev tools 测**

切到 iPhone/Android 视图，验证：底部 Tab、字号合理、按钮可点。

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): 移动端响应式 + 底部导航"
```

---

# W3：错题本 + 基础统计（5-7 天）

## Task 3.1：错题归集逻辑（lib/wrong-book.ts）

**Files:**
- Create: `apps/web/src/lib/wrong-book.ts`, `apps/web/tests/wrong-book.test.ts`

- [ ] **Step 1: 写测试**

```ts
import { describe, it, expect, vi } from "vitest";
import { updateOnWrong, updateOnCorrect, MASTERY_THRESHOLD } from "@/lib/wrong-book";

describe("wrong-book", () => {
  it("updateOnWrong: 新错题创建", async () => {
    const fakePrisma = {
      wrongQuestion: {
        upsert: vi.fn().mockResolvedValue({ wrongCount: 1, correctCount: 0, mastered: false }),
      },
    };
    await updateOnWrong("u1", "q1", fakePrisma as any);
    expect(fakePrisma.wrongQuestion.upsert).toHaveBeenCalledWith({
      where: { userId_questionId: { userId: "u1", questionId: "q1" } },
      create: expect.objectContaining({ wrongCount: 1, correctCount: 0, mastered: false }),
      update: expect.objectContaining({ wrongCount: { increment: 1 }, correctCount: 0, mastered: false, masteredAt: null }),
    });
  });

  it("updateOnCorrect: 答对一次 correctCount 增 1", async () => {
    const existing = { wrongCount: 2, correctCount: 1, mastered: false };
    const fakePrisma = {
      wrongQuestion: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue({ ...existing, correctCount: 2 }),
      },
    };
    await updateOnCorrect("u1", "q1", fakePrisma as any);
    expect(fakePrisma.wrongQuestion.update).toHaveBeenCalledWith({
      where: { userId_questionId: { userId: "u1", questionId: "q1" } },
      data: { correctCount: { increment: 1 } },
    });
  });

  it("updateOnCorrect: 达到阈值自动 mark mastered", async () => {
    const existing = { wrongCount: 2, correctCount: MASTERY_THRESHOLD - 1, mastered: false };
    const fakePrisma = {
      wrongQuestion: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue({ ...existing, correctCount: 3, mastered: true }),
      },
    };
    await updateOnCorrect("u1", "q1", fakePrisma as any);
    const call = fakePrisma.wrongQuestion.update.mock.calls[0][0];
    expect(call.data).toMatchObject({ correctCount: { increment: 1 }, mastered: true });
    expect(call.data.masteredAt).toBeInstanceOf(Date);
  });

  it("updateOnCorrect: 已掌握不重复触发", async () => {
    const existing = { wrongCount: 2, correctCount: 5, mastered: true };
    const fakePrisma = {
      wrongQuestion: {
        findUnique: vi.fn().mockResolvedValue(existing),
        update: vi.fn(),
      },
    };
    await updateOnCorrect("u1", "q1", fakePrisma as any);
    expect(fakePrisma.wrongQuestion.update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm --filter @exam/web test
# Expected: 4 failed
```

- [ ] **Step 3: 实现 wrong-book**

`apps/web/src/lib/wrong-book.ts`:
```ts
import type { PrismaClient } from "@prisma/client";

export const MASTERY_THRESHOLD = 3;

export async function updateOnWrong(userId: string, questionId: string, prisma: PrismaClient) {
  await prisma.wrongQuestion.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: { userId, questionId, wrongCount: 1, correctCount: 0, mastered: false },
    update: {
      wrongCount: { increment: 1 },
      correctCount: 0,
      mastered: false,
      masteredAt: null,
      lastWrongAt: new Date(),
    },
  });
}

export async function updateOnCorrect(userId: string, questionId: string, prisma: PrismaClient) {
  const existing = await prisma.wrongQuestion.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });
  if (!existing || existing.mastered) return;

  const newCorrectCount = existing.correctCount + 1;
  const shouldMaster = newCorrectCount >= MASTERY_THRESHOLD;

  await prisma.wrongQuestion.update({
    where: { userId_questionId: { userId, questionId } },
    data: {
      correctCount: { increment: 1 },
      ...(shouldMaster ? { mastered: true, masteredAt: new Date() } : {}),
    },
  });
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm --filter @exam/web test
# Expected: 4 passed
```

- [ ] **Step 5: 接入 submitAnswer**

修改 Task 2.6 的 `submitAnswer`：
```ts
import { updateOnWrong, updateOnCorrect } from "@/lib/wrong-book";
// ... 判分后
if (!isCorrect) {
  await updateOnWrong(session.user.id, input.questionId, prisma);
} else {
  await updateOnCorrect(session.user.id, input.questionId, prisma);
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(web): 错题归集逻辑 (答对3次=掌握) + 接入答题流程"
```

---

## Task 3.2：错题本列表页

**Files:**
- Create: `apps/web/src/server/actions/wrong.ts`, `apps/web/src/app/(main)/mistakes/page.tsx`

- [ ] **Step 1: 写 listWrong action**

```ts
"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function listWrongQuestions(filter: { module?: string; mastered?: boolean } = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.wrongQuestion.findMany({
    where: {
      userId: session.user.id,
      ...(filter.module ? { question: { module: filter.module } } : {}),
      ...(filter.mastered !== undefined ? { mastered: filter.mastered } : {}),
    },
    include: { question: true },
    orderBy: [{ mastered: "asc" }, { lastWrongAt: "desc" }],
  });
}
```

- [ ] **Step 2: 写错题本页**

```tsx
import Link from "next/link";
import { listWrongQuestions } from "@/server/actions/wrong";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MistakesPage({ searchParams }: { searchParams: { module?: string; mastered?: string } }) {
  const filter: any = {};
  if (searchParams.module) filter.module = searchParams.module;
  if (searchParams.mastered === "true") filter.mastered = true;
  if (searchParams.mastered === "false") filter.mastered = false;

  const items = await listWrongQuestions(filter);
  return (
    <div className="p-4 max-w-3xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">错题本（{items.length}）</h1>
      <div className="flex gap-2 flex-wrap">
        <Link href="/mistakes"><Badge>全部</Badge></Link>
        <Link href="/mistakes?mastered=false"><Badge variant="destructive">未掌握</Badge></Link>
        <Link href="/mistakes?mastered=true"><Badge variant="secondary">已掌握</Badge></Link>
      </div>
      {items.map(item => (
        <Link key={item.id} href={`/mistakes/${item.questionId}`}>
          <Card className="p-4 hover:bg-accent">
            <div className="flex gap-2 mb-2">
              <Badge>{item.question.module}</Badge>
              {item.mastered && <Badge variant="secondary">已掌握</Badge>}
              <Badge variant="outline">答错 {item.wrongCount} 次 / 答对 {item.correctCount} 次</Badge>
            </div>
            <p className="line-clamp-2">{item.question.stem}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 浏览器验证**

走完 2.6 流程答错几题，再访问 `/mistakes`，看到错题。

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): 错题本列表页 + 筛选"
```

---

## Task 3.3：错题重做页

**Files:**
- Create: `apps/web/src/app/(main)/mistakes/[id]/page.tsx`

> 重做流程复用 Task 2.6 的 practice-session 组件（从错题 ID 拿题目）。

- [ ] **Step 1: 写重做页**

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PracticeSession } from "@/components/practice-session";

export default async function MistakeRedoPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const question = await prisma.question.findUnique({ where: { id: params.id } });
  if (!question) notFound();

  // 临时建一个 StudySession 用于复用 practice-session
  const study = await prisma.studySession.create({
    data: { userId: session.user.id, mode: "错题重做", config: { questionId: params.id } as any },
  });

  return <PracticeSession questions={[question as any]} sessionId={study.id} />;
}
```

- [ ] **Step 2: 浏览器验证**

错题本点进重做，答对 3 次后回错题本，看"已掌握"标。

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): 错题重做页"
```

---

## Task 3.4：错题笔记

**Files:**
- Modify: `apps/web/src/server/actions/wrong.ts`, `apps/web/src/app/(main)/mistakes/[id]/page.tsx`

- [ ] **Step 1: 加 saveNote action**

```ts
export async function saveNote(questionId: string, note: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.wrongQuestion.update({
    where: { userId_questionId: { userId: session.user.id, questionId } },
    data: { notes: note },
  });
}
```

- [ ] **Step 2: 在重做页加笔记 UI**

在 `practice-session.tsx` 的"解析"卡片下加：
```tsx
<Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="写笔记..." />
<Button onClick={() => saveNote(q.id, note)}>保存笔记</Button>
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): 错题笔记保存"
```

---

## Task 3.5：统计聚合逻辑（lib/stats.ts）

**Files:**
- Create: `apps/web/src/lib/stats.ts`, `apps/web/tests/stats.test.ts`

- [ ] **Step 1: 写测试**

```ts
import { describe, it, expect, vi } from "vitest";
import { aggregateByModule, aggregateDaily } from "@/lib/stats";

describe("stats.aggregateByModule", () => {
  it("按模块聚合正确率", () => {
    const attempts = [
      { isCorrect: true, question: { module: "言语" } },
      { isCorrect: false, question: { module: "言语" } },
      { isCorrect: true, question: { module: "数量" } },
    ];
    expect(aggregateByModule(attempts)).toEqual({
      言语: { total: 2, correct: 1, accuracy: 0.5 },
      数量: { total: 1, correct: 1, accuracy: 1 },
    });
  });
});

describe("stats.aggregateDaily", () => {
  it("按日期聚合", () => {
    const attempts = [
      { isCorrect: true, createdAt: new Date("2024-01-01") },
      { isCorrect: false, createdAt: new Date("2024-01-01") },
      { isCorrect: true, createdAt: new Date("2024-01-02") },
    ];
    const r = aggregateDaily(attempts, 7);
    expect(r["2024-01-01"]).toEqual({ total: 2, correct: 1, accuracy: 0.5 });
  });
});
```

- [ ] **Step 2: 实现**

`apps/web/src/lib/stats.ts`:
```ts
type AttemptLite = { isCorrect: boolean; createdAt: Date; question?: { module: string } };

export function aggregateByModule(attempts: AttemptLite[]) {
  const map: Record<string, { total: number; correct: number; accuracy: number }> = {};
  for (const a of attempts) {
    const m = a.question?.module || "未知";
    if (!map[m]) map[m] = { total: 0, correct: 0, accuracy: 0 };
    map[m].total += 1;
    if (a.isCorrect) map[m].correct += 1;
  }
  for (const k of Object.keys(map)) {
    map[k].accuracy = map[k].total > 0 ? map[k].correct / map[k].total : 0;
  }
  return map;
}

export function aggregateDaily(attempts: AttemptLite[], days: number) {
  const map: Record<string, { total: number; correct: number; accuracy: number }> = {};
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map[d.toISOString().slice(0, 10)] = { total: 0, correct: 0, accuracy: 0 };
  }
  for (const a of attempts) {
    const key = a.createdAt.toISOString().slice(0, 10);
    if (!map[key]) continue;
    map[key].total += 1;
    if (a.isCorrect) map[key].correct += 1;
  }
  for (const k of Object.keys(map)) {
    map[k].accuracy = map[k].total > 0 ? map[k].correct / map[k].total : 0;
  }
  return map;
}
```

- [ ] **Step 3: 跑测试**

```bash
pnpm --filter @exam/web test
# Expected: all passed
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): 统计聚合 (按模块/按日期) + 测试"
```

---

## Task 3.6：统计页（Recharts 图表）

**Files:**
- Create: `apps/web/src/app/(main)/stats/page.tsx`, `apps/web/src/components/stats-chart.tsx`
- Modify: `apps/web/package.json`（装 recharts）

- [ ] **Step 1: 装 Recharts**

```bash
cd apps/web && pnpm add recharts
```

- [ ] **Step 2: 写 StatsChart 组件**

```tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, ResponsiveContainer } from "recharts";

export function DailyChart({ data }: { data: Array<{ date: string; total: number; correct: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="total" stroke="#8884d8" />
        <Line type="monotone" dataKey="correct" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ModuleChart({ data }: { data: Array<{ module: string; accuracy: number; total: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="module" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="accuracy" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: 写统计页**

```tsx
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { aggregateByModule, aggregateDaily } from "@/lib/stats";
import { DailyChart, ModuleChart } from "@/components/stats-chart";

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) return <div className="p-4">请先登录</div>;

  const attempts = await prisma.attempt.findMany({
    where: { userId: session.user.id },
    include: { question: { select: { module: true } } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const byModule = aggregateByModule(attempts as any);
  const daily = aggregateDaily(attempts as any, 7);

  const totalCorrect = attempts.filter(a => a.isCorrect).length;
  const accuracy = attempts.length > 0 ? totalCorrect / attempts.length : 0;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">学习统计</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <div className="text-sm text-muted-foreground">总做题数</div>
          <div className="text-2xl font-bold">{attempts.length}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-muted-foreground">总正确率</div>
          <div className="text-2xl font-bold">{(accuracy * 100).toFixed(1)}%</div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-2">近 7 天</h2>
        <DailyChart data={Object.entries(daily).map(([date, v]) => ({ date, ...v })).reverse()} />
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">模块正确率</h2>
        <ModuleChart data={Object.entries(byModule).map(([m, v]) => ({ module: m, ...v }))} />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 浏览器验证**

答过几题后访问 `/stats`，看到图表。

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(web): 统计页 (Recharts 折线+柱状)"
```

---

# W4：手动计划 + 进度可视化（5-7 天）

## Task 4.1：Plan CRUD server actions

**Files:**
- Create: `apps/web/src/server/actions/plan.ts`

- [ ] **Step 1: 写 actions**

```ts
"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateDailyTasks } from "@/lib/plan";

export async function createPlan(input: { title: string; targetExam: string; startDate: Date; endDate: Date; dailyCount: number }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const plan = await prisma.plan.create({
    data: {
      userId: session.user.id,
      title: input.title,
      targetExam: input.targetExam,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "active",
    },
  });

  const tasks = generateDailyTasks(plan, input.dailyCount);
  await prisma.planTask.createMany({ data: tasks });

  return plan;
}

export async function listPlans() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlan(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.plan.findUnique({
    where: { id, userId: session.user.id },
    include: { tasks: { orderBy: { date: "asc" } } },
  });
}

export async function archivePlan(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.plan.update({
    where: { id, userId: session.user.id },
    data: { status: "archived" },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(web): Plan CRUD server actions"
```

---

## Task 4.2：每日任务生成逻辑（lib/plan.ts）

**Files:**
- Create: `apps/web/src/lib/plan.ts`, `apps/web/tests/plan.test.ts`

- [ ] **Step 1: 写测试**

```ts
import { describe, it, expect } from "vitest";
import { generateDailyTasks } from "@/lib/plan";

describe("generateDailyTasks", () => {
  it("按天生成任务，模块轮换", () => {
    const plan = { id: "p1", startDate: new Date("2024-01-01"), endDate: new Date("2024-01-03") } as any;
    const tasks = generateDailyTasks(plan, 30);
    expect(tasks).toHaveLength(3);
    expect(tasks[0].date.toISOString().slice(0, 10)).toBe("2024-01-01");
    expect(tasks[0].module).toBe("言语");  // 默认从言语开始
    expect(tasks[1].module).toBe("数量");
  });

  it("每天 30 道题", () => {
    const plan = { id: "p1", startDate: new Date("2024-01-01"), endDate: new Date("2024-01-02") } as any;
    const tasks = generateDailyTasks(plan, 30);
    expect(tasks[0].target).toEqual({ type: "questions", count: 30 });
  });
});
```

- [ ] **Step 2: 实现**

`apps/web/src/lib/plan.ts`:
```ts
const MODULES = ["常识", "言语", "数量", "判断", "资料"];

export function generateDailyTasks(plan: { id: string; startDate: Date; endDate: Date }, dailyCount: number) {
  const tasks: Array<{ planId: string; date: Date; module: string; target: any; status: string; doneCount: number }> = [];
  const days = Math.ceil((plan.endDate.getTime() - plan.startDate.getTime()) / 86400000) + 1;
  for (let i = 0; i < days; i++) {
    const d = new Date(plan.startDate);
    d.setDate(d.getDate() + i);
    tasks.push({
      planId: plan.id,
      date: d,
      module: MODULES[i % MODULES.length],
      target: { type: "questions", count: dailyCount },
      status: "pending",
      doneCount: 0,
    });
  }
  return tasks;
}

export function computeProgress(tasks: Array<{ status: string }>) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const partial = tasks.filter(t => t.status === "partial").length;
  return { total, done, partial, percentage: total > 0 ? (done + partial * 0.5) / total : 0 };
}
```

- [ ] **Step 3: 跑测试**

```bash
pnpm --filter @exam/web test
# Expected: 2 passed
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): 每日任务生成 + 进度计算 + 测试"
```

---

## Task 4.3：计划列表 + 创建页

**Files:**
- Create: `apps/web/src/app/(main)/plans/page.tsx`, `apps/web/src/app/(main)/plans/new/page.tsx`

- [ ] **Step 1: 计划列表页**

```tsx
import Link from "next/link";
import { listPlans } from "@/server/actions/plan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function PlansPage() {
  const plans = await listPlans();
  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">个人计划</h1>
        <Link href="/plans/new"><Button>新建</Button></Link>
      </div>
      {plans.map(p => (
        <Link key={p.id} href={`/plans/${p.id}`}>
          <Card className="p-4 hover:bg-accent">
            <div className="font-bold">{p.title}</div>
            <div className="text-sm text-muted-foreground">
              {p.startDate.toISOString().slice(0, 10)} ~ {p.endDate.toISOString().slice(0, 10)} · {p.status}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 创建页**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPlan } from "@/server/actions/plan";

export default function NewPlanPage() {
  const router = useRouter();
  const [title, setTitle] = useState("国考冲刺 90 天");
  const [days, setDays] = useState(90);
  const [dailyCount, setDailyCount] = useState(30);

  async function handleCreate() {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const plan = await createPlan({
      title, targetExam: "guokao-2024", startDate, endDate, dailyCount,
    });
    router.push(`/plans/${plan.id}`);
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">新建计划</h1>
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="计划标题" />
      <Input type="number" value={days} onChange={e => setDays(+e.target.value)} placeholder="天数" />
      <Input type="number" value={dailyCount} onChange={e => setDailyCount(+e.target.value)} placeholder="每日题数" />
      <Button onClick={handleCreate}>创建</Button>
    </div>
  );
}
```

- [ ] **Step 3: 浏览器验证**

新建计划，跳到详情（虽然还没建，先看 URL）。

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): 计划列表+创建页"
```

---

## Task 4.4：计划详情页 + 任务展示

**Files:**
- Create: `apps/web/src/app/(main)/plans/[planId]/page.tsx`, `apps/web/src/components/plan-card.tsx`

- [ ] **Step 1: 写 PlanCard**

```tsx
"use client";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function PlanCard({ task, q }: { task: { id: string; date: Date; module: string; target: any; status: string; doneCount: number }; q: { id: string } | null }) {
  return (
    <Card className="p-3">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm text-muted-foreground">{new Date(task.date).toISOString().slice(0, 10)}</div>
          <div className="font-medium">{task.module} · {(task.target as any).count} 题</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">{task.status}</div>
          {q && <Link href={`/practice/new?planTaskId=${task.id}&module=${task.module}&count=${(task.target as any).count}`} className="text-primary text-sm">开始 →</Link>}
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: 写详情页**

```tsx
import { notFound } from "next/navigation";
import { getPlan } from "@/server/actions/plan";
import { computeProgress } from "@/lib/plan";
import { PlanCard } from "@/components/plan-card";

export default async function PlanDetailPage({ params }: { params: { planId: string } }) {
  const plan = await getPlan(params.planId);
  if (!plan) notFound();

  const progress = computeProgress(plan.tasks);
  const daysLeft = Math.max(0, Math.ceil((plan.endDate.getTime() - Date.now()) / 86400000));

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{plan.title}</h1>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">完成度</div>
          <div className="text-lg font-bold">{(progress.percentage * 100).toFixed(0)}%</div>
        </div>
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">已完成/总</div>
          <div className="text-lg font-bold">{progress.done}/{progress.total}</div>
        </div>
        <div className="border rounded p-2">
          <div className="text-xs text-muted-foreground">剩余天数</div>
          <div className="text-lg font-bold">{daysLeft}</div>
        </div>
      </div>
      <div className="space-y-2">
        {plan.tasks.map(t => <PlanCard key={t.id} task={t} q={{ id: t.id }} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): 计划详情页 + 进度卡片"
```

---

## Task 4.5：Attempt 自动 mark PlanTask done

**Files:**
- Modify: `apps/web/src/server/actions/attempt.ts`

- [ ] **Step 1: 加 markPlanTasksDone 逻辑**

在 `submitAnswer` 末尾加：
```ts
// 自动 mark 当日匹配的 PlanTask
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const targetCount = (study?.config as any)?.count || 30;

const planTasks = await prisma.planTask.findMany({
  where: {
    plan: { userId: session.user.id, status: "active" },
    date: { gte: today, lt: tomorrow },
    module: q.module,
    status: "pending",
  },
});

for (const t of planTasks) {
  const target = t.target as any;
  const newDone = t.doneCount + 1;
  const status = newDone >= target.count ? "done" : "partial";
  await prisma.planTask.update({
    where: { id: t.id },
    data: { doneCount: newDone, status },
  });
}
```

- [ ] **Step 2: 浏览器验证**

今天建一个计划，做练习，看计划详情页 doneCount 增长。

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): Attempt 自动 mark PlanTask done"
```

---

## Task 4.6：首页 Dashboard

**Files:**
- Create: `apps/web/src/app/(main)/page.tsx`

- [ ] **Step 1: 写首页**

```tsx
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return <div className="p-4">请先登录</div>;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTasks, todayAttempts, recentWrong, activePlans] = await Promise.all([
    prisma.planTask.findMany({
      where: { plan: { userId: session.user.id, status: "active" }, date: { gte: today, lt: tomorrow } },
      include: { plan: true },
    }),
    prisma.attempt.count({
      where: { userId: session.user.id, createdAt: { gte: today } },
    }),
    prisma.wrongQuestion.count({
      where: { userId: session.user.id, mastered: false },
    }),
    prisma.plan.count({ where: { userId: session.user.id, status: "active" } }),
  ]);

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">你好 👋</h1>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Card className="p-3"><div className="text-xs text-muted-foreground">今日做题</div><div className="text-xl font-bold">{todayAttempts}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">未掌握错题</div><div className="text-xl font-bold">{recentWrong}</div></Card>
        <Card className="p-3"><div className="text-xs text-muted-foreground">活跃计划</div><div className="text-xl font-bold">{activePlans}</div></Card>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-2">今日任务</h2>
        {todayTasks.length === 0 ? (
          <Card className="p-4 text-muted-foreground text-sm">今日无任务</Card>
        ) : (
          <div className="space-y-2">
            {todayTasks.map(t => (
              <Card key={t.id} className="p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{t.plan.title} · {t.module}</div>
                  <div className="text-xs text-muted-foreground">{t.doneCount} / {(t.target as any).count}</div>
                </div>
                <Link href={`/practice/new?module=${t.module}&count=${(t.target as any).count}`}>
                  <Button size="sm">开始</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">快速入口</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/questions"><Button variant="outline" className="w-full">浏览题库</Button></Link>
          <Link href="/mistakes"><Button variant="outline" className="w-full">复习错题</Button></Link>
          <Link href="/stats"><Button variant="outline" className="w-full">查看统计</Button></Link>
          <Link href="/plans"><Button variant="outline" className="w-full">管理计划</Button></Link>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 浏览器验证**

登录后访问 `/`，看到 dashboard。

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): 首页 dashboard"
```

---

# W5：PWA + 部署 + 收尾（5-7 天）

## Task 5.1：PWA manifest + Service Worker 基础

**Files:**
- Create: `apps/web/public/manifest.webmanifest`, `apps/web/public/sw.js`, `apps/web/public/icons/icon-192.png`（占位）
- Modify: `apps/web/src/app/layout.tsx`（加 link）

- [ ] **Step 1: 写 manifest**

```json
{
  "name": "考公工作台",
  "short_name": "考工",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: 写 sw.js（最小可工作版）**

```js
const CACHE = "exam-v1";
const SHELL = ["/", "/questions", "/practice/new", "/mistakes", "/stats", "/plans", "/manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok && e.request.url.startsWith(self.location.origin)) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match("/")))
  );
});
```

- [ ] **Step 3: 在 layout.tsx 注册**

```tsx
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#000000" />
<script dangerouslySetInnerHTML={{ __html: `
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
` }} />
```

- [ ] **Step 4: 浏览器验证**

DevTools → Application → Manifest 看 PWA 信息；Lighthouse 跑 PWA 评分。

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(web): PWA manifest + Service Worker 基础"
```

---

## Task 5.2：离线题目缓存（IndexedDB）

**Files:**
- Create: `apps/web/src/lib/offline-db.ts`, `apps/web/src/lib/question-cache.ts`

- [ ] **Step 1: 装 idb-keyval**

```bash
cd apps/web && pnpm add idb-keyval
```

- [ ] **Step 2: 写 offline-db 封装**

```ts
import { get, set, del } from "idb-keyval";

const RECENT_KEY = "recent-questions";
const MAX_RECENT = 50;

export async function cacheQuestion(q: any) {
  const recent = (await get(RECENT_KEY)) || [];
  const filtered = recent.filter((x: any) => x.id !== q.id);
  filtered.unshift(q);
  await set(RECENT_KEY, filtered.slice(0, MAX_RECENT));
}

export async function getRecentQuestions() {
  return (await get(RECENT_KEY)) || [];
}

export async function isOfflineMode() {
  return !navigator.onLine;
}
```

- [ ] **Step 3: 在练习页接通缓存**

修改 `practice-session.tsx`：
- 题目加载时调 `cacheQuestion(q)`
- `isOfflineMode()` 时从 `getRecentQuestions()` 拿数据

- [ ] **Step 4: 浏览器验证**

DevTools 切到 Offline，访问刚刷过的题，能渲染。

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(web): 离线题目缓存 (IndexedDB)"
```

---

## Task 5.3：写操作 outbox 同步

**Files:**
- Create: `apps/web/src/lib/outbox.ts`, `apps/web/src/lib/sync.ts`

- [ ] **Step 1: 写 outbox**

```ts
import { get, set } from "idb-keyval";

const OUTBOX_KEY = "outbox-queue";

export type OutboxItem = { id: string; type: "attempt"; payload: any; createdAt: number };

export async function enqueue(item: Omit<OutboxItem, "id" | "createdAt">) {
  const q = (await get(OUTBOX_KEY)) || [];
  q.push({ id: crypto.randomUUID(), createdAt: Date.now(), ...item });
  await set(OUTBOX_KEY, q);
}

export async function dequeue(id: string) {
  const q = (await get(OUTBOX_KEY)) || [];
  await set(OUTBOX_KEY, q.filter((x: OutboxItem) => x.id !== id));
}

export async function listOutbox() {
  return (await get(OUTBOX_KEY)) || [];
}
```

- [ ] **Step 2: 写 sync**

```ts
import { listOutbox, dequeue } from "./outbox";

export async function flushOutbox(send: (item: any) => Promise<void>) {
  const items = await listOutbox();
  for (const item of items) {
    try {
      await send(item);
      await dequeue(item.id);
    } catch (e) {
      console.warn("sync failed", item, e);
      // 继续尝试下一个，避免一个失败阻塞全部
    }
  }
}
```

- [ ] **Step 3: 在客户端注册 sync 触发**

`apps/web/src/components/sync-bootstrap.tsx`:
```tsx
"use client";
import { useEffect } from "react";
import { flushOutbox } from "@/lib/sync";
import { submitAnswer } from "@/server/actions/attempt";

export function SyncBootstrap() {
  useEffect(() => {
    function onOnline() {
      flushOutbox(async item => {
        if (item.type === "attempt") await submitAnswer(item.payload);
      });
    }
    window.addEventListener("online", onOnline);
    onOnline(); // 启动时也跑一次
    return () => window.removeEventListener("online", onOnline);
  }, []);
  return null;
}
```

- [ ] **Step 4: 改 submitAnswer 客户端调用点**

在 `practice-session.tsx` 加：
```ts
import { enqueue } from "@/lib/outbox";
import { isOfflineMode } from "@/lib/offline-db";

async function handleSubmit() {
  if (await isOfflineMode()) {
    await enqueue({ type: "attempt", payload: { questionId: q.id, userAnswer: selected, ... } });
    // 本地先标记判分（用题目答案做离线判分）
    setResult({ isCorrect: ..., correctAnswer: q.answer, analysis: q.analysis });
    return;
  }
  // 走原来的服务端流程
}
```

- [ ] **Step 5: 浏览器验证**

DevTools Offline 模式答题，恢复网络后服务端收到记录。

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(web): 离线 outbox 同步"
```

---

## Task 5.4：真机测试

**Files:** -（验证类，无新增文件）

- [ ] **Step 1: 部署 preview**

```bash
# 推到 git 触发 Vercel preview（如已配）
git push origin main
```

- [ ] **Step 2: iOS Safari 测试清单**

- [ ] 登录发链接
- [ ] 答题流畅
- [ ] 切到桌面（PWA 添加）
- [ ] 切到飞行模式，离线读最近题目
- [ ] 拍照/记录任何 UI bug

- [ ] **Step 3: Android Chrome 测试清单**

同上

- [ ] **Step 4: 修复 + commit**

```bash
git commit -m "fix: 真机测试修复 (iOS/Android)"
```

---

## Task 5.5：Vercel 部署

**Files:**
- Create: `vercel.json`, `.env.example`

- [ ] **Step 1: 写 `.env.example`**

```
DATABASE_URL=
AUTH_SECRET=
EMAIL_SERVER=
EMAIL_FROM=
```

- [ ] **Step 2: 创建 Vercel 项目**

```bash
# 用 Vercel CLI
pnpm dlx vercel link
pnpm dlx vercel env add DATABASE_URL
pnpm dlx vercel env add AUTH_SECRET
pnpm dlx vercel env add EMAIL_SERVER
pnpm dlx vercel env add EMAIL_FROM
```

- [ ] **Step 3: 设置 Vercel Postgres**

在 Vercel 控制台创建 Postgres，绑定到项目。

- [ ] **Step 4: 部署**

```bash
pnpm dlx vercel --prod
```

- [ ] **Step 5: 跑 migration 到生产**

```bash
pnpm --filter @exam/db prisma migrate deploy
```

- [ ] **Step 6: 浏览器验证生产环境**

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: Vercel 部署配置"
```

---

## Task 5.6：题库扩充（其他考试种子）

**Files:**
- Create: `packages/db/seed-data/{shengkao,shiye,xuantiao}/*.json`
- Modify: `packages/db/prisma/seed.ts`

- [ ] **Step 1: 准备种子数据**

从粉笔导出其他考试真题，整理成 JSON。

- [ ] **Step 2: 跑 seed**

```bash
pnpm --filter @exam/db seed
```

- [ ] **Step 3: 验证**

```bash
pnpm --filter @exam/db prisma studio
# 检查 Question 表总数
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(db): 扩充省考/事业编/选调种子数据"
```

---

## Task 5.7：v1.1 polish

**Files:** -（修 bug / 调 UI，无固定范围）

- [ ] **Step 1: 收集已知问题**

- [ ] **Step 2: 按优先级修**

- [ ] **Step 3: 跑全部测试**

```bash
pnpm test
# Expected: all passed
```

- [ ] **Step 4: 部署 + 收尾**

```bash
git push
```

---

# Self-Review Checklist

写完 plan 后自审：

- [ ] **Spec 覆盖**：
  - W1 脚手架/Auth/Schema/Importer/Seed → spec §4, §5, §6, §7.5
  - W2 题库/逐题练习/判分 → spec §7.1
  - W3 错题本（3 次掌握）/统计 → spec §7.2, §7.4
  - W4 计划（手动）/进度 → spec §7.3
  - W5 PWA/部署 → spec §8, §12

- [ ] **占位检查**：无 TBD/TODO/"待定"

- [ ] **类型一致**：
  - `judge(type, userAnswer, correctAnswer)` → 全 plan 一致
  - `submitAnswer` 参数 → 全 plan 一致
  - `updateOnWrong(userId, questionId, prisma)` → 全 plan 一致

- [ ] **边界场景**：
  - 单选/多选/不定项判分 ✓
  - 错题已掌握时不重复 ✓
  - 离线时 outbox 入队 + 在线同步 ✓
  - 未登录访问页面 → 跳转登录 ✓
