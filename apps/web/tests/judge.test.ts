import { describe, it, expect } from "vitest";
import { judge } from "@/lib/judge";

describe("judge", () => {
  it("单选：精确匹配", () => {
    expect(judge("单选", "A", "A")).toBe(true);
    expect(judge("单选", "B", "A")).toBe(false);
  });
  it("多选：完全匹配（无序）", () => {
    expect(judge("多选", "ABC", "BCA")).toBe(true);
    expect(judge("多选", "AB", "ABC")).toBe(false);
    expect(judge("多选", "ABC", "ABD")).toBe(false);
  });
  it("不定项：完全匹配", () => {
    expect(judge("不定项", "AC", "CA")).toBe(true);
  });
  it("大小写不敏感", () => {
    expect(judge("单选", "a", "A")).toBe(true);
  });
});
