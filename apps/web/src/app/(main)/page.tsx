import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <header className="space-y-2 pt-4">
        <h1 className="text-3xl font-bold">考公工作台</h1>
        <p className="text-muted-foreground">
          行测刷题 + 错题本 + 学习计划，帮你一战上岸。
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/practice/new"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-auto py-6 flex flex-col items-start"
          )}
        >
          <span className="text-lg font-semibold">开始练习</span>
          <span className="text-xs opacity-80 mt-1">按模块自定义题数</span>
        </Link>
        <Link
          href="/questions"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-auto py-6 flex flex-col items-start"
          )}
        >
          <span className="text-lg font-semibold">浏览题库</span>
          <span className="text-xs opacity-80 mt-1">查看所有题目与解析</span>
        </Link>
      </div>
    </div>
  );
}
