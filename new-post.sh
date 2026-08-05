#!/usr/bin/env bash
set -euo pipefail

# 创建一篇新博客：生成 Markdown 草稿并自动登记到 blog/posts.json
# 用法：./new-post.sh "文章标题" [标签1,标签2] [日期(默认今天)]
# 示例：./new-post.sh "我的第一篇博客" "技术,随笔"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POSTS_DIR="$SCRIPT_DIR/blog/posts"
INDEX="$SCRIPT_DIR/blog/posts.json"

TITLE="${1:?用法: ./new-post.sh \"文章标题\" [标签] [日期]}"
TAGS="${2:-随笔}"
DATE="${3:-$(date +%Y-%m-%d)}"

mkdir -p "$POSTS_DIR"

slug=$(printf '%s' "$TITLE" | tr '[:upper:]' '[:lower:]' | tr -cs '[:alnum:]' '-')
slug="${slug#-}"
slug="${slug%-}"

if [ -z "$slug" ]; then
  echo "错误：无法根据标题生成文件名，请给标题加上英文。"
  exit 1
fi

FILENAME="$POSTS_DIR/$slug.md"

if [ -e "$FILENAME" ]; then
  echo "文件已存在：$FILENAME"
  exit 1
fi

cat > "$FILENAME" <<EOF
在这里写下你的正文，支持 Markdown 语法：

- **加粗**、*斜体*、\`行内代码\`
- [链接](https://example.com)
- 引用、列表、表格、图片都可以

\`\`\`javascript
console.log("Hello, world!");
\`\`\`
EOF

python3 - "$INDEX" "$TITLE" "$DATE" "$TAGS" "$slug.md" <<'PYEOF'
import json, sys

index_path, title, date, tags, file_name = sys.argv[1:6]
tags_list = [t.strip() for t in tags.split(",") if t.strip()]

with open(index_path, "r", encoding="utf-8") as f:
    data = json.load(f)

data.setdefault("posts", []).insert(0, {
    "file": file_name,
    "title": title,
    "date": date,
    "tags": tags_list,
    "description": title + "。",
    "readingTime": 1,
})

with open(index_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

print("已登记到 posts.json：" + title)
PYEOF

echo "草稿已创建：$FILENAME"
echo "编辑该文件写入正文，然后 commit 并 push 即可发布。"
