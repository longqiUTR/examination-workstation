"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/server/actions/register";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (mode === "register") {
          const r = await registerUser({
            username,
            password,
            confirmPassword: confirm,
          });
          if (!r.ok) {
            setError(r.error);
            return;
          }
        }
        const res = await signIn("credentials", {
          username,
          password,
          redirect: false,
        });
        if (!res || res.error) {
          setError(mode === "register" ? "注册后自动登录失败" : "用户名或密码错误");
          return;
        }
        router.push("/");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="max-w-md mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">考公工作台</h1>
      <p className="text-sm text-muted-foreground">
        v1 简化登录：用户名 + 密码。邮箱验证后续再加。
      </p>

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`px-4 py-2 text-sm border-b-2 -mb-px ${
            mode === "login"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground"
          }`}
        >
          登录
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`px-4 py-2 text-sm border-b-2 -mb-px ${
            mode === "register"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground"
          }`}
        >
          注册
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="字母/数字/_/-/.  2-32 位"
            autoComplete="username"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "至少 6 位" : ""}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
          />
        </div>
        {mode === "register" && (
          <div className="space-y-1">
            <Label htmlFor="confirm">确认密码</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? "处理中…"
            : mode === "login"
              ? "登录"
              : "注册并登录"}
        </Button>
      </form>
    </div>
  );
}
