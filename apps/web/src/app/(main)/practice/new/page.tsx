"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { startSession } from "@/server/actions/session";

const MODULES = ["常识", "言语", "数量", "判断", "资料"] as const;

export default function NewPracticePage() {
  const router = useRouter();
  const [count, setCount] = useState(20);
  const [module, setModule] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await startSession({
          mode: "逐题",
          count,
          modules: module ? [module] : undefined,
        });
        const ids = res.questionIds.join(",");
        router.push(`/practice/${res.sessionId}?ids=${ids}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">新建练习</h1>

      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="module" className="text-sm font-medium">
            模块
          </label>
          <select
            id="module"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="w-full border rounded p-2 text-sm bg-background"
          >
            <option value="">不限</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="count" className="text-sm font-medium">
            题数
          </label>
          <Input
            id="count"
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, +e.target.value)))}
            min={1}
            max={100}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleStart} disabled={isPending} className="w-full">
          {isPending ? "准备中…" : "开始练习"}
        </Button>
      </Card>
    </div>
  );
}
