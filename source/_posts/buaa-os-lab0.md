---
title: BUAA OS Lab0 实验报告
date: 2026-08-05 10:00:00
categories: [BUAA OS, 实验报告]
tags: [BUAA OS]
description: BUAA OS Lab0 实验报告。
---

## 1. 思考题

1. 对比 Untracked.txt 和 Stage.txt
   - Untracked.txt: README.txt 处于未跟踪的文件列表中。这表示文件在磁盘上，但 Git 仓库尚未记录它，也不会追踪其改动。
   - Stage.txt: README.txt 处于要提交的变更列表中。这表示文件已进入暂存区，准备好在下一次 commit 时存入版本库。

   对比 Modified.txt 和第一次 add 之前的 status (Untracked)
   现象：两次结果**不一样**。
   - 第一次（Untracked）：Git 提示未跟踪的文件。
   - 第二次（Modified）：Git 提示尚未暂存以备提交的变更。

   原因：
   第一次时，README.txt 是新文件，Git 完全不认识它。一旦执行过 add 和 commit，该文件就进入了 Git 的管理体系。当再次修改它时，Git 会对比“工作区”和“当前版本库（HEAD）”的内容。发现不一致时，它知道这是一个**已追踪**的文件被修改了，而不是一个新出现的陌生文件。

2. add the file 对应指令 `git add`，stage the file 对应指令也是 `git add`，commit 对应 `git commit`。
3. 1. `git checkout -- print.c` 或 `git restore print.c`
   2. 先撤销暂存区的删除操作 `git reset HEAD print.c`，再撤销工作区的删除操作 `git checkout -- print.c` 或 `git restore print.c`
   3. `git reset HEAD hello.txt`
4. 执行 `git reset --hard HEAD^`
   变化：HEAD 指针从版本 3 移动到了版本 2，版本 3 的记录消失了（只剩下 2 和 1）。同时，工作区 README.txt 的内容也会变回 "Testing 2"。

   回退到版本 1：`git reset --hard <hash1>`
   变化：HEAD 指针直接跳到了最早的提交，只剩下一条记录（版本 1）。工作区内容变为 "Testing 1"。

   再次回到新版本：`git reset --hard <hash3>`
   变化：版本 3 回归，git log 恢复到三条完整的记录，工作区变回 "Testing 3"。

5. `echo first` :输出first。 
   `echo second > output.txt` :创建output.txt 文件，并在其中写入second。
   `echo third > output.txt` :覆盖原有的output.txt 文件内容，写入third。
   `echo forth >> output.txt` :在原有的文件后追加forth。

6. command 内容
    ```
    cat << 'EOF' > test
    echo Shell Start...
    echo set a = 1
    a=1
    echo set b = 2
    b=2
    echo set c = a+b
    c=$[$a+$b]
    echo c = $c
    echo save c to ./file1
    echo $c>file1
    echo save b to ./file2
    echo $b>file2
    echo save a to ./file3
    echo $a>file3
    echo save file1 file2 file3 to file4
    cat file1>file4
    cat file2>>file4
    cat file3>>file4
    echo save file4 to ./result
    cat file4>>result
    EOF

    chmod +x test
    ./test > result
    ```
   result 内容
    ```
    Shell Start...
    set a = 1
    set b = 2
    set c = a+b
    c = 3
    save c to ./file1
    save b to ./file2
    save a to ./file3
    save file1 file2 file3 to file4
    save file4 to ./result
    3
    2
    1
    ```
   说明：result 文件包含 test 脚本执行时的所有 `echo` 输出以及最后的 `cat` 结果 
   `echo echo Shell Start`：直接输出字符串 echo Shell Start。
   ``echo `echo Shell Start` ``：输出 Shell Start。反引号触发了命令替换。Shell 先执行内部的 `echo Shell Start`，得到结果 Shell Start，然后再由外部的 echo 将这个结果打印出来。

   `echo echo $c>file1`：将字符串 echo [c的值] 写入文件 file1。屏幕无输出。
   ``echo `echo $c>file1` ``：将变量 $c 的值写入 file1。在屏幕输出一个空串。

## 2. 难点分析

1. `sed` 命令的使用：`sed` 是一个强大的文本处理工具，但其语法较为复杂，尤其是正则表达式部分。
2. `chmod` 命令的权限设置：理解不同权限位（读、写、执行）以及如何使用 `chmod` 来修改文件权限可能会有些混淆。ugo+rwx 表示给用户、组和其他人都添加读、写、执行权限。以及用数字方式设置权限（如 755）也需要理解。
3. 单引号和双引号的区别：在 shell 中，单引号内的内容被原样输出，而双引号内的内容会进行变量替换和命令替换。这可能会导致一些意外的结果，尤其是在使用 `echo` 时。
4. 美元符号 $ 的使用：$ 用于变量替换和命令替换，且会和方括号（`$[$a+1]`）、花括号（`${var}`）、小括号（`$((a+1))`）等结合使用，理解这些不同的用法可能会有些混乱。

![alt text](image.png)

## 3. 实验体会

1. 实验中可能会遇到一些指导书没有提到的细节问题，例如 lab0 中遇到的 `gcc -I` 选项的使用以指明头文件路径，这些细节需要通过询问大模型或查阅资料来解决。
2. `sed` `awk`命令的使用需要一定的练习和理解，尤其是正则表达式和变量部分。

## 4. 原创说明

本实验报告所有内容均为原创。
