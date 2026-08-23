---
title: BUAA OS Lab1 实验报告
date: 2026-08-06 10:00:00
categories: [实验报告]
tags: [BUAA_OS, 操作系统]
description: BUAA OS Lab1 实验报告。
---

## 思考题

### Thinking 1.1

测试如下.c文件：

```c
#include <stdio.h>

int main() {
    puts("Hello, World!");
    return 0;
}
```
#### 1. x86工具链

执行以下命令：

```Shell
gcc -c hello.c -o hello.o
objdump --section=.text --disassemble=main --source \
hello.o > test1.txt
```

test1.txt文件内容如下：

```

hello.o：     文件格式 elf64-x86-64


Disassembly of section .text:

0000000000000000 <main>:
   0:   f3 0f 1e fa             endbr64
   4:   55                      push   %rbp
   5:   48 89 e5                mov    %rsp,%rbp
   8:   48 8d 05 00 00 00 00    lea    0x0(%rip),%rax        # f <main+0xf>
   f:   48 89 c7                mov    %rax,%rdi
  12:   e8 00 00 00 00          call   17 <main+0x17>
  17:   b8 00 00 00 00          mov    $0x0,%eax
  1c:   5d                      pop    %rbp
  1d:   c3                      ret
```  

再执行以下命令：

```Shell
gcc hello.c -o hello
objdump --section=.text --disassemble=main --source \
hello > test2.txt
```

test2.txt文件内容如下：

```

hello：     文件格式 elf64-x86-64


Disassembly of section .text:

0000000000001149 <main>:
    1149:       f3 0f 1e fa             endbr64
    114d:       55                      push   %rbp
    114e:       48 89 e5                mov    %rsp,%rbp
    1151:       48 8d 05 ac 0e 00 00    lea    0xeac(%rip),%rax        # 2004 <_IO_stdin_used+0x4>
    1158:       48 89 c7                mov    %rax,%rdi
    115b:       e8 f0 fe ff ff          call   1050 <puts@plt>
    1160:       b8 00 00 00 00          mov    $0x0,%eax
    1165:       5d                      pop    %rbp
    1166:       c3                      ret
```

可以看到，test1.txt中call行，e8后面puts函数的地址是0，而test2.txt中call行，e8后面puts函数的地址是不再是0了。这是因为test1.txt中hello.o文件还没有链接，所以puts函数的地址还没有确定，而test2.txt中hello文件已经链接完成，所以puts函数的地址已经确定了。

#### 2. MIPS工具链

执行以下命令：

```Shell
mips-linux-gnu-gcc -c hello.c -o hello.o
mips-linux-gnu-objdump --section=.text --disassemble=main --source \
hello.o > test3.txt
```

test3.txt文件内容如下：

```

hello.o：     文件格式 elf32-tradbigmips


Disassembly of section .text:

00000000 <main>:
   0:   27bdffe0        addiu   sp,sp,-32
   4:   afbf001c        sw      ra,28(sp)
   8:   afbe0018        sw      s8,24(sp)
   c:   03a0f025        move    s8,sp
  10:   3c1c0000        lui     gp,0x0
  14:   279c0000        addiu   gp,gp,0
  18:   afbc0010        sw      gp,16(sp)
  1c:   3c020000        lui     v0,0x0
  20:   24440000        addiu   a0,v0,0
  24:   8f820000        lw      v0,0(gp)
  28:   0040c825        move    t9,v0
  2c:   0320f809        jalr    t9
  30:   00000000        nop
  34:   8fdc0010        lw      gp,16(s8)
  38:   00001025        move    v0,zero
  3c:   03c0e825        move    sp,s8
  40:   8fbf001c        lw      ra,28(sp)
  44:   8fbe0018        lw      s8,24(sp)
  48:   27bd0020        addiu   sp,sp,32
  4c:   03e00008        jr      ra
  50:   00000000        nop
```

再执行以下命令：

```Shell
mips-linux-gnu-gcc hello.c -o hello
mips-linux-gnu-objdump --section=.text --disassemble=main --source \
hello > test4.txt
```

test4.txt文件内容如下：

```

hello：     文件格式 elf32-tradbigmips


Disassembly of section .text:

00400650 <main>:
  400650:       27bdffe0        addiu   sp,sp,-32
  400654:       afbf001c        sw      ra,28(sp)
  400658:       afbe0018        sw      s8,24(sp)
  40065c:       03a0f025        move    s8,sp
  400660:       3c1c0043        lui     gp,0x43
  400664:       279c8010        addiu   gp,gp,-32752
  400668:       afbc0010        sw      gp,16(sp)
  40066c:       3c020040        lui     v0,0x40
  400670:       24440720        addiu   a0,v0,1824
  400674:       8f828024        lw      v0,-32732(gp)
  400678:       0040c825        move    t9,v0
  40067c:       0320f809        jalr    t9
  400680:       00000000        nop
  400684:       8fdc0010        lw      gp,16(s8)
  400688:       00001025        move    v0,zero
  40068c:       03c0e825        move    sp,s8
  400690:       8fbf001c        lw      ra,28(sp)
  400694:       8fbe0018        lw      s8,24(sp)
  400698:       27bd0020        addiu   sp,sp,32
  40069c:       03e00008        jr      ra
  4006a0:       00000000        nop
```

同样可以看到，test3.txt中lui和addiu的立即数是0，而test4.txt中lui和addiu的立即数不是0了。

#### objdump 参数含义

`--section=.text` 表示仅处理.text 节的内容；`--disassemble=main` 表示仅反汇编 main 符号的代码；`--source` 表示显示汇编代码与源代码的对应关系

### Thinking 1.2

make之后，进入tools/readelf目录，make生成readelf可执行文件后，执行以下命令：

```Shell
./readelf ~/24371286/target/mos
```

输出如下：

```
0:0x0
1:0x80020000
2:0x80021950
3:0x80021968
4:0x80021980
5:0x0
6:0x0
7:0x0
8:0x0
9:0x0
10:0x0
11:0x0
12:0x0
13:0x0
14:0x0
15:0x0
16:0x0
17:0x0
18:0x0
```

执行 `./readelf readelf` 命令没有任何输出。执行 `readelf -h readelf` 命令，输出如下：

```
ELF 头：
  Magic：   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00 
  类别:                              ELF64
  数据:                              2 补码，小端序 (little endian)
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  ABI 版本:                          0
  类型:                              DYN (Position-Independent Executable file)
  系统架构:                          Advanced Micro Devices X86-64
  版本:                              0x1
  入口点地址：               0x1180
  程序头起点：          64 (bytes into file)
  Start of section headers:          14488 (bytes into file)
  标志：             0x0
  Size of this header:               64 (bytes)
  Size of program headers:           56 (bytes)
  Number of program headers:         13
  Size of section headers:           64 (bytes)
  Number of section headers:         31
  Section header string table index: 30
```

而执行 `readelf -h hello` 命令，有如下输出：

```
ELF 头：
  Magic：   7f 45 4c 46 01 01 01 03 00 00 00 00 00 00 00 00 
  类别:                              ELF32
  数据:                              2 补码，小端序 (little endian)
  Version:                           1 (current)
  OS/ABI:                            UNIX - GNU
  ABI 版本:                          0
  类型:                              EXEC (可执行文件)
  系统架构:                          Intel 80386
  版本:                              0x1
  入口点地址：               0x8049750
  程序头起点：          52 (bytes into file)
  Start of section headers:          707128 (bytes into file)
  标志：             0x0
  Size of this header:               52 (bytes)
  Size of program headers:           32 (bytes)
  Number of program headers:         8
  Size of section headers:           40 (bytes)
  Number of section headers:         30
  Section header string table index: 29
```

再结合 Makefile 文件中对 readelf 和 hello 的编译选项分析，可以得出 readelf 是64位的，而hello是一个32位的可执行文件。我们的 readelf 程序只能处理32位的ELF文件。

```Shell
readelf: main.o readelf.o
        $(CC) $^ -o $@

hello: hello.c
        $(CC) $^ -o $@ -m32 -static -g
```

### Thinking 1.3

QEMU 模拟器支持直接加载 ELF 格式的内核，也就是说，QEMU 已经提供了 bootloader 的引导（启动）功能。MOS 操作系统不需要再实现 bootloader的功能。在 MOS 操作系统的运行第一行代码前，我们就已经拥有一个正常的程序运行环境，内存和一些外围设备都可以正常使用。在stage2阶段，QEMU会加载内核到内存，之后跳转到内核的入口，从而完成启动。

## 难点分析

1. ELF 文件格式
   ELF 是一种用于可执行文件、目标文件和库的文件格式。分为可重定位文件、可执行文件和共享对象文件三种类型。ELF 文件由 ELF 头、程序头表、节区头表和数据区组成。结构如下图
   ![alt text](image.png)

2. 计算地址时注意指针类型
    ```c
    void *p = 0x0;
    p = p + 5; // 结果为 0x5
    ```
    ```c
    int *p = 0x0;
    p = p + 5; // 结果为 0x14，因为int类型占4字节
    ```

3. 内核运行的正确位置以及如何控制内核加载地址
4. 可变参数表
   1. `va_list`，变长参数表的变量类型；
   2. `va_start(va_list ap, lastarg)`，用于初始化变长参数表的宏；
   3. `va_arg(va_list ap, 类型)`，用于取变长参数表下一个参数的宏；
   4. `va_end(va_list ap)`，结束使用变长参数表的宏。

## 实验体会

对于计算机启动的具体过程，之前只完全不了解，这次通过实验，仔细阅读了一个简单的内核，并且成功地启动了它，才真正体会到了计算机启动的全过程。对于ELF文件格式的理解也更加深入了，不过对于它的具体结构和作用还是需要进一步学习。总之，这次实验让我对计算机系统有了更深入的理解，也提高了我的动手能力和解决问题的能力。不过，还是有许多细节需要进一步学习和掌握的，比如内核的具体实现、内存管理等方面的知识。希望在后续的实验中能够继续深入学习这些内容。

## 原创声明

本实验报告基本为本人原创，在一些内容上引用了指导书的内容。
