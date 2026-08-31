/**
 * 分类页说明注入：为顶层分类页（/categories/BUAA-OS/、/categories/BUAA-CO/、/categories/随笔/）
 * 在文章列表上方渲染对应的课程说明。
 *
 * 说明正文取自策划页（source/os|co|notes/index.md）开头到第一个小节/列表之前的部分，
 * 保证分类页与 /os/ /co/ /notes/ 入口页的文案同源、不会各写一份。
 *
 * Hexo 在 load 阶段就预编译了主题模板，改磁盘模板对当次构建无效；
 * 因此在 generateBefore 用 theme.setView 替换 category 视图（CI 全新 checkout 同样生效）。
 */
const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it");

const md = new MarkdownIt({ html: true, linkify: true, breaks: false });

const TPL = path.join(
  __dirname,
  "../node_modules/hexo-theme-fluid/layout/category.ejs"
);

// 顶层分类页 -> 说明来源
const INTRO_SOURCES = {
  "BUAA OS": "source/os/index.md",
  "BUAA CO": "source/co/index.md",
  "随笔": "source/notes/index.md",
};

// 注入锚点：分类页正文 partial 之前
const PARTIAL = "<%- partial('_partials/archive-list.ejs'";

function readIntro(rel) {
  const file = path.join(hexo.base_dir, rel);
  if (!fs.existsSync(file)) return "";
  const body = fs
    .readFileSync(file, "utf8")
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  // 只取「正文说明」：遇到第一个小节标题或列表（文章链接清单）就截断，避免和下方列表重复
  const cut = body.search(/^(?:##\s|[-*]\s)/m);
  return (cut >= 0 ? body.slice(0, cut) : body).trim();
}

hexo.on("generateBefore", function () {
  const theme = hexo.theme;
  if (!theme || !fs.existsSync(TPL)) return;

  const intros = {};
  Object.keys(INTRO_SOURCES).forEach((name) => {
    const text = readIntro(INTRO_SOURCES[name]);
    if (text) intros[name] = md.render(text);
  });
  if (!Object.keys(intros).length) return;

  let src = fs.readFileSync(TPL, "utf8");
  if (!src.includes(PARTIAL)) return;

  const inject =
    "<%\n" +
    "  var CATEGORY_INTROS = " + JSON.stringify(intros) + ";\n" +
    "  // 分页（如 /categories/BUAA-OS/page/2/）不重复显示说明\n" +
    "  var __paged = /\\/page\\/\\d+\\//.test(page.path || '');\n" +
    "  var __intro = __paged ? '' : CATEGORY_INTROS[page.category];\n" +
    "%>\n" +
    "<% if (__intro) { %>\n" +
    "  <div class=\"category-intro markdown-body\">\n" +
    "    <%- __intro %>\n" +
    "  </div>\n" +
    "<% } %>\n\n";

  src = src.replace(PARTIAL, inject + PARTIAL);
  theme.setView("category.ejs", src);
});
