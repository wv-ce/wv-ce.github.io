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
scripts/          # 笔记导入脚本
_config.yml       # 站点配置
_config.fluid.yml # 主题配置
```
