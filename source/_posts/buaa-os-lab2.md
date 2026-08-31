---
title: BUAA OS Lab2 实验报告
date: 2026-08-07 10:00:00
categories: [BUAA OS, 实验报告]
tags: [BUAA OS]
description: BUAA OS Lab2 实验报告。
---

## 思考题

### Thinking 2.1

两者都是虚拟地址

### Thinking 2.2

- 方便复用，可读性和可维护性高
- 中间插入/删除：双向链表 $O(1)$，单向/循环 $O(n)$。头尾操作：三者性能一样。

### Thinking 2.3

C

### Thinking 2.4

- 在多进程操作系统中，不同进程的虚拟地址空间是相互隔离且可能重叠的，引入 ASID 的必要性在于它为 TLB 条目增加了“身份标签”，**使得多个进程的地址映射能在 TLB 中共存**，从而避免了在进程切换时必须强制清空整个 TLB 所带来的巨大性能开销，显著提升了系统在多任务环境下的内存访问效率。
- 根据 MIPS 4Kc 文档中对 `EntryHi` 寄存器结构的定义，**ASID 段占据了 8 位（bit 7 到 bit 0）**，由于 $2^8 = 256$，因此该处理器架构在不刷新 TLB 的情况下，最多可以同时标识并容纳 **256 个** 不同的地址空间。

### Thinking 2.5

- `tlb_invalidate` 中 调用了 `tlb_out`。
- `tlb_invalidate` 的作用是：让 CPU 里的虚拟地址缓存失效。
- 如下

```c
# 1. 定义函数入口：LEAF是MIPS汇编宏，标记函数开始
LEAF(tlb_out)

# 2. 汇编器指令：禁止指令重排序（MIPS硬件/汇编器可能重排指令，TLB操作必须严格顺序）
.set noreorder

# 3. 保存原CP0_ENTRYHI寄存器的值到t0
# CP0_ENTRYHI：存放TLB查询的虚拟页号(VPN)，是TLB匹配的关键字段
mfc0    t0, CP0_ENTRYHI

# 4. 将函数参数a0（待删除的虚拟地址）写入CP0_ENTRYHI
# 为后续TLB查询做准备
mtc0    a0, CP0_ENTRYHI

# 5. 空指令nop：等待CP0寄存器写入完成（MIPS协处理器访问需要延时槽）
nop

/* Step 1: 使用tlbp指令查询TLB表项 */
# tlbp：TLB Probe（TLB查询指令）
# 功能：用CP0_ENTRYHI中的VPN匹配TLB表项，匹配结果写入CP0_INDEX
tlbp
nop  # 等待tlbp指令执行完成

/* Step 2: 从CP0_INDEX寄存器读取查询结果 */
# CP0_INDEX：存放TLB匹配结果
#  - 若匹配成功：存储对应TLB表项的索引（非负数）
#  - 若匹配失败：存储0x80000000（最高位为1，值为负数）
mfc0    t1, CP0_INDEX

# 6. 恢复汇编器指令重排序（默认模式）
.set reorder

# 7. 条件跳转：若t1 < 0（即TLB未找到对应表项），跳转到NO_SUCH_ENTRY
bltz    t1, NO_SUCH_ENTRY

# 8. 再次禁止指令重排序（TLB写入操作必须严格顺序）
.set noreorder

# 9. 清空CP0_ENTRYHI / ENTRYLO0 / ENTRYLO1 寄存器
# zero是MIPS零寄存器，写入0 = 清空寄存器
# 这三个寄存器是TLB表项的核心数据，清空后代表TLB表项无效
mtc0    zero, CP0_ENTRYHI
mtc0    zero, CP0_ENTRYLO0
mtc0    zero, CP0_ENTRYLO1
nop  # 等待寄存器写入完成

/* Step 3: 使用tlbwi指令将清空的值写入TLB表项 */
# tlbwi：TLB Write Indexed（按索引写入TLB）
# 功能：根据CP0_INDEX中的索引，将ENTRYHI/ENTRYLO0/ENTRYLO1的值写入对应TLB表项
# 此处写入全0，实现TLB表项**无效化/删除**
tlbwi

# 10. 恢复指令重排序
.set reorder

NO_SUCH_ENTRY:
	mtc0    t0, CP0_ENTRYHI
	j       ra
END(tlb_out)
```

### Thinking 2.6

| 流程图步骤 (硬件行为)                     | 对应 Lab2 函数 (软件实现)       | 逻辑关联说明                                                                      |
| :---------------------------------------- | :------------------------------ | :-------------------------------------------------------------------------------- |
| **查询目标页面是否存在于 TLB 中**         | (由硬件 MMU 自动执行)           | 这是访存的第一步，硬件通过虚拟地址匹配 TLB 条目。                                 |
| **触发 TLB Miss**                         | `do_tlb_refill`                 | TLB 缺失会触发异常。`do_tlb_refill` 是处理该异常的总入口，负责后续的查表与重填。  |
| **根据页目录和虚拟地址寻找页表项**        | `_do_tlb_refill` / `pgdir_walk` | 软件模拟硬件查表过程。内核根据 `va` 在二级页表结构中定位具体的页表项（PTE）。     |
| **页目录中的页表是否有效**                | `passive_alloc` / `page_alloc`  | 如果对应的二级页表还未分配，内核需要调用 `page_alloc` 分配一个物理页作为新页表。  |
| **从页表中查找页表项**                    | `page_lookup`                   | 在已有的页表中查找虚拟地址对应的物理页面描述。                                    |
| **页表项是否有效**                        | `page_insert`                   | 如果页表项为空（未建立映射），则需要分配物理页并使用 `page_insert` 将其填入页表。 |
| **取出相邻奇偶页填入 EntryLo...写回 TLB** | `tlb_out` / `tlb_update`        | 将查找到的物理页信息（PPN）和属性位填充到寄存器，并执行 TLB 写指令，完成重填。    |
| **再次访存 / 读取 PPN 完成访存**          | (硬件重新执行指令)              | TLB 更新后，异常返回，CPU 重新执行刚才失败的访存指令，此时会命中 TLB。            |

### Thinking 2.7

x86 与 MIPS 的内存管理区别

MIPS 作为典型的精简指令集（RISC）代表，与 x86（CISC 演进而来）在设计思路上有本质不同：

| 特性               | x86 (CISC)                                                                      | MIPS (RISC)                                                                                           |
| :----------------- | :------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------- |
| **地址转换流程**   | **分段 + 分页**。逻辑地址 $\rightarrow$ 线性地址 $\rightarrow$ 物理地址。       | **直接分页/映射**。虚拟地址通过 TLB 直接转换为物理地址。                                              |
| **页表管理方式**   | **硬件管理 (Hardware-managed)**。MMU 自动遍历内存中的页表，性能开销由硬件承担。 | **软件管理 (Software-managed)**。MMU 只负责 TLB 匹配。若 TLB 未命中（Miss），由操作系统内核手动处理。 |
| **内存布局**       | 相对统一。通过页表项属性定义访问权限。                                          | **硬性分段**。虚拟空间被硬性划分为 kuseg, kseg0, kseg1 等，部分区域（如 kseg0）不经过 TLB 直接映射。  |
| **复杂性与灵活性** | 机制极其复杂，兼容性包袱重，但对编译器和 OS 开发友好。                          | 机制极其简单，硬件设计精简，但将大量管理负担转嫁给了操作系统软件。                                    |

## 难点分析

1. 两级页表结构理解。何时为虚拟地址，何时为物理地址，以及它们在不同阶段的转换关系。
   ![alt text](image.png)
2. 各种宏定义。各个宏定义的作用和使用方式。
3. 各个函数的作用。页表分配、页表项查找、页表项插入、TLB 更新等函数的作用和实现细节。

## 实验体会

对于C语言指针的理解与应用还有待加强，各种宏定义还需要记忆和理解，函数的作用和实现细节也需要加强理解。
页表的具体运作流程也需要熟练掌握，才能更好地理解、实现和扩展相关功能。

## 原创声明

本实验报告大部分原创，少部分参考了[lucky-sheltered-boy's Blog](https://lucky-sheltered-boy.github.io/2025/07/01/%E5%8C%97%E8%88%AA%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F-OS-lab2-%E5%AE%9E%E9%AA%8C%E6%8A%A5%E5%91%8A/)。
