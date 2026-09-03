// generate-seed.mjs
// 一次性脚本：生成 5 模块各 50 道占位题到 packages/db/seed-data/guokao-2024/*.json
// 占位题结构合理、答案/解析可简化；用于 W1 阶段打通导入链路。
// v1 上线后会被真实粉笔真题替换。

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'packages', 'db', 'seed-data', 'guokao-2024');
mkdirSync(outDir, { recursive: true });

const MODULES = {
  常识: {
    stems: [
      '下列关于我国国家机构设置的说法，正确的是？',
      '下列历史事件发生在唐朝的是？',
      '下列哪部作品不属于我国四大名著？',
      '下列关于我国地理位置的描述，正确的是？',
      '下列哪条河流是我国的国际河流？',
      '下列关于古代丝绸之路的描述，错误的是？',
      '下列哪项不属于我国的民族自治区？',
      '下列关于古代科举制度的说法，正确的是？',
      '下列哪部法律是我国的国家根本法？',
      '下列关于我国传统节日的说法，错误的是？',
    ],
    types: ['单选'],
    tags: ['常识', '政治', '历史', '地理', '文化', '法律'],
  },
  言语: {
    stems: [
      '下列词语中，没有错别字的一项是？',
      '依次填入横线处的词语，最恰当的一组是：\n他 ____ 地望着远方，____ 往事涌上心头。',
      '下列各句中，加点成语使用恰当的一项是？',
      '下列句子中，没有语病的一项是？',
      '下列对诗句的理解，不正确的一项是？',
      '下列对联对应的人物，匹配正确的一项是？',
      '下列句子中，标点符号使用正确的一项是？',
      '将下列句子重新排列，语序最恰当的一项是？',
      '下列句子中，修辞手法与其他三项不同的是？',
      '下列各句中，语义明确、没有歧义的一项是？',
    ],
    types: ['单选'],
    tags: ['字形', '成语', '病句', '阅读理解', '语句表达', '修辞'],
  },
  数量: {
    stems: [
      '某班有学生 50 人，其中男生占 60%，则女生有多少人？',
      '一项工作，甲单独做需 6 天，乙单独做需 12 天，两人合作需多少天？',
      '甲乙两车同时从 A、B 两地相向而行，3 小时后相遇。已知甲速度为 60 km/h，乙速度为 80 km/h，则 A、B 两地相距多少公里？',
      '某商品先涨价 10%，再降价 10%，现价与原价相比？',
      '一个数的 20% 等于 50 的 30%，求这个数。',
      '甲、乙、丙三人共同投资 120 万元，甲出资是乙的 1.5 倍，丙出资是甲、乙之和的一半，丙出资多少万元？',
      '数列 2, 5, 10, 17, 26, ___ 的下一个数是？',
      'A 工程队单独修路需 20 天，B 工程队单独修路需 30 天，两队合修 10 天后还剩下多少？',
      '某商品成本为 80 元，定价为 100 元，按 8 折出售，则利润率约为？',
      '从 1, 2, 3, 4, 5 这五个数字中任取 3 个，组成无重复数字的三位数，能组成多少个？',
    ],
    types: ['单选'],
    tags: ['计算', '工程', '行程', '利润', '排列组合', '数列'],
  },
  判断: {
    stems: [
      '所有甲都是乙，有些丙是甲，所以有些丙是乙。这个推理是否正确？',
      '下列图形中，与其他三项不同的是？',
      '甲:乙 = 3:4，乙:丙 = 5:6，则甲:丙 = ?',
      '如果"所有 A 都是 B"为真，则下列哪项必为真？',
      '从所给的四个选项中，选择最合适的一个填入问号处，使之呈现一定的规律性。',
      '下列选项中，与"医生:医院"对应关系相同的是？',
      '定义：①A 是一种 B；②所有 B 都是 C；则下列哪项必为真？',
      '把下面的六个图形分为两类，使每一类图形都有各自的共同特征或规律，分类正确的一项是？',
      '左图给定的是正方体纸盒的外表面，下列哪一项能由它折叠而成？',
      '从所给四个选项中，选择最合适的一个填入问号处，使之与前面四个图形呈现一定的规律性。',
    ],
    types: ['单选', '不定项'],
    tags: ['定义判断', '类比推理', '图形推理', '逻辑判断', '演绎推理'],
  },
  资料: {
    stems: [
      '根据所给材料，下列说法正确的是？',
      '所给材料中，2023 年 A 项目同比增长率为？',
      '根据材料，2019-2023 年 A 项目年均增长率约为？',
      '下列哪一项在所给材料中无法直接得出？',
      '所给材料中，A 项目 2023 年占总量的比重比 2022 年：',
      '根据材料，下列对 A、B 两项目关系的描述，正确的是？',
      '假设 2024 年 A 项目同比增长 10%，则 2024 年 A 项目总量约为？',
      '下列对材料的概括，最恰当的一项是？',
      '根据材料，下列选项中可能正确的一项是？',
      '若所给材料数据按当前趋势发展，则 2025 年 A 项目总量约为？',
    ],
    types: ['单选'],
    tags: ['增长率', '比重', '平均数', '倍数', '趋势分析', '综合判断'],
  },
};

const CORRECT_KEYS = ['A', 'B', 'C', 'D'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeQuestion(module, idx) {
  const conf = MODULES[module];
  const type = pick(conf.types);
  const stem = conf.stems[idx % conf.stems.length];
  const correctKey = pick(CORRECT_KEYS);
  const correctValue = `${module}模块-第${idx + 1}题-正确选项${correctKey}`;
  const options = CORRECT_KEYS.map((k) => ({
    key: k,
    value: k === correctKey
      ? correctValue
      : `${module}模块-第${idx + 1}题-干扰项${k}`,
  }));
  return {
    module,
    type,
    stem,
    options,
    answer: correctKey,
    analysis: `本题考察${pick(conf.tags)}相关知识点，正确答案为 ${correctKey}。`,
    difficulty: ((idx % 5) + 1),
    tags: [module, pick(conf.tags)],
    year: 2024,
  };
}

for (const module of Object.keys(MODULES)) {
  const questions = Array.from({ length: 50 }, (_, i) => makeQuestion(module, i));
  const file = {
    examId: 'guokao-2024',
    module,
    questions,
  };
  const outPath = join(outDir, `${module}.json`);
  writeFileSync(outPath, JSON.stringify(file, null, 2), 'utf-8');
  console.log(`✅ Wrote ${questions.length} questions to ${outPath}`);
}

console.log('Done.');
