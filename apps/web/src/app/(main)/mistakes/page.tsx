import Link from "next/link";
import { listWrongQuestions, type ListWrongFilter } from "@/server/actions/wrong";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MistakesPage({
  searchParams,
}: {
  searchParams: { module?: string; mastered?: string };
}) {
  const filter: ListWrongFilter = {};
  if (searchParams.module) filter.module = searchParams.module;
  if (searchParams.mastered === "true") filter.mastered = true;
  if (searchParams.mastered === "false") filter.mastered = false;

  const items = await listWrongQuestions(filter);
  return (
    <div className="p-4 max-w-3xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">错题本（{items.length}）</h1>
      <div className="flex gap-2 flex-wrap">
        <Link href="/mistakes">
          <Badge>全部</Badge>
        </Link>
        <Link href="/mistakes?mastered=false">
          <Badge variant="destructive">未掌握</Badge>
        </Link>
        <Link href="/mistakes?mastered=true">
          <Badge variant="secondary">已掌握</Badge>
        </Link>
      </div>
      {items.map((item) => (
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
      ))}
    </div>
  );
}
