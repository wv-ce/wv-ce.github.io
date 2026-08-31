#!/usr/bin/env node
/**
 * 分类/标签规范性校验（与 tools/import_buaa_*.py 保持一致）。
 *
 *   node scripts/lint-taxonomy.js
 *
 * 退出码：0 = 通过，1 = 不通过。
 *
 * 规范：
 *   分类：两级「学科 / 文档类型」
 *     BUAA OS   / 实验报告 | 理论笔记 | 知识梳理 | 理论作业
 *     BUAA CO   / 理论笔记
 *     BUAA ML   / 实验报告 | 理论笔记 | 知识梳理
 *     随笔       （单级，无子类）
 *   标签：每篇一个学科标签（BUAA OS / BUAA CO / BUAA ML）+ 0~1 个话题标签（话题见 TOPIC_TAGS）
 *   已弃用：中文学科全称（操作系统 / 计算机组成 / 机器学习）与旧英文标签（BUAA_OS / BUAA_CO / BUAA_ML），避免重复、歧义
 */
const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');

// 学科 -> 允许的子分类；null 表示单级分类（无子类）
const SUBJECTS = {
  'BUAA OS': new Set(['实验报告', '理论笔记', '知识梳理', '理论作业']),
  'BUAA CO': new Set(['理论笔记']),
  'BUAA ML': new Set(['实验报告', '理论笔记', '知识梳理']),
  '随笔': null,
};

// 学科 -> 允许的话题标签（学科标签之外）
const TOPIC_TAGS = {
  'BUAA OS': new Set(['内存管理', '进程管理', 'I/O 设备管理', '磁盘管理', '文件系统']),
  'BUAA CO': new Set(['组合逻辑', '时序逻辑', '主存储器', '汇编', 'Cache 与虚存', '总线与 IO']),
  'BUAA ML': new Set([
    '模型评估', '贝叶斯决策', '感知机', 'PCA', '支持向量机',
    'K-Means', '集成学习', '决策树', '神经网络', 'CNN', 'RNN',
  ]),
  '随笔': new Set(),
};

// 已弃用的旧标签，避免再出现
const FORBIDDEN_TAGS = ['操作系统', '计算机组成', '机器学习', 'BUAA_OS', 'BUAA_CO', 'BUAA_ML'];

function parseFrontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    }
    fm[key] = val;
  }
  return fm;
}

function readFrontMatters() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((fname) => ({
      fname,
      fm: parseFrontMatter(fs.readFileSync(path.join(POSTS_DIR, fname), 'utf8')),
    }));
}

const all = readFrontMatters();
const errors = [];
let total = 0;

for (const { fname, fm } of all) {
  total++;
  if (!fm) {
    errors.push(fname + ': 无法解析 front matter');
    continue;
  }
  const cats = Array.isArray(fm.categories)
    ? fm.categories
    : fm.categories
      ? [fm.categories]
      : [];
  const tags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];
  const subject = cats[0];

  // 分类
  if (cats.length === 0) {
    errors.push(fname + ': 缺少 categories');
  } else if (!(subject in SUBJECTS)) {
    errors.push(fname + ': 未知学科分类「' + subject + '」');
  } else if (SUBJECTS[subject] === null) {
    if (cats.length !== 1) {
      errors.push(fname + ': 「' + subject + '」应为单级分类，实际为 ' + cats.join(' > '));
    }
  } else if (cats.length !== 2) {
    errors.push(fname + ': 「' + subject + '」应为两级分类，实际为 ' + cats.join(' > '));
  } else if (!SUBJECTS[subject].has(cats[1])) {
    errors.push(fname + ': 未知子分类「' + cats[1] + '」（学科 ' + subject + '）');
  }

  // 标签
  for (const t of tags) {
    if (FORBIDDEN_TAGS.includes(t)) {
      errors.push(fname + ': 已弃用标签「' + t + '」，请改用中文学科标签');
    }
  }
  if (subject && subject in SUBJECTS && tags.length) {
    const allowed = [subject, ...Array.from(TOPIC_TAGS[subject] || [])];
    for (const t of tags) {
      if (!allowed.includes(t)) {
        errors.push(fname + ': 标签「' + t + '」不在「' + subject + '」允许范围内');
      }
    }
    if (tags.filter((x) => x === subject).length > 1) {
      errors.push(fname + ': 学科标签「' + subject + '」重复');
    }
  }
}

// 汇总分布
const catCount = {};
const tagCount = {};
for (const { fm } of all) {
  if (!fm) continue;
  const cats = Array.isArray(fm.categories)
    ? fm.categories
    : fm.categories
      ? [fm.categories]
      : [];
  const tags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];
  const key = cats.length ? cats.join(' / ') : '(无分类)';
  catCount[key] = (catCount[key] || 0) + 1;
  for (const t of tags) tagCount[t] = (tagCount[t] || 0) + 1;
}

console.log('共 ' + total + ' 篇文章');
console.log('\n分类分布:');
Object.entries(catCount)
  .sort()
  .forEach(([k, v]) => console.log('  ' + String(v).padStart(2) + '  ' + k));
console.log('\n标签分布:');
Object.entries(tagCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log('  ' + String(v).padStart(2) + '  ' + k));

if (errors.length) {
  console.log('\n[失败] ' + errors.length + ' 个问题:');
  errors.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
} else {
  console.log('\n[通过] 分类/标签符合规范');
}
