---
title: BUAA OS Lab3 实验报告
date: 2026-08-08 10:00:00
categories: [实验报告]
tags: [BUAA_OS, 操作系统]
description: BUAA OS Lab3 实验报告。
---

## 思考题

### Thinking 3.1

把页目录的物理地址写入第 `PDX(UVPT)` 个页目录项，并设置为有效 `PTE_V`。用户态程序可以直接访问 `UVPT` 地址读取自己的页表，用于调试 / 系统调用

### Thinking 3.2

`load_icode` 函数中对 `elf_load_seg` 的调用如下：

```c
panic_on(elf_load_seg(ph, binary + ph->p_offset, load_icode_mapper, e));
```

`data` 这一参数的来源即是进程控制块的指针 `e`，它的作用是要在页表中建立映射。所以没有这个参数不可以，否则无法在页表中建立映射，进程就无法访问到它的代码段和数据段了。

### Thinking 3.3

需要处理三种页面的加载情况：1. 从va开始，未页对齐的部分。2. 开头页对齐的数据页面。3. 超出bin_size部分的.bss内容。

### Thinking 3.4

虚拟地址。`env_tf.cp0_epc` 字段指示的是进程恢复运行时PC应恢复到的位置，CPU访问的地址都是虚拟地址。

### Thinking 3.5

0号异常处理函数在 kern/genex.S 中，如下

```asm
NESTED(handle_int, TF_SIZE, zero)
	mfc0    t0, CP0_CAUSE
	mfc0    t2, CP0_STATUS
	and     t0, t2
	andi    t1, t0, STATUS_IM7
	bnez    t1, timer_irq
timer_irq:
	li      a0, 0
	j       schedule
END(handle_int)
```
1、2/3号异常处理函数根据 kern/genex.S 中的定义，分别为 `do_tlb_mod` 和 `do_tlb_refill`

```asm
BUILD_HANDLER tlb do_tlb_refill

#if !defined(LAB) || LAB >= 4
BUILD_HANDLER mod do_tlb_mod
BUILD_HANDLER sys do_syscall
#endif
```

1号异常处理函数在 kern/tlbex.c 中，如下

```c
void do_tlb_mod(struct Trapframe *tf) {
	struct Trapframe tmp_tf = *tf;

	if (tf->regs[29] < USTACKTOP || tf->regs[29] >= UXSTACKTOP) {
		tf->regs[29] = UXSTACKTOP;
	}
	tf->regs[29] -= sizeof(struct Trapframe);
	*(struct Trapframe *)tf->regs[29] = tmp_tf;
	Pte *pte;
	page_lookup(cur_pgdir, tf->cp0_badvaddr, &pte);
	if (curenv->env_user_tlb_mod_entry) {
		tf->regs[4] = tf->regs[29];
		tf->regs[29] -= sizeof(tf->regs[4]);
		// Hint: Set 'cp0_epc' in the context 'tf' to 'curenv->env_user_tlb_mod_entry'.
		/* Exercise 4.11: Your code here. */
		tf->cp0_epc = curenv->env_user_tlb_mod_entry;
	} else {
		panic("TLB Mod but no user handler registered");
	}
}
```

2/3号异常处理函数在 kern/tlb_asm.S 中，如下

```asm
NESTED(do_tlb_refill, 24, zero)
	mfc0    a1, CP0_BADVADDR
	mfc0    a2, CP0_ENTRYHI
	andi    a2, a2, 0xff /* ASID is stored in the lower 8 bits of CP0_ENTRYHI */
.globl do_tlb_refill_call;
do_tlb_refill_call:
	addi    sp, sp, -24 /* Allocate stack for arguments(3), return value(2), and return address(1) */
	sw      ra, 20(sp) /* [sp + 20] - [sp + 23] store the return address */
	addi    a0, sp, 12 /* [sp + 12] - [sp + 19] store the return value */
	jal     _do_tlb_refill /* (Pte *, u_int, u_int) [sp + 0] - [sp + 11] reserved for 3 args */
	lw      a0, 12(sp) /* Return value 0 - Even page table entry */
	lw      a1, 16(sp) /* Return value 1 - Odd page table entry */
	lw      ra, 20(sp) /* Return address */
	addi    sp, sp, 24 /* Deallocate stack */
	mtc0    a0, CP0_ENTRYLO0 /* Even page table entry */
	mtc0    a1, CP0_ENTRYLO1 /* Odd page table entry */
	nop
	/* Hint: use 'tlbwr' to write CP0.EntryHi/Lo into a random tlb entry. */
	/* Exercise 2.10: Your code here. */
	tlbwr
	jr      ra
END(do_tlb_refill)
```

### Thinking 3.6

在 MIPS 架构的实验环境中，时钟中断的开启与关闭主要通过 `CP0_STATUS` 寄存器中的 IE（全局中断使能）位和 EXL（异常级）位，以及 `CP0_CAUSE` 中的中断屏蔽位来控制。

1. 时钟中断关闭的时机
   * 进入异常处理程序初期 (`entry.S`)：
     在 `exc_gen_entry` 中，代码通过位运算显式清除了 `STATUS_IE` 位：
     `and t0, t0, ~(STATUS_UM | STATUS_EXL | STATUS_IE)`
     以保持处理器处于内核态（UM==0）、关闭中断且允许嵌套异常。
   * 重置时钟计数器时 (`env_asm.S`)：
     在 `env_pop_tf` 中调用了 `RESET_KCLOCK` 宏。 虽然这主要是重置计数器，但在内核态执行这类底层操作时，系统通常处于中断禁止状态，以保证原子性。

2. 时钟中断开启的时机
   * 恢复用户态上下文并返回时 (`genex.S` & `entry.S`)：
     异常处理结束时会跳转到 `ret_from_exception`。该函数调用 `RESTORE_ALL` 宏从栈中恢复寄存器，开启了中断。
   * 用户进程运行期间：
     当程序在用户态正常执行时，`STATUS` 寄存器的 `IE` 位为 1 且 `EXL` 位为 0，此时时钟中断是开启的，以便内核进行进程调度（如 `timer_irq` 触发 `schedule`）。

### Thinking 3.7

首先，在触发时钟中断后，CPU会跳转至异常处理入口，之后运行异常处理指令。异常处理指令首先会根据异常类型跳转到不同的异常处理函数中，针对时钟中断，会跳转到时钟中断函数。在内部，会判断是否是时钟中断，如果是的话会跳转到time_irq函数中，在进行一些操作后跳转到schedule函数。schedule函数会判断当前进程进程是否需要切换，如果需要切换的话，会将当前进程移至sched队列末尾，并选取sched队列头的进程去运行。从而实现进程的调度。

## 难点分析

`static int env_setup_vm(struct Env *e)` 为一个新的 Env（进程控制块）初始化虚拟内存系统，完成三件核心事：
1. 分配物理页作为进程专属页目录
2. 复制内核模板页目录，让所有进程共享内核地址空间
3. 自映射页目录，让用户态可以读取自身页表

`static void load_icode(struct Env *e, const void *binary, size_t size)` 将内存中的 ELF 二进制镜像加载到指定用户环境（`struct Env *e`）的虚拟地址空间，并设置程序入口点。


## 实验体会

本实验虽然易于上手，但由于细节繁杂，必须通过课后复习来厘清各项操作的深层意图。

例如，在共享页目录时，要领悟 MOS 是如何通过复制页目录项（即共享二级页表）来对用户进程开放特定空间的。此外，还需拆解 ELF 段加载过程：研究 elf_load_seg 如何借助回调函数 load_icode_mapper 将数据搬运至物理内存，并细究每一页加载时的映射逻辑与数据量把控。

## 原创声明

本实验报告内容大部分为原创，其中部分代码片段来自课程提供的实验框架和示例代码，Thinking 3.7 参考了[北航操作系统-OS-lab3-实验报告](https://lucky-sheltered-boy.github.io/2025/07/01/%E5%8C%97%E8%88%AA%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F-OS-lab3-%E5%AE%9E%E9%AA%8C%E6%8A%A5%E5%91%8A/)
