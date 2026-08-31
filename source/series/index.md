---
title: 分类
layout: page
permalink: /series/
---

<style>
.category-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
  padding: 20px 0 40px;
}
.category-card {
  flex: 1 1 280px;
  max-width: 360px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 32px 28px;
  background: var(--card-bg-color);
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
  color: var(--text-muted-color);
  font-size: 0.95rem;
  margin-bottom: 16px;
}
.category-card .card-arrow {
  font-size: 1.2rem;
  color: var(--theme-color);
}
</style>

<div class="category-cards">
  <a class="category-card" href="/co/">
    <h2>BUAA CO</h2>
    <p>计算机组成原理理论笔记，涵盖组合逻辑、时序逻辑、主存储器、汇编、Cache 与虚存、总线与 IO。</p>
    <span class="card-arrow">查看笔记 →</span>
  </a>
  <a class="category-card" href="/os/">
    <h2>BUAA OS</h2>
    <p>操作系统实验报告与理论笔记，含 Lab0~Lab6 实验、内存/进程/IO/磁盘/文件系统五大主题。</p>
    <span class="card-arrow">查看笔记 →</span>
  </a>
  <a class="category-card" href="/ml/">
    <h2>BUAA ML</h2>
    <p>机器学习导论期末复习：按题型汇总的例题与参考解答，含模型评估、贝叶斯决策、感知机、PCA、SVM、K-Means、集成学习、决策树与 BP。</p>
    <span class="card-arrow">查看资料 →</span>
  </a>
  <a class="category-card" href="/notes/">
    <h2>随笔</h2>
    <p>技术之外的日常思考与记录。</p>
    <span class="card-arrow">查看随笔 →</span>
  </a>
</div>
