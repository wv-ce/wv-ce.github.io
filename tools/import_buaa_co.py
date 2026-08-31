#!/usr/bin/env python3
"""把本地 BUAA_CO 仓库「理论笔记」目录转换为 Hexo 博客文章。

用法：
    python3 scripts/import_buaa_co.py <BUAA_CO仓库路径>

- 每个最低级文件夹合并为一篇文章（md 按文件名排序拼接），图片复制到同名资源目录
- 每篇文末附上配套实验代码仓库链接
"""

import re
import shutil
import sys
from datetime import date, timedelta
from pathlib import Path

IMG_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
POSTS_DIR = Path("source/_posts")
CODE_URL = "https://github.com/wv-ce/BUAA_CO"

# (slug, 标题, 源文件夹名)
FOLDERS = [
    ("buaa-co-comb-logic", "组合逻辑", "1-组合逻辑"),
    ("buaa-co-seq-logic", "时序逻辑", "2-时序逻辑"),
    ("buaa-co-main-memory", "主存储器", "3-主存"),
    ("buaa-co-assembly", "汇编", "4-汇编"),
    ("buaa-co-cache-vm", "Cache 与虚存", "7-Cache与虚存"),
    ("buaa-co-bus-io", "总线与 IO", "8-总线与IO"),
]


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    repo = Path(sys.argv[1]).expanduser().resolve()
    notes = repo / "理论笔记"
    if not notes.is_dir():
        print(f"未找到理论笔记目录：{notes}")
        sys.exit(1)

    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    base = date(2026, 8, 19)
    created = []

    for i, (slug, title, folder) in enumerate(FOLDERS):
        d = notes / folder
        mds = sorted(d.glob("*.md"))
        chunks = []
        for path in mds:
            text = path.read_text(encoding="utf-8").strip()
            text = re.sub(r"^---\s*$.*?^---\s*$", "", text, flags=re.S | re.M).strip()
            chunks.append(text)
        body = "\n\n".join(chunks)

        # 附上实验代码链接
        body += (
            "\n\n---\n\n> 📎 配套实验代码："
            f"[{title} 相关实验]({CODE_URL})（含 Logisim / MIPS / Verilog 等）"
        )

        # 图片复制到资源目录（非 ASCII 文件名转安全 ASCII，避免托管端 Unicode 差异）
        asset_dir = POSTS_DIR / slug
        replacements = []
        n_imgs = 0
        if asset_dir.exists():
            shutil.rmtree(asset_dir)
        imgs = [f for f in d.iterdir() if f.suffix.lower() in IMG_EXTS] if d.is_dir() else []
        for idx, img in enumerate(imgs):
            if any(ord(c) > 127 for c in img.stem):
                new_name = f"{slug}_{idx}{img.suffix}"
                replacements.append((img.name, new_name))
            else:
                new_name = img.name
            if imgs:
                asset_dir.mkdir(parents=True, exist_ok=True)
                shutil.copy2(img, asset_dir / new_name)
                n_imgs += 1
        for orig, new in replacements:
            body = re.sub(
                r"\]\((" + re.escape(orig) + r')(?:\s+"[^"]*")?\)',
                f"]({new})",
                body,
            )

        # 校验图片引用
        for _, ref in re.findall(r"!\[([^\]]*)\]\(([^)\s]+)\)", body):
            name = Path(ref).name
            if name and not (asset_dir / name).exists():
                print(f"[警告] {slug} 缺少图片：{ref}")

        post_date = base + timedelta(days=i)
        fm = (
            "---\n"
            f"title: BUAA CO {title} 理论笔记\n"
            f"date: {post_date.isoformat()} 10:00:00\n"
            "categories: [计算机组成, 理论笔记]\n"
            f"tags: [计算机组成, {title}]\n"
            f"description: BUAA CO {title} 理论笔记。\n"
            "---\n\n"
        )
        out = POSTS_DIR / f"{slug}.md"
        out.write_text(fm + body + "\n", encoding="utf-8")
        created.append(f"{out}  ({n_imgs} 张图片)")

    print(f"共生成 {len(created)} 篇文章：")
    for c in created:
        print("  " + c)


if __name__ == "__main__":
    main()
