// 一次性迁移脚本：将 21 篇文章的分类/标签改为「学科→文档类型」两级分类 + 去重标签
const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '..', 'source', '_posts');

const plan = {};
for (let i = 0; i <= 6; i++) {
  plan['buaa-os-lab' + i] = { categories: ['操作系统', '实验报告'], tags: ['操作系统'] };
}
plan['buaa-os-review'] = { categories: ['操作系统', '知识梳理'], tags: ['操作系统'] };
plan['buaa-os-theory-homework'] = { categories: ['操作系统', '理论作业'], tags: ['操作系统'] };
plan['os-notes-memory'] = { categories: ['操作系统', '理论笔记'], tags: ['操作系统', '内存管理'] };
plan['os-notes-process'] = { categories: ['操作系统', '理论笔记'], tags: ['操作系统', '进程管理'] };
plan['os-notes-io'] = { categories: ['操作系统', '理论笔记'], tags: ['操作系统', 'I/O 设备管理'] };
plan['os-notes-disk'] = { categories: ['操作系统', '理论笔记'], tags: ['操作系统', '磁盘管理'] };
plan['os-notes-fs'] = { categories: ['操作系统', '理论笔记'], tags: ['操作系统', '文件系统'] };
plan['buaa-co-comb-logic'] = { categories: ['计算机组成', '理论笔记'], tags: ['计算机组成', '组合逻辑'] };
plan['buaa-co-seq-logic'] = { categories: ['计算机组成', '理论笔记'], tags: ['计算机组成', '时序逻辑'] };
plan['buaa-co-main-memory'] = { categories: ['计算机组成', '理论笔记'], tags: ['计算机组成', '主存储器'] };
plan['buaa-co-assembly'] = { categories: ['计算机组成', '理论笔记'], tags: ['计算机组成', '汇编'] };
plan['buaa-co-cache-vm'] = { categories: ['计算机组成', '理论笔记'], tags: ['计算机组成', 'Cache 与虚存'] };
plan['buaa-co-bus-io'] = { categories: ['计算机组成', '理论笔记'], tags: ['计算机组成', '总线与 IO'] };
plan['welcome'] = { categories: ['随笔'], tags: [] };

const changed = [];
const errors = [];
for (const fname of fs.readdirSync(postsDir)) {
  if (!fname.endsWith('.md')) continue;
  const slug = fname.replace(/\.md$/, '');
  const target = plan[slug];
  if (!target) {
    errors.push('no plan for ' + slug);
    continue;
  }
  const file = path.join(postsDir, fname);
  const orig = fs.readFileSync(file, 'utf8');
  let out = orig;
  out = out.replace(/^categories:.*$/m, 'categories: [' + target.categories.join(', ') + ']');
  if (target.tags.length) {
    out = out.replace(/^tags:.*$/m, 'tags: [' + target.tags.join(', ') + ']');
  } else {
    out = out.replace(/^tags:.*\n?/m, '');
  }
  if (out !== orig) {
    fs.writeFileSync(file, out, 'utf8');
    const cat = (out.match(/^categories:.*$/m) || ['??'])[0];
    const tag = (out.match(/^tags:.*$/m) || ['(no tags)'])[0];
    changed.push(slug + ': ' + cat + ' | ' + tag);
  } else {
    errors.push('no change for ' + slug);
  }
}
console.log('CHANGED:');
changed.forEach((c) => console.log('  ' + c));
console.log('ERRORS:');
errors.forEach((e) => console.log('  ' + e));
