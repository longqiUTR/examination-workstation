'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSend() {
    if (!email) return;
    setSending(true);
    setMessage(null);
    try {
      await signIn('nodemailer', { email, callbackUrl: '/' });
      setMessage('登录链接已发送，请检查邮箱。');
    } catch (e) {
      setMessage('发送失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">登录考公工作台</h1>
      <p className="text-sm text-muted-foreground mb-4">
        输入邮箱，发送一次性登录链接（开发期需配置 SMTP，生产期接 Resend/SendGrid）。
      </p>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <Button className="mt-4" disabled={sending} onClick={handleSend}>
        {sending ? '发送中...' : '发送登录链接'}
      </Button>
      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
