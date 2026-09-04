"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export type RegisterInput = {
  username: string;
  password: string;
  confirmPassword: string;
};

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string };

const USERNAME_RE = /^[a-zA-Z0-9_\-.]{2,32}$/;

export async function registerUser(
  input: RegisterInput
): Promise<RegisterResult> {
  const username = input.username.trim();
  const password = input.password;
  const confirm = input.confirmPassword;

  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: "用户名只能包含字母/数字/_/-/.,长度 2-32",
    };
  }
  if (password.length < 6) {
    return { ok: false, error: "密码至少 6 位" };
  }
  if (password.length > 128) {
    return { ok: false, error: "密码不能超过 128 位" };
  }
  if (password !== confirm) {
    return { ok: false, error: "两次密码不一致" };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { ok: false, error: "用户名已被占用" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      name: username,
    },
  });

  return { ok: true };
}
