"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitAnswer } from "@/server/actions/attempt";
import { saveNote } from "@/server/actions/wrong";
import { cn } from "@/lib/utils";

type Option = { key: string; value: string };
type QuestionLite = {
  id: string;
  module: string;
  type: string;
  stem: string;
  options: Option[] | null;
  difficulty: number;
};

type Result = {
  isCorrect: boolean;
  correctAnswer: string;
  analysis: string | null;
};

export function PracticeSession({
  questions,
  sessionId,
  initialNote = "",
  enableNotes = false,
}: {
  questions: QuestionLite[];
  sessionId: string;
  initialNote?: string;
  enableNotes?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const startTimeRef = useRef<number>(0);
  const [note, setNote] = useState<string>(initialNote);
  const [noteMsg, setNoteMsg] = useState<string | null>(null);
  const [notePending, setNotePending] = useState(false);

  // 切题时重置并重新计时
  useEffect(() => {
    setSelected("");
    setResult(null);
    setError(null);
    startTimeRef.current = Date.now();
  }, [idx]);

  if (questions.length === 0) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        <p>没有可练习的题目。</p>
        <Link href="/questions" className="text-primary underline">
          返回题库
        </Link>
      </div>
    );
  }

  if (idx >= questions.length) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">练习完成！</h1>
        <p className="text-muted-foreground">
          共完成 {questions.length} 道题。返回题库查看更多。
        </p>
        <div className="flex gap-2">
          <Link
            href="/questions"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            返回题库
          </Link>
          <Link
            href="/practice/new"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            再来一组
          </Link>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const options: Option[] = q.options ?? [];
  const isMulti = q.type === "多选" || q.type === "不定项";

  function toggleOption(key: string) {
    if (result) return;
    if (!isMulti) {
      setSelected(key);
      return;
    }
    setSelected((prev) => {
      const set = new Set(prev.split("").filter(Boolean));
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return [...set].sort().join("");
    });
  }

  function handleSubmit() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      try {
        const r = await submitAnswer({
          questionId: q.id,
          userAnswer: selected,
          durationMs: Date.now() - startTimeRef.current,
          mode: "逐题",
          sessionId,
        });
        setResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function handleNext() {
    setIdx(idx + 1);
  }

  async function handleSaveNote() {
    setNoteMsg(null);
    setNotePending(true);
    try {
      await saveNote(q.id, note);
      setNoteMsg("笔记已保存");
    } catch (e) {
      setNoteMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setNotePending(false);
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          第 {idx + 1} / {questions.length} 题
        </span>
        <div className="flex gap-1">
          <Badge variant="outline">{q.module}</Badge>
          <Badge variant="outline">{q.type}</Badge>
        </div>
      </div>

      <Card className="p-6">
        <p className="text-lg mb-4 whitespace-pre-wrap">{q.stem}</p>
        {isMulti && (
          <p className="text-xs text-muted-foreground mb-2">
            {q.type}：点击多个选项后再提交
          </p>
        )}
        <div className="space-y-2">
          {options.map((o) => {
            const selectedKeys = selected.split("");
            const isSelected = selectedKeys.includes(o.key);
            const correctKeys = result
              ? result.correctAnswer.toUpperCase().split("")
              : [];
            const isCorrectOption = correctKeys.includes(o.key.toUpperCase());
            const showWrongSelected =
              !!result && isSelected && !result.isCorrect;

            return (
              <button
                key={o.key}
                type="button"
                onClick={() => toggleOption(o.key)}
                disabled={!!result || isPending}
                className={cn(
                  "w-full text-left p-3 rounded border transition-colors",
                  "hover:bg-accent disabled:cursor-not-allowed",
                  isSelected && !result && "border-primary bg-primary/10",
                  isCorrectOption && "border-green-500 bg-green-50",
                  showWrongSelected && "border-red-500 bg-red-50"
                )}
              >
                <strong>{o.key}.</strong> {o.value}
                {result && isCorrectOption && (
                  <span className="ml-2 text-xs text-green-700">
                    （正确答案）
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!result ? (
        <Button
          onClick={handleSubmit}
          disabled={!selected || isPending}
          className="w-full"
        >
          {isPending ? "判分中…" : "提交"}
        </Button>
      ) : (
        <>
          <Card
            className={cn(
              "p-4",
              result.isCorrect ? "bg-green-50" : "bg-red-50"
            )}
          >
            <p className="font-semibold mb-1">
              {result.isCorrect ? "✓ 答对了" : "✗ 答错了"}
            </p>
            {!result.isCorrect && (
              <p className="text-sm">
                正确答案：<span className="font-mono">{result.correctAnswer}</span>
              </p>
            )}
          </Card>

          {result.analysis && (
            <Card className="p-4 bg-blue-50/50">
              <h4 className="font-bold mb-2">解析</h4>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {result.analysis}
              </p>
            </Card>
          )}

          {enableNotes && (
            <Card className="p-4">
              <h4 className="font-bold mb-2">我的笔记</h4>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="写下你的理解/易错点..."
                className="w-full min-h-24 rounded border border-input bg-transparent p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={notePending}
                >
                  {notePending ? "保存中…" : "保存笔记"}
                </Button>
                {noteMsg && (
                  <span className="text-xs text-muted-foreground">{noteMsg}</span>
                )}
              </div>
            </Card>
          )}

          <Button onClick={handleNext} className="w-full">
            {idx + 1 < questions.length ? "下一题" : "完成"}
          </Button>
        </>
      )}
    </div>
  );
}
