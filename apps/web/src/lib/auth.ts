import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@exam/db";
import { verifyPassword } from "@/lib/password";

// v1.1 临时改用用户名 + 密码（CredentialsProvider），邮箱验证挪到后续阶段。
// - Auth.js v5 要求 CredentialsProvider 配合 jwt session strategy
// - DB 仍保留 Account/Session/VerificationToken 字段，未来接 Nodemailer / OAuth 直接用
// - PrismaAdapter 不用于 credentials 流程，但保留方便后面回切 Nodemailer
const config: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(raw) {
        const username = String(raw?.username ?? "").trim();
        const password = String(raw?.password ?? "");
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.username, email: user.email ?? null };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
