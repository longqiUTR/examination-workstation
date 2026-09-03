import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuestion } from "@/server/actions/question";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Option = { key: string; value: string };

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = params instanceof Promise ? await params : params;
  const q = await getQuestion(id);
  if (!q) notFound();

  const options: Option[] = Array.isArray(q.options)
    ? (q.options as Option[])
    : [];
  const correctKeys = q.answer.toUpperCase().split("");

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/questions"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← 返回题库
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge>{q.module}</Badge>
        <Badge variant="outline">{q.type}</Badge>
        <Badge variant="secondary">难度 {q.difficulty}</Badge>
        {q.verified ? null : (
          <Badge variant="destructive">未审核</Badge>
        )}
      </div>

      <Card className="p-6">
        <p className="text-lg mb-4 whitespace-pre-wrap">{q.stem}</p>
        <div className="space-y-2">
          {options.map((o) => {
            const isCorrect = correctKeys.includes(o.key.toUpperCase());
            return (
              <div
                key={o.key}
                className={cn(
                  "p-3 rounded border",
                  isCorrect && "border-green-500 bg-green-50"
                )}
              >
                <strong>{o.key}.</strong> {o.value}
                {isCorrect && (
                  <span className="ml-2 text-xs text-green-700">（正确答案）</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          答案：<span className="font-mono font-semibold">{q.answer}</span>
        </div>
      </Card>

      {q.analysis && (
        <Card className="p-6 bg-blue-50/50">
          <h3 className="font-bold mb-2">解析</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {q.analysis}
          </p>
        </Card>
      )}

      {q.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {q.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
