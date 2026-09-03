import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "./src");

/**
 * 自定义 alias 插件：把 `@/xxx` 解析为 `<srcDir>/xxx.{ts,tsx}`。
 * 用插件而非 `resolve.alias` 是因为 vitest 2.1 在 ESM 配置下对
 * 字符串 alias 的解析与 vite 行为有差异，插件方式更稳定。
 */
export default defineConfig({
  plugins: [
    {
      name: "alias-at",
      enforce: "pre",
      resolveId(source: string) {
        if (!source.startsWith("@/")) return null;
        return path.join(srcDir, source.slice(2));
      },
    },
  ],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
  },
});
