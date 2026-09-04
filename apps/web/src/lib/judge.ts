export type QuestionType = "单选" | "多选" | "不定项";

// 去掉所有非 A-Z 字符：标点、空格、换行、中文逗号 / 全角等，
// 让 "BCD." / "B,C,D" / "B CD" 与 "BCD" 等价。
function normalize(s: string): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("")
    .sort()
    .join("");
}

export function judge(type: QuestionType, userAnswer: string, correctAnswer: string): boolean {
  return normalize(userAnswer) === normalize(correctAnswer);
}
