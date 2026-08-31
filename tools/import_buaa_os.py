#!/usr/bin/env python3
"""把本地 BUAA_OS 笔记目录转换为 Hexo 博客文章。

用法：
    python3 scripts/import_buaa_os.py <BUAA_OS仓库路径>

规则：
    - 每个最低级文件夹（只含 md 和图片）合并为一篇文章，md 按文件名排序拼接
    - 文件夹内的图片复制到文章同名资源目录（post_asset_folder）
    - 散落的单个 md（如 结构梳理.md、作业N.md）各自处理
"""

import re
import shutil
import sys
from datetime import date, timedelta
from pathlib import Path

IMG_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
POSTS_DIR = Path("source/_posts")

# (slug文件名, 标题, 分类, 内容来源列表[(路径, 小节标题或None)])
def build_plan(repo: Path):
    hw = sorted((repo / "理论作业").glob("*.md"))
    plan = []

    # 实验报告：lab0-lab6
    labs = [
        ("buaa-os-lab0", "BUAA OS Lab0 实验报告"),
        ("buaa-os-lab1", "BUAA OS Lab1 实验报告"),
        ("buaa-os-lab2", "BUAA OS Lab2 实验报告"),
        ("buaa-os-lab3", "BUAA OS Lab3 实验报告"),
        ("buaa-os-lab4", "BUAA OS Lab4 实验报告"),
        ("buaa-os-lab5", "BUAA OS Lab5 实验报告"),
        ("buaa-os-lab6", "BUAA OS Lab6 实验报告"),
    ]
    for slug, title in labs:
        d = repo / "实验报告" / f"lab{slug[-1]}"
        plan.append({
            "slug": slug, "title": title,
            "categories": ["BUAA OS", "实验报告"], "tags": ["BUAA OS"],
            "parts": [(d / f"lab{slug[-1]}.md", None)], "img_dir": d,
        })

    # 实验报告/结构梳理.md
    plan.append({
        "slug": "buaa-os-review", "title": "BUAA OS 知识结构梳理",
        "categories": ["BUAA OS", "知识梳理"], "tags": ["BUAA OS"],
        "parts": [(repo / "实验报告" / "结构梳理.md", None)], "img_dir": None,
    })

    # 理论作业：合并为一篇，每份作业加小节标题
    parts = [(f, f"作业 {i + 1}") for i, f in enumerate(hw)]
    plan.append({
        "slug": "buaa-os-theory-homework", "title": "操作系统理论作业汇总",
        "categories": ["BUAA OS", "理论作业"], "tags": ["BUAA OS"],
        "parts": parts, "img_dir": None,
    })

    # 理论笔记：每个文件夹一篇
    notes = {
        "3-内存管理": ("os-notes-memory", "OS 理论笔记：内存管理", "内存管理"),
        "4-进程管理": ("os-notes-process", "OS 理论笔记：进程管理与死锁", "进程管理"),
        "5-IO": ("os-notes-io", "OS 理论笔记：I/O 设备管理", "I/O 设备管理"),
        "6-磁盘管理": ("os-notes-disk", "OS 理论笔记：磁盘管理", "磁盘管理"),
        "7-文件系统": ("os-notes-fs", "OS 理论笔记：文件系统", "文件系统"),
    }
    for folder, (slug, title, topic) in notes.items():
        d = repo / "理论笔记" / folder
        parts = [(f, None) for f in sorted(d.glob("*.md"))]
        plan.append({
            "slug": slug, "title": title,
            "categories": ["BUAA OS", "理论笔记"], "tags": ["BUAA OS", topic],
            "parts": parts, "img_dir": d if d.exists() else None,
        })
    return plan


def img_ref_to_name(ref: str) -> str | None:
    """从 markdown 图片引用里取纯文件名（无子目录时）。"""
    ref = ref.strip()
    if "/" in ref:
        return None
    return ref


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    repo = Path(sys.argv[1]).expanduser().resolve()
    if not repo.is_dir():
        print(f"目录不存在：{repo}")
        sys.exit(1)

    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    start = date(2026, 8, 5)
    created = []

    for i, item in enumerate(build_plan(repo)):
        # 合并正文
        chunks = []
        for path, section_title in item["parts"]:
            text = path.read_text(encoding="utf-8").strip()
            text = re.sub(r"^---\s*$.*?^---\s*$", "", text, flags=re.S | re.M).strip()
            if section_title:
                text = f"## {section_title}\n\n{text}"
            chunks.append(text)
        body = "\n\n".join(chunks)

        # 复制图片到资源目录（与文章同名文件夹）
        asset_dir = POSTS_DIR / item["slug"]
        n_imgs = 0
        if asset_dir.exists():
            shutil.rmtree(asset_dir)
        if item["img_dir"] and item["img_dir"].is_dir():
            imgs = [f for f in item["img_dir"].iterdir() if f.suffix.lower() in IMG_EXTS]
            if imgs:
                asset_dir.mkdir(parents=True)
                for img in imgs:
                    shutil.copy2(img, asset_dir / img.name)
                    n_imgs += 1

        # 校验正文中的图片引用都有对应文件
        missing = []
        for alt, ref in re.findall(r"!\[([^\]]*)\]\(([^)\s]+)\)", body):
            name = img_ref_to_name(ref)
            if name is None:
                continue
            p = Path(name)
            if not (asset_dir / p.name).exists():
                missing.append(name)
        if missing:
            print(f"[警告] {item['slug']} 缺少图片：{sorted(set(missing))}")

        # 写 front matter
        post_date = start + timedelta(days=i)
        fm = (
            "---\n"
            f"title: {item['title']}\n"
            f"date: {post_date.isoformat()} 10:00:00\n"
            f"categories: [{', '.join(item['categories'])}]\n"
            f"tags: [{', '.join(item['tags'])}]\n"
            f"description: {item['title']}。\n"
            "---\n\n"
        )
        out = POSTS_DIR / f"{item['slug']}.md"
        out.write_text(fm + body + "\n", encoding="utf-8")
        created.append(f"{out}  ({n_imgs} 张图片)")

    print(f"共生成 {len(created)} 篇文章：")
    for c in created:
        print("  " + c)


if __name__ == "__main__":
    main()
