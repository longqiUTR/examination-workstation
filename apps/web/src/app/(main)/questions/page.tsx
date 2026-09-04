import Link from "next/link";
import { listQuestions } from "@/server/actions/question";
import { QuestionCard } from "@/components/question-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MODULES = ["常识", "言语", "数量", "判断", "资料"] as const;

type SearchParams = { module?: string; page?: string; q?: string };

const SEARCH_ENABLE_THRESHOLD = 500;

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  // Next 15+ 中 searchParams 是 Promise；向下兼容同步形态
  const params =
    searchParams instanceof Promise ? await searchParams : searchParams;
  const module = params.module;
  const q = params.q ?? "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const pageSize = 20;

  const { items, total } = await listQuestions({
    module,
    search: q,
    page,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const searchEnabled = total > SEARCH_ENABLE_THRESHOLD || q.length > 0;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">题库（{total}）</h1>
        <Link
          href="/practice/new"
          className={cn(buttonVariants({ variant: "default", size: "default" }))}
        >
          开始练习
        </Link>
      </div>

      <form className="mb-4 flex items-center gap-2 flex-wrap" method="get">
        <label htmlFor="module-select" className="text-sm">
          模块：
        </label>
        <select
          id="module-select"
          name="module"
          defaultValue={module ?? ""}
          className="border rounded px-2 py-1 text-sm bg-background"
        >
          <option value="">全部</option>
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {searchEnabled && (
          <input
            id="q-input"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="搜索题干关键词…"
            className="border rounded px-2 py-1 text-sm bg-background min-w-32"
          />
        )}
        <Button type="submit" variant="outline" size="sm">
          筛选
        </Button>
        {(module || q) && (
          <Link
            href="/questions"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            清除
          </Link>
        )}
      </form>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无题目。</p>
        ) : (
          items.map((q) => (
            <QuestionCard
              key={q.id}
              q={{
                id: q.id,
                module: q.module,
                type: q.type,
                stem: q.stem,
                difficulty: q.difficulty,
                tags: q.tags,
              }}
            />
          ))
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 页
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={{
                  pathname: "/questions",
                  query: { ...params, page: String(page - 1) },
                }}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                上一页
              </Link>
            )}
            {page * pageSize < total && (
              <Link
                href={{
                  pathname: "/questions",
                  query: { ...params, page: String(page + 1) },
                }}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                下一页
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
