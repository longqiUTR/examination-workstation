# 考公工作台 - 种子数据目录

> v1 仅含 `guokao-2024/`（国考 2024 行测 5 模块各 20 道示例题）。
> 其他考试（省考 / 事业编 / 选调 / 公安）的数据**目录已占位**，**实际数据由用户后续采集后填入**。

---

## 目录结构

```
seed-data/
├── guokao-2024/        # 国考 2024 ✅ 已填充
│   ├── 常识.json
│   ├── 言语.json
│   ├── 数量.json
│   ├── 判断.json
│   └── 资料.json
├── shengkao/           # 省考 📋 留空（待用户填）
├── shiye/              # 事业编 📋 留空（待用户填）
├── xuantiao/           # 选调生 📋 留空（待用户填）
└── gongan/             # 公安 📋 留空（待用户填）
```

---

## JSON 数据格式（每个文件一个 module）

```json
{
  "examId": "guokao-2024",
  "module": "数量",
  "questions": [
    {
      "module": "数量",
      "type": "单选 | 多选 | 不定项",
      "stem": "题干文本（支持换行 \\n）",
      "options": [
        { "key": "A", "value": "选项 A 内容" },
        { "key": "B", "value": "选项 B 内容" },
        { "key": "C", "value": "选项 C 内容" },
        { "key": "D", "value": "选项 D 内容" }
      ],
      "answer": "B",                       // 客观题用大写字母；多选/不定项写 "ABC" 形式
      "analysis": "解析文本（可空）",
      "difficulty": 1,                      // 1-5 整数
      "tags": ["利润", "基础计算"]          // 可选，数组
    }
  ]
}
```

### 字段约束

| 字段 | 类型 | 必填 | 约束 |
|---|---|---|---|
| `module` | string | ✓ | 5 选 1：常识/言语/数量/判断/资料 |
| `type` | string | ✓ | 客观题 3 选 1：单选/多选/不定项；v1 不收主观题 |
| `stem` | string | ✓ | 任意长度，建议 ≤ 2000 字符 |
| `options` | array | ✓ | 单选 4 个；多选/不定项 4-5 个；`key` 必须 A-Z 大写 |
| `answer` | string | ✓ | 大写字母组合，单选单个（如 `"B"`），多选如 `"ABC"` |
| `analysis` | string | - | 可为 `null` 或空串 |
| `difficulty` | number | ✓ | 1-5 整数，5 最难 |
| `tags` | string[] | - | 可选；用于后续筛选（v1 UI 未用） |

### module 命名规范

- 一个考试（examId）下一个 module 一个文件
- 文件名 = module 名（中文），如 `数量.json` / `判断.json`
- v1 只识别这 5 个 module；其他（申论 / 面试 / 公专）会被 `pnpm seed` 跳过

### examId 命名规范

`{考试类型}-{年份}`，全小写，例如：

- `guokao-2024` ✅
- `guokao-2025`
- `shengkao-zhejiang-2024`
- `shiye-2024-q1`
- `gongan-2024`

---

## 如何采集 / 整理新数据

1. **来源**：粉笔公开真题集（Excel 导出 / 拍照 OCR）
   - ⚠️ **不要**调用粉笔 API（账号 / 合规风险）
   - 公开资料、用户自有的题库、合法的开源题库都可以

2. **解析**：参考 `packages/importer/` 的解析工具（v1 是手写 Excel → JSON 转换，未来可加脚本）

3. **校验**：跑一次 `pnpm --filter @exam/db seed` 看是否报错；用 `prisma studio` 看 Question 表

4. **idempotent**：`packages/db/prisma/seed.ts` 已用 `upsert` + (examId, source) 联合去重，
   重复 seed 不会产生重复题。

---

## 怎么填一个空目录（示例：shengkao）

```bash
# 1. 找数据源（粉笔公开真题 / 自有题库 / 公开资料）
# 2. 转成 JSON（结构见上）
# 3. 按 module 拆文件
$ ls shengkao/
常识.json
言语.json
数量.json
判断.json
资料.json

# 4. seed 验证
$ pnpm --filter @exam/db seed
# 预期：console 打印 "imported X questions for shengkao"
# 预期：prisma studio 里 examId="shengkao-..." 的题出现
```

---

## 注意事项

- **不要 commit 任何带版权 / 来源受限的题库**到 git
- 题量大时拆 commit（每 500 题一个 commit，方便回退）
- v1 不做"题目去重"算法：靠 (examId, source) 联合做幂等，所以 `source` 字段在采集时
  要稳定（用 URL / 文件名 / hash 都行）

---

v1 上线清单：v1.1+ 再考虑批量采集其他考试；现成数据**用户自己慢慢加**就行。
