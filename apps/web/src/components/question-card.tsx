import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type QuestionCardData = {
  id: string;
  module: string;
  type: string;
  stem: string;
  difficulty: number;
  tags: string[];
};

export function QuestionCard({ q }: { q: QuestionCardData }) {
  return (
    <Link href={`/questions/${q.id}`} className="block">
      <Card className="p-4 hover:bg-accent transition-colors">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge>{q.module}</Badge>
          <Badge variant="outline">{q.type}</Badge>
          <Badge variant="secondary">难度 {q.difficulty}</Badge>
        </div>
        <p className="line-clamp-2 text-sm">{q.stem}</p>
        {q.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {q.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}
