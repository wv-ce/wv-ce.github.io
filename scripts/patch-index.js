/**
 * 首页模板注入：将 Butterfly index.pug 替换为分类卡片布局。
 * 每次 hexo generate 时自动执行。
 */
const fs = require("fs");
const path = require("path");

const TARGET = path.join(
  __dirname,
  "../node_modules/hexo-theme-butterfly/layout/index.pug"
);

const CUSTOM = `extends includes/layout.pug

block content
  style.
    .category-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      justify-content: center;
      padding: 40px 0;
    }
    .category-card {
      flex: 1 1 280px;
      max-width: 360px;
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 32px 28px;
      background: var(--card-bg);
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      color: var(--text-color);
    }
    .category-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      color: var(--text-color);
      text-decoration: none;
    }
    .category-card h2 {
      font-size: 1.5rem;
      margin-bottom: 8px;
      color: var(--text-color);
    }
    .category-card p {
      color: var(--text-meta-color);
      font-size: 0.95rem;
      margin-bottom: 16px;
    }
    .category-card .card-arrow {
      font-size: 1.2rem;
      color: var(--theme-color);
    }
  div.category-cards
    a.category-card(href='/co/')
      h2 BUAA CO
      p 计算机组成原理理论笔记，涵盖组合逻辑、时序逻辑、主存储器、汇编、Cache 与虚存、总线与 IO。
      span.card-arrow 查看笔记 →
    a.category-card(href='/os/')
      h2 BUAA OS
      p 操作系统实验报告与理论笔记，含 Lab0~Lab6 实验、内存/进程/IO/磁盘/文件系统五大主题。
      span.card-arrow 查看笔记 →
    a.category-card(href='/notes/')
      h2 随笔
      p 技术之外的日常思考与记录。
      span.card-arrow 查看随笔 →
`;

hexo.on("generateBefore", function () {
  if (fs.existsSync(TARGET)) {
    fs.writeFileSync(TARGET, CUSTOM, "utf8");
  }
});
