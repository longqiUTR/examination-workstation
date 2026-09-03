# 考公个人工作台 · 产品设计 Spec

| 字段 | 值 |
|---|---|
| 文档版本 | v1.0 |
| 创建日期 | 2026-09-04 |
| 维护者 | 龙骑UTR |
| 目标读者 | 开发者（自用）+ 潜在协作者 |
| 状态 | 待用户审核 |

---

## 0. 一句话总览

一个**基于 Next.js 全栈的个人考公备考工作台**，Web + 移动 H5 跨端，邮箱魔法链接登录，行测刷题 + 错题本 + 手动计划 + 学习进度可视化为 v1 核心，AI 能力分阶段接入。

---

## 1. 背景与目标

### 1.1 背景

考公备考场景下，主流工具（粉笔 / 华图 / 腰果）体验趋同，且都封闭：

- 用户数据无法导出
- 个性化定制有限
- 智能化能力受限（AI 都只对平台内通用化）
- 跨设备、离线、长周期数据沉淀差

### 1.2 目标

- 一个跨端（**Web + 移动 H5**）的个人备考工作台
- 数据**完全私有**、可导出、可扩展
- 长期演进为"**AI 驱动的备考助理**"
- 单人独立可维护（v1 在 1-1.5 个月内可用）

### 1.3 非目标（v1 明确不做）

- 不做付费 / 多租户 / 付费墙
- 不做社交（不分享给其他考友，v1 单用户）
- 不替代真题卷（不内嵌 PDF 阅读器，题库化优先）
- 不做面试模块（v1 仅笔试）
- 不做申论批改（v2 浏览，v3 批改）

---

## 2. 范围与边界

### 2.1 v1（1-1.5 个月，约 4-6 周）— 基础刷题 + 手动计划

| 模块 | 范围 |
|---|---|
| 题库 | 国考行测 5 模块种子数据（5 模块各 ≥50 题）；schema 支持多考试扩展 |
| 练习 | 逐题模式：题干 + 选项 + 客观题自动判分 + 答案解析 + 笔记 |
| 错题 | 自动归集 + 重做 + "答对 1 次即标记掌握"（可配置） |
| 统计 | 基础统计：做题量、正确率、模块分布、每日趋势 |
| 计划 | **手动** 个人计划：建计划 + 每日 PlanTask + 自动 mark done（关联 Attempt） |
| 进度 | 学习进度可视化：计划完成度、日历视图、模块进度、错题趋势 |
| 登录 | Auth.js v5 + 邮箱魔法链接 |
| 移动 | 响应式 + PWA（next-pwa）+ 离线只读缓存最近 50 题 |
| 部署 | Vercel |

### 2.2 v2（v1 完成后 +1-2 个月）— 模考 + 申论 + AI 计划

| 新增 | 说明 |
|---|---|
| 行测模考 | 计时、完整试卷、成绩报告 |
| 申论浏览 | 真题 + 范文 + 分类（仅浏览，不批改） |
| 题库扩充 | 省考、事业编、选调、公安种子数据 |
| AI 周计划 | 基于近 7 天 Attempt 统计生成未来 7 天 PlanTask，用户确认 |
| 错题 AI 分析 | 按 module × tag 维度统计，LLM 输出弱点总结 |

### 2.3 v3（v2 后 +1-2 个月）— 智能出题 + 资料库 + 高级 AI

| 新增 | 说明 |
|---|---|
| 智能出题 | 基于 tag + 参考样题 prompt LLM 生成，标 `verified=false` 待校对 |
| 资料库 | PDF / 网页收藏、分类、检索 |
| AI 申论批改 | LLM 评分 + 改进建议 |
| 学习计划动态调整 | 计划中途按进度重排 |

---

## 3. 用户与场景

### 3.1 用户

v1 阶段**单用户自用**（考公备考者本人），数据完全私有。

数据模型按多用户设计（所有表都有 `userId`），未来开放扩展零成本。

### 3.2 关键场景（v1 关注的）

| 场景 | 描述 | 主要设备 |
|---|---|---|
| 通勤碎片刷题 | 等车、地铁里刷 5-10 道行测 | 手机 H5 |
| 晚上集中练习 | 30-50 道行测，做完看解析 | 电脑 Web |
| 隔天错题复盘 | 看错题本，重做未掌握 | 手机 + 电脑 |
| 周末看进度 | 计划完成度、模块正确率趋势 | 电脑 Web |
| 新建/调整计划 | 设定考期、每日任务 | 电脑 Web |

---

## 4. 整体架构

### 4.1 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | **Next.js 15**（App Router）+ **TypeScript** | 一人全栈最省心；RSC 减少样板 |
| UI | **Tailwind CSS** + **shadcn/ui** | 快、可定制、生态成熟 |
| 状态 | **TanStack Query**（服务端）+ **Zustand**（客户端） | 状态分层清晰 |
| 图表 | **Recharts** | 进度可视化轻量够用 |
| ORM | **Prisma** | 类型安全、迁移工具好用 |
| 数据库 | **PostgreSQL**（Vercel Postgres / Supabase） | 免费额度够个人用 |
| 认证 | **Auth.js v5**（邮箱魔法链接） | 无密码、现代、依赖最少 |
| 部署 | **Vercel** | 免运维，AI Edge 友好 |
| AI（v2+） | **Vercel AI SDK** + OpenAI / Anthropic | 流式、跨 provider |
| 移动 | **响应式 + PWA（next-pwa）** | 离线缓存、添加到桌面 |
| Monorepo | **pnpm workspaces** | 未来拆桌面/小程序能共用 db/ui/ai |
| 测试 | **Vitest**（单测） + **Playwright**（E2E，可选） | 现代轻量 |

### 4.2 目录结构

```
exam-work-station/
├── apps/
│   └── web/                # Next.js 主应用
├── packages/
│   ├── db/                 # Prisma schema + client
│   ├── ui/                 # 共享 UI 组件
│   ├── ai/                 # AI 调用封装（v2+）
│   └── importer/           # 公开真题导入脚本（Node CLI）
├── docs/
│   └── superpowers/
│       └── specs/
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

### 4.3 数据流

```
客户端 (RSC + CSR)
   ↓ Server Action / Route Handler
   ↓ TanStack Query 缓存
   ↓
Prisma ORM
   ↓
PostgreSQL

AI（v2+）→ Vercel AI SDK → Edge Runtime
数据导入 → 本地 Node 脚本 → 直接写 Postgres（不进前端代码）
```

---

## 5. 信息架构

### 5.1 主导航（5 个 Tab，PC 顶部 / 移动底部）

| Tab | 主要内容 |
|---|---|
| **首页** | 今日统计卡片 + 今日 PlanTask + 继续上次 + 推荐练习入口 |
| **题库** | 题目浏览/筛选（按考试 / 模块 / 题型 / 难度 / 来源） |
| **练习** | 三个入口：逐题 / 章节 / 模考（模考 v2） |
| **错题本** | 错题列表 + 重做 + 按"未掌握 / 最近 / 已掌握"筛选 |
| **统计** | 计划完成度 + 模块进度 + 每日趋势 + 错题趋势 |

### 5.2 二级页面

- 做题页（核心交互页）
- 题目详情（答案 + 解析 + 笔记）
- 计划详情（编辑 PlanTask）
- 模考报告（v2）
- 设置（考试偏好 / 学习偏好 / 主题）

---

## 6. 数据模型

### 6.1 Prisma Schema（v1 完整）

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============ 用户与认证 ============

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  imageUrl      String?
  preferences   Json?     // 考试偏好、目标等
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  attempts      Attempt[]
  wrongQuestions WrongQuestion[]
  studySessions StudySession[]
  plans         Plan[]
}

// ============ 考试元信息 ============

enum ExamType {
  GUO_KAO        // 国考
  SHENG_KAO      // 省考
  SHI_YE_BIAN    // 事业编
  XUAN_TIAO      // 选调
  GONG_AN        // 公安
  OTHER
}

model Exam {
  id        String    @id
  name      String
  type      ExamType
  year      Int?
  province  String?   // 省考用
  questions Question[]
}

// ============ 题目 ============

model Question {
  id          String   @id @default(cuid())
  examId      String
  module      String   // 常识|言语|数量|判断|资料|申论
  type        String   // 单选|多选|不定项|填空|简答|资料题
  stem        String   // 题干（Markdown/HTML）
  options     Json?    // [{key:"A", value:"..."}]
  answer      String   // 客观:"A" / 多选:"ABC" / 主观:要点
  analysis    String?  // 解析（Markdown）
  difficulty  Int      // 1-5
  tags        String[] // 考点标签 ["增长率","两期比重"]
  source      String   // 真题|模拟|AI（v3+）
  year        Int?
  verified    Boolean  @default true   // AI 出的题默认 false
  createdAt   DateTime @default(now())

  exam        Exam     @relation(fields: [examId], references: [id])
  attempts    Attempt[]
  wrongEntries WrongQuestion[]

  @@index([examId, module])
  @@index([tags])
}

// ============ 答题记录 ============

model Attempt {
  id          String   @id @default(cuid())
  userId      String
  questionId  String
  userAnswer  String
  isCorrect   Boolean
  durationMs  Int      // 单题用时
  mode        String   // 逐题|章节|模考
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  question    Question @relation(fields: [questionId], references: [id])

  @@index([userId, createdAt])
  @@index([userId, questionId])
}

// ============ 错题本（独立聚合表） ============

model WrongQuestion {
  id          String   @id @default(cuid())
  userId      String
  questionId  String
  wrongCount  Int      @default 1
  lastWrongAt DateTime @default(now())
  mastered    Boolean  @default false
  notes       String?

  user        User     @relation(fields: [userId], references: [id])
  question    Question @relation(fields: [questionId], references: [id])

  @@unique([userId, questionId])
  @@index([userId, mastered])
}

// ============ 练习 Session ============

model StudySession {
  id        String   @id @default(cuid())
  userId    String
  mode      String   // 逐题|章节|模考
  config    Json     // 配置：{modules, difficulty, count, ...}
  startedAt DateTime @default(now())
  endedAt   DateTime?
  stats     Json?    // {total, correct, accuracy, byModule}

  user      User     @relation(fields: [userId], references: [id])
}

// ============ 个人计划（v1 手动 + v2 AI 补） ============

model Plan {
  id          String      @id @default(cuid())
  userId      String
  title       String      // "国考冲刺 90 天"
  targetExam  String      // 关联 Exam.id
  startDate   DateTime
  endDate     DateTime
  status      String      // active|completed|archived
  aiGenerated Boolean     @default false  // v2: 标记 AI 生成
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user        User        @relation(fields: [userId], references: [id])
  tasks       PlanTask[]

  @@index([userId, status])
}

model PlanTask {
  id        String   @id @default(cuid())
  planId    String
  date      DateTime // 当天 0 点
  module    String   // 常识|言语|...
  target    Json     // {type:"questions", count:30, minAccuracy:80}
  status    String   // pending|done|partial|skipped
  doneCount Int      @default 0
  note      String?

  plan      Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@index([planId, date])
  @@index([date, status])
}
```

### 6.2 关键设计决策

- **`WrongQuestion` 独立成表**（不与 `Attempt` 合并）：错题本查询要快、要支持 `mastered` 状态、按 userId+questionId 唯一约束去重
- **`Question.options` 用 JSON 而非子表**：选项结构简单，避免 join；后期如需复杂题型（如材料子题）再重构
- **`Exam` 单独表**：多套考试并行（国考/省考/事业编等），题目挂 exam 下
- **`Plan` / `PlanTask` 独立**：计划是显式建模，与 Attempt 关联但解耦，方便 v2 加 AI 生成
- **v2/v3 才加的表先不建**（如 `AIAnalysis`、`Material` 等），YAGNI 原则

---

## 7. 核心流程

### 7.1 逐题练习流程

```
1. 用户在「练习」Tab 选「逐题」→ 配置（模块/难度/数量）
2. 系统从 Question 抽题 → 写 StudySession
3. 逐题渲染：题干 + 选项 → 用户选 → 立即判分（客观题）
4. 展示答案 + 解析 → 可"加入错题本"/写笔记/跳过
5. 练习结束 → 写所有 Attempt → 错题写/更新 WrongQuestion
6. 跳转到本次 Session 报告
```

**判分逻辑**（v1 仅支持客观题）：
- 单选：精确匹配
- 多选：完全匹配（不分顺序）
- 主观题（v1 暂不实现判分，标"待人工评"）

### 7.2 错题自动归集

- 答错 → 异步写/更新 `WrongQuestion`（按 `userId+questionId` 唯一）
- 重做答对 N 次（v1 默认 1 次，可在设置改）→ `mastered = true`
- 错题本页支持：未掌握 / 最近错误 / 已掌握 / 按模块筛选

### 7.3 手动计划流程

```
1. 用户在「首页」或「计划」入口建计划
2. 填写：标题 / 目标考试 / 起止日期
3. 逐日生成 PlanTask（默认模板：每天 30 题，按模块轮换）
4. 每日进入首页 → 看到今日 PlanTask
5. 完成练习时（Attempt 命中模块+数量）→ 自动 mark done
6. 用户也可手动 mark done / 调整数量 / 跳过
```

### 7.4 进度统计

**数据源**：
- 实时聚合：`Attempt` 按 userId + 时间窗
- 预存：每日 `StudySession.stats` 缓存

**关键指标**：
- 总做题数 / 总正确率
- 各模块做题数 / 正确率
- 每日趋势（折线图）
- 计划完成度（百分比 + 剩余天数）
- 错题模块分布（柱状图）
- 错题减少趋势（已掌握 / 未掌握）

### 7.5 真题导入流程（开发者侧，命令行）

```
公开真题 PDF / Excel / JSON
   ↓
packages/importer/src/xxx-import.ts（每个来源一个脚本）
   ↓
解析 → 校验（必填项/结构）→ 入库 Question
   ↓
输出导入报告：成功 / 失败 / 跳过行数
```

- v1 阶段只需要 1 个国考行测导入脚本（5 模块各 50-200 题作为种子）
- 其他考试/年份 v2 慢慢补
- 导入脚本不入前端 bundle，独立 CLI

---

## 8. 移动端与离线

### 8.1 响应式断点

| 断点 | 设备 | 布局 |
|---|---|---|
| `< 640px` | 手机 | 单列，底部 Tab 栏 |
| `640-1024px` | 平板 | 单列/双列自适应 |
| `> 1024px` | 电脑 | 多列，顶部导航 |

### 8.2 PWA 能力

- **App Shell 缓存**：HTML / CSS / JS 走 Service Worker 缓存
- **题目缓存**：最近刷过的 50 题镜像到 IndexedDB
- **添加桌面**：可"添加到主屏幕"，全屏体验

### 8.3 离线策略（v1 简化版）

| 操作 | 离线行为 |
|---|---|
| 读最近刷过的题 | ✅ 完全离线 |
| 答题 | ✅ 写 IndexedDB outbox，恢复网络后批量同步 |
| 读统计 | ❌ 需要网络 |
| 写错题笔记 | ✅ outbox 队列 |
| 创建/编辑计划 | ❌ 需要网络（v1 简化） |
| AI 调用 | ❌ v1 无 AI |

**冲突处理**：LWW（Last-Write-Wins），记录冲突日志便于排查

---

## 9. AI 能力（v2/v3）

### 9.1 AI 周计划生成（v2）

**触发**：用户在计划详情点"AI 帮我生成未来一周"

**输入**：
- 当前计划剩余天数
- 近 7 天 `Attempt` 统计（按 module × tag 的正确率）
- 历史 PlanTask 完成率

**Prompt** 核心：
> "基于用户薄弱模块 [模块A: 60%, 模块B: 75%]，剩余 30 天，请为未来 7 天生成每日任务，每天 30-50 题，重点练习模块A..."

**输出**：未来 7 天的 `PlanTask[]`（标 `aiGenerated=true`），用户逐条确认/调整后写入

**成本控制**：每日手动触发 1 次上限，避免误操作狂点

### 9.2 错题 AI 分析（v2）

**触发**：用户在错题本页点"AI 分析我的弱点"

**输入**：聚合近 30 天 `WrongQuestion` + `Attempt`，按 module × tag 统计

**输出**：
- 文字总结（"你在资料分析的增长率题型最近正确率仅 50%，主要错在环比/同比混淆"）
- 推荐练习标签
- 存 `AIAnalysis` 表（v2 新增）

### 9.3 智能出题（v3）

**触发**：用户基于某个 tag 选"AI 给我出 10 题"

**流程**：
1. 抽 3-5 道同 tag 真题作为风格参考
2. Prompt LLM 生成新题 + 选项 + 答案 + 解析
3. 入库 `Question`，`source='ai'`，`verified=false`
4. UI 标"AI 出题（待校对）"，不直接进公共题库
5. 用户做题后可标记"通过 / 驳回"，积累到 N 次通过后改 `verified=true`

**质量兜底**：每周抽 10% AI 题目人工看，发现普遍差就停用该 provider

---

## 10. 错误处理

| 场景 | 处理 |
|---|---|
| 题目加载失败 | SW 缓存兜底 + 重试 + 友好提示 |
| 答题同步失败 | IndexedDB outbox + 后台重试 + 离线徽标 |
| AI 调用失败 | 降级到"无 AI"模式，主流程不受影响 |
| 登录失效 | 跳转登录页 + 保留未保存答案 |
| 导入失败 | CLI 抛错定位行号，Web 端不参与 |
| 数据库连接失败 | 5xx 错误页 + 重试按钮 + 报错上报到 console |

**错误日志**：v1 阶段 console.log 即可，v2 接 Sentry / Vercel Analytics

---

## 11. 测试策略

| 类型 | 范围 | 工具 | 优先级 |
|---|---|---|---|
| 单元测试 | 判分逻辑、错题归集、统计聚合 | Vitest | P0 |
| 集成测试 | API Route + Postgres | Vitest + testcontainers 或本地 PG | P0 |
| E2E | 登录 → 做题 → 错题归集主流程 | Playwright | P1（v1 后期） |
| 手动 | 移动 H5 真机测试（iOS Safari + Android Chrome），重点 PWA 离线 | — | P0 |

**v1 时间紧，E2E 可后置**。单测 + 集成测覆盖核心业务逻辑即可。

**测试数据**：固定 seed 脚本（`packages/db/seed.ts`），保证可重复

---

## 12. 开发节奏（v1，1-1.5 个月）

| 周 | 交付 | 关键依赖 |
|---|---|---|
| **W1** | 脚手架（pnpm + Next.js + Tailwind + shadcn）+ Auth.js 邮箱魔法链接 + Prisma Schema + 国考行测种子数据导入脚本（5 模块各 50-100 题） | Node / Postgres / SMTP |
| **W2** | 逐题练习核心：题目展示 + 答题卡 + 客观题判分 + 答案解析页 + 移动响应式 | W1 Schema |
| **W3** | 错题本（自动归集 + 重做 + 掌握）+ 基础统计（做题量/正确率/模块分布/每日趋势） | W2 答题闭环 |
| **W4** | 手动个人计划（建计划 + 每日 PlanTask + 自动 mark done）+ 进度可视化（日历 + 模块进度 + 错题趋势） | W3 数据基础 |
| **W5** | PWA 适配 + 真机测试 + Vercel 部署 + 题库扩充（其他考试种子） | 全部前置 |
| **W6（buffer）** | 收尾 / 修复 / polish | — |

**v1 范围严格收敛**：
- ❌ 模考（v2）
- ❌ 申论（v2 浏览，v3 批改）
- ❌ AI 能力（v2+）
- ❌ 资料库（v3）
- ❌ 面试（v3+ 或不做）

---

## 13. 风险与权衡

| 风险 | 影响 | 缓解 |
|---|---|---|
| 1-1.5 个月紧，部分 polish 会延后 | v1 体验可能不够"精致" | v1.1 hotfix 周期，1-2 周后再 polish 一轮 |
| 题库种子数据质量决定初体验 | 烂数据直接劝退 | W1 严格挑选真题源；先小批量（5 模块各 50 题）验证后再扩 |
| 移动 PWA 体验不如原生 | 移动端体验打折 | v1 接受；v2+ 评估是否做小程序或 React Native |
| 单用户场景下 Auth.js 是否过度工程 | 复杂度高于"软登录" | 接受：用户模型按多用户设计，未来开放零成本 |
| AI API 成本 | v2+ 才有影响 | 手动触发限频 + 月度预算告警 |
| Postgres 在 Vercel 冷启动延迟 | 首次加载慢 | Vercel Postgres 选 Always-on 套餐；冷启动 < 500ms 可接受 |

---

## 14. 待定 / 后续讨论

- [ ] 题目导入的具体数据源（哪家公开题库？粉笔公开真题？中公？华图？）
- [ ] 错题"答对几次算掌握"的默认值（v1 用 1 次，是否暴露给用户配置）
- [ ] v1 是否需要"收藏夹"功能（与错题本区别）
- [ ] 移动端是否需要"声音 / 振动反馈"（答对/答错）
- [ ] 数据导出格式（v1 是否支持导出 JSON / CSV）

---

## 15. 参考

- Auth.js v5: https://authjs.dev/
- Next.js 15: https://nextjs.org/
- Prisma: https://www.prisma.io/
- Vercel AI SDK: https://sdk.vercel.ai/
- shadcn/ui: https://ui.shadcn.com/

---

**审核流程**：

1. 用户通读本 spec
2. 反馈修改意见（"§X 改成 Y" / "§Z 加一段..."）
3. 修订后再次确认
4. 通过后进入 writing-plans 阶段（拆分实施计划）
