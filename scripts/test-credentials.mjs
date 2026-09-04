// 端到端测试: 用 prisma 创建用户(模拟注册), 用 NextAuth credentials 登录
// 走通 = 密码 hash + jwt session + cookie 全部 OK

import { PrismaClient } from "../apps/web/node_modules/@prisma/client/index.js";
import { scrypt as scryptCb, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const prisma = new PrismaClient();
const BASE = "http://localhost:3000";

async function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = await scrypt(plain, salt, 64);
  return `scrypt$16384$8$1$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function csrfCookie() {
  const r = await fetch(`${BASE}/api/auth/csrf`);
  const setCookies = r.headers.getSetCookie?.() ?? [];
  const { csrfToken } = await r.json();
  const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
  return { csrfToken, cookieHeader };
}

async function main() {
  // 1. 创建测试用户
  const username = "testuser";
  const password = "secret123";
  const passwordHash = await hashPassword(password);

  // 先清理
  await prisma.user.deleteMany({ where: { username } });
  const user = await prisma.user.create({
    data: { username, passwordHash, name: username },
  });
  console.log("created user:", user.id, user.username);

  // 2. 测错误密码
  {
    const { csrfToken, cookieHeader } = await csrfCookie();
    const form = new URLSearchParams({
      csrfToken,
      username,
      password: "wrong-password",
      callbackUrl: `${BASE}/`,
      json: "true",
    });
    const r = await fetch(`${BASE}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: form.toString(),
      redirect: "manual",
    });
    console.log("wrong-password status =", r.status, r.headers.get("location"));
  }

  // 3. 测正确密码
  let sessionCookie = "";
  {
    const { csrfToken, cookieHeader } = await csrfCookie();
    const form = new URLSearchParams({
      csrfToken,
      username,
      password,
      callbackUrl: `${BASE}/`,
      json: "true",
    });
    const r = await fetch(`${BASE}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: form.toString(),
      redirect: "manual",
    });
    const allCookies = r.headers.getSetCookie?.() ?? [];
    sessionCookie = allCookies
      .map((c) => c.split(";")[0])
      .filter((c) => c.startsWith("authjs.session-token") || c.startsWith("__Secure-authjs.session-token"))
      .join("; ");
    console.log("correct-password status =", r.status, "cookie set:", sessionCookie ? "yes" : "no");
  }

  // 4. 用 session cookie 访问受保护页面
  if (sessionCookie) {
    const r = await fetch(`${BASE}/`, {
      headers: { Cookie: sessionCookie },
      redirect: "manual",
    });
    const body = await r.text();
    const hasGreeting = body.includes("你好");
    console.log("authenticated / =", r.status, "hasDashboardGreeting:", hasGreeting);
  }

  // 5. 清理
  await prisma.user.deleteMany({ where: { username } });
  console.log("cleanup done");
}

main()
  .catch((e) => {
    console.error("ERR", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
