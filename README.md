# wv-ce 的个人网站

基于 [Hexo](https://hexo.io) + [Fluid](https://github.com/fluid-dev/hexo-theme-fluid) 构建，部署在 GitHub Pages（`gh-pages` 分支）。

## 内容目录

- **BUAA OS（操作系统）**：实验报告、理论笔记、理论作业
  - 笔记仓库：<https://github.com/wv-ce/BUAA_OS>
- **BUAA CO（计算机组成）**：理论笔记 + 实验部分代码
  - 实验部分代码：<https://github.com/wv-ce/BUAA_CO>

> 笔记由 `tools/import_buaa_os.py` / `tools/import_buaa_co.py` 从对应仓库导入。

## 本地预览与发布

```bash
npm install
npx hexo server          # 本地预览 http://localhost:4000
npx hexo clean && npx hexo generate
git add -A && git commit -m "更新" && git push   # 自动构建并部署到 gh-pages
```

## 目录结构

```
source/_posts/    # 文章（含同名资源目录存放图片）
tools/            # 笔记导入脚本（import_buaa_os.py / import_buaa_co.py）
scripts/          # 构建补丁与校验脚本（patch-index.js / patch-category-intros.js / lint-taxonomy.js）
_config.yml       # 站点配置
_config.fluid.yml # 主题配置
```

## 分类与标签规范

分类采用两级「学科 / 文档类型」，标签采用「学科 + 话题」：

| 分类路径 | 标签 |
| --- | --- |
| BUAA OS / 实验报告 | BUAA OS |
| BUAA OS / 理论笔记 | BUAA OS + 话题（内存管理、进程管理、I/O 设备管理、磁盘管理、文件系统） |
| BUAA OS / 知识梳理 | BUAA OS |
| BUAA OS / 理论作业 | BUAA OS |
| BUAA CO / 理论笔记 | BUAA CO + 话题（组合逻辑、时序逻辑、主存储器、汇编、Cache 与虚存、总线与 IO） |
| 随笔 | —— |

规则：

- 每篇文章必须有 `categories`，且必须是上表中的分类路径；
- 每篇只用一个学科标签（`BUAA OS` / `BUAA CO`），不要使用中文学科全称（`操作系统` / `计算机组成`）或旧英文标签（`BUAA_OS` / `BUAA_CO`），避免标签重复、歧义；
- 理论笔记可加一个对应的话题标签。
- 顶层分类页（`/categories/BUAA-OS/`、`/categories/BUAA-CO/`、`/categories/随笔/`）的文章列表上方会显示课程说明，
  正文取自对应入口页（`source/os|co|notes/index.md`）开头到第一个小节/列表之前的部分，由 `scripts/patch-category-intros.js` 在构建时注入；
  改说明只需改入口页，子分类页与分页不显示说明。

检查命令：

```bash
node scripts/lint-taxonomy.js   # 退出码 0 为通过，1 列出不合规文章
```
