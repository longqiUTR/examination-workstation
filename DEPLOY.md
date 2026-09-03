# 考公工作台 v1 部署指南

> 本文档是**手动操作清单**。worker 不会替你执行（需要登录 Vercel / 创建 DB / 配 SMTP 等物理操作）。
> 通篇约 15 分钟；如果你没 Vercel 账号，先去 https://vercel.com/signup 注册（GitHub 一键登录）。

---

## 0. 前提

- 代码已 push 到 GitHub（`main` 分支，仓库名例如 `exam-work-station`）
- Vercel 账号（推荐用 GitHub 登录，这样能直接 import 仓库）
- 邮箱 SMTP 凭据（QQ 邮箱 / Gmail / 163 邮箱都行，**先在邮箱后台开启 SMTP 服务并拿到授权码**）
- 一个可用的 Postgres（推荐 Vercel Postgres，**和 Vercel 项目同 region**，避免跨区延迟）

---

## 1. 创建 Vercel 项目

1. 登录 https://vercel.com/dashboard
2. **Add New… → Project** → 选 `exam-work-station` 仓库 → **Import**
3. Project Name：默认即可（或改成你想要的名字，影响 `*.vercel.app` 子域）
4. **Framework Preset** 自动识别为 `Next.js`，不用改
5. **Root Directory**：保持默认（仓库根），**Build Command** 自动从 `vercel.json` 读取
6. 先**不点 Deploy**，先配环境变量

---

## 2. 创建 Vercel Postgres

1. 项目页切到 **Storage** Tab → **Create Database** → 选 **Postgres**
2. Region 选**离你最近的**（HK / Singapore / Tokyo 都可以）
3. 选 Hobby 计划（免费），给个名字（例如 `exam-db`）
4. 创建完 → 回到项目 → **Connect to Project** → 选你刚创建的 Postgres
5. 完成后，Vercel 会自动把 `DATABASE_URL`（含 pooler）注入到项目环境变量
6. 验证：项目 **Settings → Environment Variables** 看到 `POSTGRES_URL` / `POSTGRES_PRISMA_URL` 几个变量
   - 我们的 Prisma 用 `DATABASE_URL`，所以**手动把 `POSTGRES_PRISMA_URL` 的值再复制一份到 `DATABASE_URL`**（推荐用 Prisma 那个 pooler URL，连接池友好）

---

## 3. 配环境变量

项目 **Settings → Environment Variables**，按下面 4 个名字添加（**全部选 Production / Preview / Development 三档**）：

| 名称 | 值 | 备注 |
|---|---|---|
| `DATABASE_URL` | 上面 step 2 拿到的 `POSTGRES_PRISMA_URL` | Prisma 用 |
| `AUTH_SECRET` | `openssl rand -base64 32` 生成 | Auth.js 签名密钥 |
| `EMAIL_SERVER` | `smtps://user:pass@smtp.qq.com:465` 之类 | Nodemailer 字符串 |
| `EMAIL_FROM` | `你的名字 <you@example.com>` | 必须是 SMTP 账号授权地址 |
| `AUTH_URL` | `https://your-project.vercel.app` | 部署后填，否则 callback 错位 |

### 3.1 邮箱 SMTP 配置示例

**QQ 邮箱**：
1. 登录 QQ 邮箱 → 设置 → 账户 → 开启 SMTP 服务 → 拿到授权码
2. `EMAIL_SERVER=smtps://你的QQ号:授权码@smtp.qq.com:465`
3. `EMAIL_FROM=考工 <你的QQ号@qq.com>`

**Gmail**（需开两步验证 + App Password）：
1. https://myaccount.google.com/apppasswords 生成 App Password
2. `EMAIL_SERVER=smtps://your@gmail.com:app-password@smtp.gmail.com:465`
3. `EMAIL_FROM=Your Name <your@gmail.com>`

**Resend / SendGrid** 等专业服务更好（不推荐 Gmail，量大了容易被风控）。

---

## 4. 首次部署

回到项目 **Deployments** Tab → 点最近一次失败的 / 待部署的记录 → **Redeploy**（或直接点右上 **Deploy**）

部署过程中 Vercel 会跑 `pnpm install` + `pnpm --filter @exam/web build`。
**注意：build 阶段不需要 `prisma migrate deploy`，那一步在 Vercel build 完之后手动跑（见 step 5）**。

---

## 5. 跑数据库 Migration

部署成功后，DB 仍然是空的。需要先在本地用生产 `DATABASE_URL` 跑 migration：

```bash
# 在本地，把 .env / .env.local 的 DATABASE_URL 临时换成生产的 PRISMA URL
# 然后：
pnpm --filter @exam/db prisma migrate deploy
pnpm --filter @exam/db seed   # 跑种子数据（仅首次需要）
```

如果 `seed` 失败，多半是 ENV 没接好 — 检查 `DATABASE_URL` 是否真的是 Prisma 那个 pooler URL。

---

## 6. 绑定自定义域名（可选）

1. 项目 **Settings → Domains**
2. 输入你的域名（例如 `exam.example.com`）
3. 按提示在 DNS 服务商加 CNAME 记录
4. Vercel 自动签发 SSL，几分钟生效
5. 记得**把 `AUTH_URL` 改成新域名**并 redeploy

---

## 7. 验证清单

部署完成后，浏览器打开 `https://your-project.vercel.app`：

- [ ] 首页能加载
- [ ] 点登录 → 输入邮箱 → 收到登录邮件 → 点链接能进入
- [ ] 题库能加载（说明 DB 有数据）
- [ ] 刷一组题 → 服务端统计有变化
- [ ] 错题答对 3 次 → 自动移出错题本
- [ ] 移动端访问 → 能"添加到主屏幕"（PWA）

---

## 8. 常见坑

| 现象 | 原因 | 修法 |
|---|---|---|
| build 报 "Cannot find module '@prisma/client'" | root 装依赖时没装全 | 删 `node_modules` 重装：`pnpm install` |
| build 报 "PrismaClientInitializationError" | `DATABASE_URL` 没设或不对 | 检查环境变量；用 `POSTGRES_PRISMA_URL` 那个 |
| 登录链接点了 404 | `AUTH_URL` 没填或域名不对 | 改成 `https://你的域名` |
| 邮件发不出去 | SMTP 凭据错 / 端口被墙 | 试 `smtps://`（465）而非 `smtp://`（25） |
| 移动端 PWA 装不上 | 没有 manifest / SW | 已在 commit 中，部署一次即可 |
| 数据读写很慢 | 没连 Vercel Postgres 推荐的 pooler | 用 `POSTGRES_PRISMA_URL` 不要 `POSTGRES_URL` |

---

## 9. 后续维护

- 改代码 → 推 `main` → Vercel 自动 redeploy
- 改 schema → 跑 `pnpm --filter @exam/db prisma migrate dev` 生成 migration → 推 → 部署后**手动**跑 `prisma migrate deploy` 到生产
- 监控：项目 **Logs** Tab 看 runtime 日志
- 配额：Hobby 计划 100 GB 流量 / 月（个人用绰绰有余）

---

部署完成 → 在 v1 验收清单打个勾 🎉
