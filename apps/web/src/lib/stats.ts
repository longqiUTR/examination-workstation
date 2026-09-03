type AttemptLite = {
  isCorrect: boolean;
  createdAt: Date;
  question?: { module: string };
};

export function aggregateByModule(attempts: AttemptLite[]) {
  const map: Record<string, { total: number; correct: number; accuracy: number }> = {};
  for (const a of attempts) {
    const m = a.question?.module || "未知";
    if (!map[m]) map[m] = { total: 0, correct: 0, accuracy: 0 };
    map[m].total += 1;
    if (a.isCorrect) map[m].correct += 1;
  }
  for (const k of Object.keys(map)) {
    map[k].accuracy = map[k].total > 0 ? map[k].correct / map[k].total : 0;
  }
  return map;
}

export function aggregateDaily(attempts: AttemptLite[], days: number) {
  const map: Record<string, { total: number; correct: number; accuracy: number }> = {};
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map[d.toISOString().slice(0, 10)] = { total: 0, correct: 0, accuracy: 0 };
  }
  for (const a of attempts) {
    const key = a.createdAt.toISOString().slice(0, 10);
    if (!map[key]) continue;
    map[key].total += 1;
    if (a.isCorrect) map[key].correct += 1;
  }
  for (const k of Object.keys(map)) {
    map[k].accuracy = map[k].total > 0 ? map[k].correct / map[k].total : 0;
  }
  return map;
}
