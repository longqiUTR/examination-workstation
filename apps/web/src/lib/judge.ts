export type QuestionType = "单选" | "多选" | "不定项";

function normalize(s: string): string {
  return s.toUpperCase().split("").sort().join("");
}

export function judge(type: QuestionType, userAnswer: string, correctAnswer: string): boolean {
  return normalize(userAnswer) === normalize(correctAnswer);
}
