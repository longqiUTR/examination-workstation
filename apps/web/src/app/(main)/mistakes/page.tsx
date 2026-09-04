import Link from "next/link";
import { listWrongQuestions, type ListWrongFilter } from "@/server/actions/wrong";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MODULES = ["常识", "言语", "数量", "判断", "资料"] as const;

function buildHref(
  current: { module?: string; mastered?: string },
  patch: Partial<{ module: string | null; mastered: string | null }>
) {
  const sp = new URLSearchParams();
  const nextModule = patch.module === undefined ? current.module : patch.module ?? undefined;
  const nextMastered = patch.mastered === undefined ? current.mastered : patch.mastered ?? undefined;
  if (nextModule) sp.set("module", nextModule);
  if (nextMastered) sp.set("mastered", nextMastered);
  const qs = sp.toString();
  return qs ? `/mistakes?${qs}` : "/mistakes";
}

export default async function MistakesPage({
  searchParams,
}: {
  searchParams:
    | Promise<{ module?: string; mastered?: string }>
    | { module?: string; mastered?: string };
}) {
  // Next 16+ 强制要求 searchParams 是 Promise，必须 await/React.use()
  const sp =
    searchParams instanceof Promise ? await searchParams : searchParams;
  const filter: ListWrongFilter = {};
  if (sp.module) filter.module = sp.module;
  if (sp.mastered === "true") filter.mastered = true;
  if (sp.mastered === "false") filter.mastered = false;

  const items = await listWrongQuestions(filter);

  // 计算每个模块的错题数（未掌握，用于 chip 角标）
  const all = await listWrongQuestions({});
  const moduleCounts = new Map<string, number>();
  for (const it of all) {
    if (it.mastered) continue;
    moduleCounts.set(it.question.module, (moduleCounts.get(it.question.module) ?? 0) + 1);
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">错题本（{items.length}）</h1>

      {/* 模块筛选 chip（横向滚动） */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        <Link href={buildHref(sp, { module: null })}>
          <Badge
            variant={!sp.module ? "default" : "outline"}
            className={cn("whitespace-nowrap", !sp.module && "shadow")}
          >
            全部
          </Badge>
        </Link>
        {MODULES.map((m) => {
          const active = sp.module === m;
          const count = moduleCounts.get(m) ?? 0;
          return (
            <Link
              key={m}
              href={buildHref(sp, { module: active ? null : m })}
            >
              <Badge
                variant={active ? "default" : "outline"}
                className={cn("whitespace-nowrap", active && "shadow")}
              >
                {m}
                {count > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">{count}</span>
                )}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* 掌握状态筛选 chip */}
      <div className="flex gap-2 flex-wrap">
        <Link href={buildHref(sp, { mastered: null })}>
          <Badge
            variant={!sp.mastered ? "default" : "outline"}
            className={cn(!sp.mastered && "shadow")}
          >
            全部状态
          </Badge>
        </Link>
        <Link
          href={buildHref(sp, {
            mastered: sp.mastered === "false" ? null : "false",
          })}
        >
          <Badge
            variant={sp.mastered === "false" ? "destructive" : "outline"}
            className={cn(sp.mastered === "false" && "shadow")}
          >
            未掌握
          </Badge>
        </Link>
        <Link
          href={buildHref(sp, {
            mastered: sp.mastered === "true" ? null : "true",
          })}
        >
          <Badge
            variant={sp.mastered === "true" ? "secondary" : "outline"}
            className={cn(sp.mastered === "true" && "shadow")}
          >
            已掌握
          </Badge>
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          暂无错题。多练习，错了的会自动归集到这里。
        </p>
      ) : (
        items.map((item) => (
          <Link key={item.id} href={`/mistakes/${item.questionId}`}>
            <Card className="p-4 hover:bg-accent">
              <div className="flex gap-2 mb-2 flex-wrap">
                <Badge>{item.question.module}</Badge>
                {item.mastered && <Badge variant="secondary">已掌握</Badge>}
                <Badge variant="outline">
                  答错 {item.wrongCount} 次 / 答对 {item.correctCount} 次
                </Badge>
              </div>
              <p className="line-clamp-2">{item.question.stem}</p>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
