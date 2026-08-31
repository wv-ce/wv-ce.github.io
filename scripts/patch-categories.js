/**
 * 分类页说明注入：把 theme.category.introduction 插到分类树上方。
 * 通过 theme.setView 替换已预编译的模板（Hexo 在 load 阶段预编译模板，
 * 直接改磁盘模板对当前进程无效；setView 在 CI 全新 checkout 下同样生效）。
 */
const fs = require("fs");
const path = require("path");

const TPL = path.join(
  __dirname,
  "../node_modules/hexo-theme-fluid/layout/categories.ejs"
);

const MARKER = "<%- partial('_partials/category-list', {";

hexo.on("generateBefore", function () {
  const theme = hexo.theme;
  if (!theme) return;
  const intro = (hexo.theme.config.category || {}).introduction || "";
  if (!intro) return;
  if (!fs.existsSync(TPL)) return;
  let src = fs.readFileSync(TPL, "utf8");
  const cleaned = intro.replace(/^\s+/gm, "").trim();
  // 磁盘模板若已被本地持久注入，先替换为最新的说明
  src = src.replace(
    /<div class="category-intro">[\s\S]*?<\/div>\n*/,
    cleaned + "\n\n"
  );
  // 否则在分类树前插入
  if (!src.includes("category-intro")) {
    src = src.replace(MARKER, cleaned + "\n\n" + MARKER);
  }
  // 替换主题中已预编译的 categories 视图
  theme.setView("categories.ejs", src);
});
