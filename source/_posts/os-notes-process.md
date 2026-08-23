---
title: OS 理论笔记：进程管理与死锁
date: 2026-08-15 10:00:00
categories: [理论笔记]
tags: [BUAA_OS, 操作系统]
description: OS 理论笔记：进程管理与死锁。
---

# 进程与线程

## 进程

### 并发与并行

并发Concurrent：设有两个活动a1和a2，如果在某一指定的时间t，只要a1和a2都处在各自的起点和终点之间的某一处，则称a1和a2是并发执行的。

程序的并发执行是指若干个程序（或程序段）**同时**在系统中运行，这些程序（或程序段）的执行在时间上是重叠的。

并行Parallel：如果考虑两个程序,它们在同一时间度量下**同时运行在不同的处理机（或核心）上**，则称这两个程序是并行执行的。
- 并行一定并发，反之不然

#### 程序的顺序执行与特征
顺序性：按照程序结构所指定的次序（可能有分支或循环）
封闭性：独占全部资源，计算机的状态只由于该程序的控制逻辑所决定
可再现性：初始条件相同则结果相同。

#### 程序并发执行时的特征
间断性：并发程序具有“执行---暂停---执行”这种间断性的活动规律。
非封闭性：多个程序共享系统中的资源（如共享内存），这些资源的状态将由多个程序来改变，致使程序之间相互影响。
不可再现性：在所有输入相同的情况下，程序的执行结果还依赖于执行的次序。

原因：调度产生了不确定性，发生了**数据竞争**：
- 数据竞争：多个进程在没有同步保护的情况下访问同一个共享变量， 而且至少有一个是写。
- 数据竞争非常难以循环调试：每次执行不确定，调试的时候可能会消失，Heisenbug。

> 数据竞争，原子性违反，死锁是三类典型的并发错误

![alt text](image-1.png)

#### Bernstein条件

并发进程的无关性是进程与时间无关的一个**充分**条件，这一条件在1966年首先由Bernstein提出，称为Bernstein条件。

定义：

- R(Si)：Si的读子集，其值在Si中被引用的变量的集合
- W(Si)：Si的写子集，其值在Si中被改变的变量的集合

Bernstein条件：

- 两个进程S1和S2可并发，当且仅当下列条件同时成立：
  - $R(S1) \cap W(S2) = \Phi$
  - $W(S1) \cap R(S2) = \Phi$
  - $W(S1) \cap W(S2) = \Phi$

![alt text](image-2.png)

### 进程概念

> “程序”与“计算”不是一一对应的关系：一个程序段可能对应多个“计算”
> 多道程序＋资源的限制：执行-暂停-执行
> - 直接制约：逻辑上相互依赖（合作）
> - 间接制约：使用共享资源（竞争）
> 
> 使用“程序”不能揭示多道程序、分时系统引发的动态特性，因此引入“进程”（Process）
> 进程是对CPU资源的一种抽象

进程是程序在一个数据集合上运行的过程，它是系统进行资源分配和调度的一个独立单位。

动态性：进程是程序的一次执行过程。动态性还表现为它因创建而产生，因调度而执行，因无资源而暂停，因撤消而消亡。而**程序是静态实体**。
并发性：多个进程实体同时存在于内存中，能在一段时间内同时运行。
独立性：在传统OS中，进程是独立运行的基本单位
异步性：也叫制约性，进程之间相互制约，进程以各自独立的不可预知的速度向前推进。
结构特征：程序段，数据段，进程控制块PCB

一个进程应该包括
- 程序的代码；
- 程序的数据；
- PC中的值，用来指示下一条将运行的指令；
- 一组通用的寄存器的当前值，堆、栈；
- 一组系统资源（如打开的文件）

引入进程的利弊
- 利：对CPU抽象，方便使用
- 弊：空间开销、时间开销。
  - 空间：进程的页表，堆栈，堆
  - 时间：进程切换的开销

进程与程序的区别
- 进程是动态的，程序是静态的：程序是有序代码的集合；**进程是程序的执行**。通常进程不可在计算机之间迁移；而程序通常对应着文件、静态和可以复制。
- 进程是暂时的，程序是永久的：进程是一个状态变化的过程，程序可长久保存。
- 进程与程序的组成不同：进程的组成包括程序、数据和进程控制块（即进程状态信息）。
- 进程与程序的对应关系：通过多次执行，**一个程序可对应多个进程**；通过调用关系，**一个进程可包括多个程序**。

![alt text](image-3.png)

### 进程状态与控制

#### 原语
由若干条指令所组成的指令序列，来实现某个特定的操作功能
- 指令序列执行是**连续的，不可分割**
- 是操作系统内核组成部分
- 必须在管态（**内核态**）下执行，且常驻内存

与系统调用的区别？
- 原语不可中断
- 常常执行时关闭中断实现

![alt text](image-7.png)

#### Fork()函数

例1
```c
#include <stdio.h>
#include <unistd.h>  // fork函数所在头文件

int main() {
    printf("进程启动，PID=%d\n", getpid());

    // 创建子进程
    pid_t pid = fork();

    if (pid < 0) {
        // 创建失败
        perror("fork失败");
    } 
    else if (pid == 0) {
        // 子进程执行这里
        printf("我是子进程，PID=%d，父PID=%d\n", getpid(), getppid());
    } 
    else {
        // 父进程执行这里
        printf("我是父进程，PID=%d，子PID=%d\n", getpid(), pid);
    }

    return 0;
}
```

输出

```
进程启动，PID=20739
我是父进程，PID=20739，子PID=20740
我是子进程，PID=20740，父PID=20739
```

fork调用的一个奇妙之处就是它仅仅被调用一次，调用成功时却能够返回两次，它可能有三种不同的返回值：
1) 在父进程中，fork返回**新创建子进程的进程ID**；
2) 在子进程中，fork返回0；
3) 如果出现错误，fork返回一个负值；

例2

```c
char str[10];
int fd = open("file.txt", O_RDWR);
if (fork() == 0) {
    // 子进程
    ssize_t cnt = read(fd, str, 10);
    printf("Child process: %s\n", str);
} else {
    // 父进程
    ssize_t cnt = read(fd, str, 10);
    printf("Parent process: %s\n", str);
}
```

输出

```
Parent process: abcdefghij
Child process: klmnopqrst
```

fd虽然被复制，但指向同一个文件结构体，所以两个进程共享了同一个指向文件的结构体
父子进程会**共享偏移量和状态**

![alt text](image-4.png)

#### 进程状态

进程的三种基本状态
- 就绪状态：进程已获得除处理机外的所需资源，等待分配处理机资源；只要分配CPU就可执行。
- 执行状态：占用处理机资源；处于此状态的进程的数目小于等于CPU的数目。在没有其他进程可以执行时（如所有进程都阻塞），通常会自动执行系统的idle进程（相当于空操作）。
- 阻塞状态：正在执行的进程，由于发生某种事件而暂时无法执行，便放弃处理机处于阻塞状态。

![alt text](image.png)

就绪 $\rightarrow$ 运行
- 调度程序选择一个进程运行

运行 $\rightarrow$ 就绪
- 运行进程用完了时间片
- 运行进程被中断，因为一高优先级进程处于就绪状态（抢占式调度）

运行 $\rightarrow$ 阻塞
- 当一进程所需的资源必须等待时
- OS尚未完成服务
- 对一资源的访问尚不能进行
- 初始化 I/O 且必须等待结果
- 等待某一进程提供输入(IPC)

阻塞 $\rightarrow$ 就绪
- 当等待的事件发生时

> 就绪 $\rightarrow$ 阻塞能否发生？
> 只有运行的进程才能阻塞。就绪的进程无法执行I/O或其他引发阻塞的操作。

![alt text](image-5.png)

#### 进程控制

##### 进程控制块 PCB

系统为每个进程定义了一个数据结构：进程控制块 PCB（Process Control Block）。

作用：
- 实现进程创建、撤消；
- 包含进程唯一标志；
- 限制系统进程数目。

内容：

进程标识符(PID)
程序和数据地址
当前状态：
- 为了管理的方便，系统设计时会将相同的状态的进程组成一个**队列**，如就绪进程队列。
- 等待进程则要根据等待的事件组成多个等待队列，如等待打印机队列、等待磁盘I/O完成队列等等。

现场保护区：
- 当进程因某种原因不能继续占用CPU时（等待打印机），释放CPU，这时就要将CPU的各种状态信息保护起来（如**寄存器**），再次得到处理机，恢复CPU的各种状态，继续运行。

同步与互斥机制
优先级
资源清单：如拥有的I/O设备，打开的文件列表等
链接字：即指向队列中下一个进程PCB的首地址的指针
其他信息：进程记账信息，进程占用CPU的时间等。

![alt text](image-6.png)

具体代码实现：

```c
struct Env {
    struct Trapframe env_tf;	 // saved context (registers) before switching
	LIST_ENTRY(Env) env_link;	 // intrusive entry in 'env_free_list'
	u_int env_id;			 // unique environment identifier
	u_int env_asid;			 // ASID of this env
	u_int env_parent_id;		 // env_id of this env's parent
	u_int env_status;		 // status of this env
	Pde *env_pgdir;			 // page directory
	TAILQ_ENTRY(Env) env_sched_link; // intrusive entry in 'env_sched_list'
	u_int env_pri;			 // schedule priority
}
```

env_tf : Trapframe 结构体的定义在 include/trap.h 中在发生进程调度或当陷入内核时，会将当时的进程上下文环境保存在 env_tf 中。
env_link : env_link 和 env_free_list来构造空闲进程表
env_id : 进程独一无二的标识符。
env_parent_id : 存储了创建本进程的父进程id。这样父子进程之间关联可以形成一棵进程树。
env_status : 进程状态
- ENV_FREE : 表明进程是不活动的，即进程控制块处于进程空闲链表中。
- ENV_NOT_RUNNABLE : 表明进程处于阻塞状
- ENV_RUNNABLE : 进程处于执行状态或就绪状态即其可以是正在运行也可以是正在等待调度。

env_pgdir : 进程页目录的内核虚拟地址。
env_cr3 : 进程页目录的物理地址。
env_sched_link : 用于构造调度队列。
env_pri : 保存进程的优先级。

#### PCB 组织方式

线性表
索引方式
链接方式：系统按照进程的状态将进程的PCB组成队列，从而形成就绪队列、阻塞队列、运行队列等。

#### 中断处理触发的进程切换流程

中断处理 = 当前程序暂停 $\rightarrow$ 保存现场 $\rightarrow$ 处理中断数据 $\rightarrow$ 可能切换进程 $\rightarrow$ 恢复进程执行

**与陷入内核的不同**

用户态 $\rightarrow$ 内核态 $\rightarrow$ 执行 $\rightarrow$ 返回用户态
同一个进程，地址空间不变，只需要保存PC/PSW少量寄存器

进程 A $\rightarrow$ 进程 B
保存所有寄存器，**地址空间切换(页表,TLB刷新)**，PCB以及调度队列的更新

![alt text](image-8.png)

**进程上下文切换**是由操作系统**内核**完成的操作，需要修改 CPU 寄存器、页表、PCB 等关键数据，这些操作都属于内核态特权指令，用户态进程无法直接执行。因此，进程切换必须通过系统调用 / 中断陷入内核，由内核完成调度与切换。
大部分系统调用处理完成后，会直接返回原进程继续执行，不会发生进程切换。

## 线程

### 线程概念

进程的不足：
- 一个进程只能在一个时间干一件事，如果想同时干两件事或多件事，进程就无能为力了。
- 进程之间切换开销很大。
- 多个进程共享数据或通讯开销很大

进程包含了两个概念：资源拥有者和可执行单元。操作系统将资源拥有者称为进程（process, task），可执行单元称为线程（Thread）。
线程也称为轻量级进程 将资源与计算分离，提高并发效率。

> **进程与线程的区别**
> 1. 基本单位不同
>    - 进程：资源分配的基本单位
>    - 线程：CPU 调度与执行的基本单位
> 2. 资源拥有情况
>    - 进程拥有独立的地址空间、内存、文件描述符、打开的文件等**完整资源**。
>    - 线程**不独立拥有资源**，共享所属进程的地址空间、数据段、堆、文件等，只拥有自己的栈、程序计数器、寄存器等少量私有信息。
> 3. 切换开销
>    - 进程切换：开销大，需要切换页表、刷新 TLB、保存完整上下文。
>    - 线程切换：开销小，只需保存和恢复执行上下文（寄存器和栈）。
> 4. 通信与同步
>    - 进程间通信（IPC）复杂：管道、消息队列、共享内存、信号量等。
>    - 线程间通信简单：直接读写进程的全局变量、堆数据即可，但需要同步（互斥锁、条件变量等）。
> 5. 独立性与健壮性
>    - 进程相互独立，一个进程崩溃一般**不会影响其他进程**。
>    - 同一进程内的线程共享资源，一个线程崩溃（如段错误）**通常会导致整个进程崩溃**。

![alt text](image-9.png)

引入进程好处 多个程序可以并发执行，改善资源使用率，提高系统效率
引入线程好处 减少并发程序执行时所付出的时空开销，使得并发粒度更细、并发性更好

![alt text](image-10.png)

### 线程的实现方式

#### 用户级线程

线程在用户空间,通过library模拟实现的thread,不需要或仅需要极少的kernel支持
上下文切换比较快,因为线程切换不用更改页表等,使用起来较为轻便快速

用户级的线程库的主要功能：
- 创建和销毁线程
- 线程之间**传递消息和数据**
- 调度线程执行
- 保存和恢复线程上下文

用户级线程的优缺点

优点
- 线程切换与内核无关
- 线程的调度由应用决定，容易进行优化
- 可运行在**任何操作系统**上，只需要线程库的支持

不足
- 很多**系统调用会引起阻塞**，内核会因此而**阻塞所有相关的线程**。
- 内核只能将处理器分配给进程，即使有多个处理器，也**无法实现一个进程中的多个线程的并行执行**。

#### 内核级线程

内核级线程就是kernel有好几个分身,一个分身可以处理一件事.
这用来处理**异步事件**很有用, kernel可以对每个异步事件产生一个线程来处理.
支持内核线程的操作系统内核称作多线程内核

内核级线程的优缺点

优点
- 内核可以在多个处理器上调度**一个进程的多个线程实现同步并行执行**
- 阻塞发生在线程级别
- 内核本身的处理可以通过多线程实现

缺点
- 一个进程中的线程切换需要内核参与，涉及到内核的状态转换
- **降低效率**

#### 混合的线程实现方式

- 系统实现内核级线程
- 用户使用用户级线程
- 实现从用户空间的线程到内核空间线程的多路复用

# 进程调度

## 基本概念

### CPU调度

CPU 调度（CPU Scheduling）的任务是协调多个进程（或线程）对 CPU 的竞争。

本质：按照某种调度策略，从就绪队列中选择一个实体执行。

典型场景：
- N 个进程处于就绪态，等待 CPU；
- 系统有 M 个 CPU（M >= 1）；
- OS 必须决定“哪个进程使用哪个 CPU”。

什么时候调度最有价值？
- 当 CPU 是稀缺资源时。
- 多道程序分时系统、服务器场景、主机系统通常更依赖调度质量。

### 进程状态与调度触发

三态模型：就绪、运行、阻塞。

常见调度时机：
- **新进程创建**后（父子谁先运行）；
- 进程运行结束；
- 进程因 I/O/信号量等原因阻塞；
- I/O 中断完成，阻塞进程转就绪；
- 时钟中断到来（时间片用完）。

只要 OS 重新获得 CPU 控制权，就可能发生切换：
- 用户态系统调用（可能阻塞）；
- 外部中断；
- 异常/陷阱（如非法访问）。

### 调度执行与上下文切换

一次切换通常包括：
- 保存当前进程 CPU 上下文（PC、寄存器等）；
- 保存/更新内存映像信息（如页表）；
- 更新当前 PCB 状态并入对应队列（就绪/阻塞）；
- 选择下一个可运行进程；
- 恢复其上下文并切换执行。

> 上下文切换有开销（寄存器保存恢复、缓存/TLB影响、内核路径），应避免无意义的频繁切换。

### 传统三级调度

高级调度（宏观/作业调度）：从**用户**工作流程的角度，一次提交的若干个作业，对每个作业进行调度。
- 决定接纳哪些作业、接纳多少；
- 时间尺度通常为分钟/小时/天。

中级调度（内外存交换）：从**存储器资源**的角度。将进程的部分或全部换出到外存上，将当前所需部分换入到内存。
- 决定进程换入换出，缓解内存压力。

低级调度（微观/进程或线程调度）：从**CPU资源**的角度，执行的单位。
- 直接分配 CPU；
- 时间尺度通常为毫秒，频繁且要求实现高效。

![alt text](image-23.png)

## 调度算法设计要考虑的问题

### 进程类型

I/O 密集型（I/O-bound）：
- CPU burst 短，频繁等待 I/O。

CPU 密集型（CPU-bound）：
- 计算为主，CPU burst 长。

![alt text](image-24.png)

### 调度分类

按是否抢占：根据是否在时钟中断作出调度决策
- 非抢占式：进程主动放弃或阻塞后才切换；
- 抢占式：时钟中断到达可强制切换。

按应用领域：根据不同的应用领域，优化目标不同
- 批处理系统：追求吞吐量与平均周转；
- 交互式系统：追求响应时间；
- 实时系统：追求截止时间可满足性和可预测性。

### 目标与评价指标

通用目标：
- 公平性：给每个进程公平的CPU份额
  - 相似的进程应该得到相似的CPU份额
  - 不同类型的进程可以有区别
    核反应控制 v.s. 薪水计算
- 策略可执行：必须能够严格执行策略
- 平衡性：让 CPU/I/O 等资源尽量都忙起来

批处理常用指标：
- 吞吐量：单位时间（每小时）完成**作业数**
- 周转时间：完成时刻 - 提交时刻
- 带权周转时间：周转时间 / 服务时间（执行时间）
- 平均周转时间：$\bar{T}=\frac{1}{n}\sum_{i=1}^{n}T_i$
- 平均带权周转时间：$\bar{W}=\frac{1}{n}\sum_{i=1}^{n}\frac{T_i}{T_{s,i}}$
- CPU利用率
  - 常常被用做评估批处理系统的指标
  - 不如吞吐量有效
  - CPU利用率接近100% -> 需要购买额外的硬件了

交互式目标：
- 最小化响应时间：用户输入一个请求（如击键）到系统给出首次响应（如屏幕显示）的时间
- 等比例变化：任务花费时间随任务复杂度“近似线性”增长，避免卡顿和长尾。

实时系统目标：
- 满足截止时间：满足所有或者大多数应用的截止时间
  - 例如飞控系统需要100ms内完成飞行控制命令
- 可预测性：保证可预测性和确定性
  保证最坏情况可预测，而不只是平均快。

调度算法本身的目标
- 易于实现
- 执行的性能开销小

### 时间片（Time Slice / Quantum）

一个时间段，分配给调度上CPU的进程，以确定允许该进程运行的时间长度。

时间片设置的权衡：
- 太短：切换频繁，系统开销大；
- 太长：响应变差，交互体验下降。

经验：
- 一般在“响应性”和“切换开销”之间取折中（如几十 ms 量级）。

## 批处理系统调度算法

### 先来先服务 FCFS

基本思想：按到达先后进入就绪队列，队首先执行（非抢占）。

特点：
- 优点：简单、公平、易实现；
- 缺点：短作业可能被长作业拖慢（护航效应），平均周转可能偏大。

### 最短作业优先 SJF

基本思想：优先选择估计运行时间最短的作业（非抢占）。

特点：
- 优点：在作业同时就绪时，可显著降低平均周转时间；
- 缺点：长作业可能长期等待；执行时间难以精准预测。

> 结论：在可预估运行时间的前提下，SJF 对平均周转时间通常优于 FCFS。

### 最短剩余时间优先 SRTN

SJF 的抢占式版本：
- 当新到达作业的“剩余时间”小于当前运行作业时，立即抢占。

特点：
- 优点：对短任务更友好；
- 缺点：若短任务源源不断，长任务可能饥饿。

### 最高响应比优先 HRRN

折中思想：同时考虑等待时间和服务时间。

响应比：
- $RP = 1 + \frac{等待时间}{服务时间}$

特点：
- 短作业通常响应比高，容易先执行；
- 长作业等待足够久后响应比也会提升，能抑制饥饿；
- 需每次调度前计算响应比，有额外开销。

## 交互式系统调度算法

### 时间片轮转 RR

基本思想：
- 所有就绪进程按 FCFS 排队；
- 每次给队首一个时间片；
- 时间片到且未完成则移到队尾。

特点：
- 公平、简单、响应性较好；
- 性能高度依赖时间片大小。

![alt text](image-25.png)

### 优先级调度

给每个进程分配优先级，高优先级优先执行。

静态优先级：创建时确定，运行中不变。依据：
- 进程类型（系统进程和交互进程优先级较高）
- 对资源的需求（对CPU和内存需求较少的进程，优先级较高）
- 用户要求（紧迫程度和付费多少）

动态优先级：
- 可根据等待时长、近期 CPU 使用、I/O 行为动态调整；
- 常用于兼顾响应性与公平性。

潜在问题：
- 低优先级进程可能长期得不到 CPU（饥饿）。

### 多级队列 MQ

思想：
- 按任务类型划分多个就绪队列；
- 队列间按优先级调度，队列内可用 FCFS 或 RR。

![alt text](image-26.png)

问题：

- 饥饿 
  - 高优先级队列一直有进程
  - 低优先级队列永远得不到CPU -> 饥饿

- 优先级静态
  - 优先级不会变化 -> 错误的分配无法纠错

- 对进程行为“不敏感”
  - I/O密集v.s.交互进程v.s.CPU密集 -> 无法区别对待
  - 预先难以知道进程对执行时间的要求

### 多级反馈队列 MFQ

思想：

1.  **分级与特征**：设置多个优先级队列。**优先级越高，时间片越短**（等级越高，给你的时间越少）。
2.  **降级机制**：新进程先入最高级队列。若在当前时间片内**未执行完，则降入下一级**队列末尾。
3.  **抢占规则**：始终优先执行高优先级队列。若有新进程进入高级队列，**立即抢占**当前正在执行的低级进程。

![alt text](image-27.png)

I/O型进程：让其进入最高优先级队列，以及时响应I/O交互。通常执行一个时间片，要求可处理完一次I/O请求的数据，然后转入到阻塞队列。
计算型进程：每次都执行完时间片，进入更低级队列。最终采用最大时间片来执行，减少调度次数。
为适应一个进程在不同时间段的运行特点，I/O完成时，提高优先级；时间片用完时，降低优先级；

特点：
- 兼顾响应性与吞吐；
- 可以在不了解任务时长时自适应区分任务类型；
- 是 RR + 优先级 + 动态调整的综合。

### 彩票调度与 Stride 调度

彩票调度（Lottery Scheduling）：
- 通过“彩票张数”按概率分配 CPU；
- 长期看资源份额接近权重比例，短期有随机波动。

Stride 调度：
- 彩票调度的确定性近似；
- $stride = MaxStride / ticket$ （步长，任务一次执行增加的虚拟时间）；
- 每次选 pass （累计执行的虚拟时间）最小者运行，并更新 pass。

特点：
- 更容易做按权重公平共享；
- 相比随机抽签，短期公平性更稳定。

### Linux CFS（Complete Fair Scheduler）

核心思想：
- 模拟“理想公平 CPU”，让每个任务按权重公平推进。

关键量：
- $vruntime = 运行时间 / 权重$
- 每次选择 vruntime 最小的实体运行（优先补偿“落后者”）。

实现要点：
- CFS 运行队列常用红黑树按 vruntime 排序；
- 最左节点（最小 vruntime）优先调度。

## 实时系统调度

### 实时系统与任务模型

实时系统强调“按时正确”：迟到结果可能比错误更糟。

分类：
- 硬实时：必须满足截止时间；
- 软实时：允许小比例超时。

周期任务集常见表示：
- 任务 $\tau_i$ 周期 $T_i$，执行时间 $C_i$，截止期 $D_i$（通常 $D_i=T_i$）。

CPU 利用率：
- $U=\sum_{i=1}^{n}\frac{C_i}{T_i}$

### 静态表调度

离线分析并生成固定调度表，运行时按表执行。

特点：
- 运行开销小；
- 灵活性差，只适用于完全固定的任务场景。

### 单调速率调度 RMS

RMS（Rate Monotonic Scheduling）是单处理器下的最优**静态**调度算法

规则：
- 周期越短（频率越高）优先级越高；
- 固定优先级、**可抢占**。

![alt text](image-28.png)

特点：
- 经典静态优先级实时调度算法；
- 易分析、易实现；
- 利用率较高时可能不可调度。

### 最早截止时间优先算法 EDF

EDF（Earliest Deadline First）是单处理器下全局最优调度算法

规则：
- 谁的绝对截止时间最近，谁优先。

特点：
- 动态优先级；
- 单处理机下可达到更高可调度性（理论上当 $U<=1$ 时可调度）。

> 实时系统核心不是“平均快”，而是“最坏情况可保证”。

## 多处理机调度

### 与单处理机调度的差异

多处理机更关注：
- 系统整体吞吐与负载均衡；
- 调度数据结构并发访问的互斥开销；
- 线程通常是更常见的调度单位。

### AMP 与 SMP

AMP（非对称多处理）：
- 主从结构，主处理机负责调度与管理。
- 各个处理机有固定分工，如一个处理机执行 OS 的系统功能，另一个处理 I/O。

SMP（对称多处理）：
- 处理机地位对等，常见三类策略：
- 静态分配：任务绑定某 CPU，迁移少但可能失衡；
- 动态分配：公共队列，空闲 CPU 取任务；
- 自调度：各 CPU 自行从共享队列取任务（常用，但锁竞争可能成瓶颈）。

### 成组调度与专用处理机分配

成组调度（Gang Scheduling）：
- 将同一并行任务的多个线程成组同时调度。
- 适合线程间强协作，减少同步等待。

专用处理机分配（Dedicated Processor Assignment）：
- 为某些关键并行任务保留处理机资源。
- 有利于稳定性能与通信局部性，但资源弹性较差。

### 机制与策略分离

思路：
- 内核提供通用调度机制；
- 上层通过参数/权重/优先级接口表达策略。

意义：
- 让“最了解业务目标”的应用参与调度意图表达；
- 在公平、吞吐、响应等目标间更灵活折中。

# 进程同步

## 同步与互斥问题

间接相互制约，主要原因是资源共享。
直接相互制约，主要源于进程合作。

进程同步：指多个相关进程在执行次序上的协调，用于保证这种关系的相应机制称为同步机制。
数据竞争：多个进程同时访问同一个共享变量，并且至少有一个是写。

![alt text](image-14.png)

### 临界区

一次只允许一个进程使用的资源称为临界资源。例如打印机、共享变量。
对临界资源（如共享变量）进行访问的程序片段称为临界区

#### 临界区解决方案需要满足的条件

任何两个进程都不能同时进入临界区；
• 基本要求
不能事先假定CPU的个数和运行速度；
• 对并发硬件无限制
临界区外的进程不能妨碍其他的进程进入临界区；
• 对临界区的互斥访问仅仅发生在临界区内
一个进程不能在临界区外无限等待
• 公平

![alt text](image-15.png)

#### 同步机制应遵循的准则

空闲让进：临界资源处于空闲状态，允许进程进入临界区；临界区内仅有一个进程执行

忙则等待：有进程正在执行临界区代码，所有其他进程则不可以进入临界区

有限等待：对要求访问临界区的进程，应在保证在有限时间内进入自己的临界区，避免无限等。

让权等待：当进程（长时间）不能进入自己的临界区时，应立即释放处理机，尽量避免忙等耗费CPU资源。

![alt text](image-16.png)

## 基于忙等待的互斥方法

### 简单尝试

#### 屏蔽中断

进入临界区关闭中断，离开临界区打开中断
临界区中可以独自访问共享变量
时钟中断和各种外设的中断会关闭
抢占式调度无法工作，当前进程可能独占CPU 
*进程可以通过阻塞的系统调用或者yield放弃CPU*

#### 共享锁变量

锁变量：设置共享变量lock
锁：0表示临界区无进程，1表示临界区有进程
锁变量初始值0
进程要进入临界区，测试（read）这把锁，如果锁的值为0，进程就将其设置(write)为1，并进入临界区
如果锁已经为1，则需要等待其变为0

问题：如何保证锁变量访问自身的原子性？（读取和设置必须是原子操作）

#### 严格轮换法-翻牌子

设立一个公用整型变量 turn：描述允许进入临界区的进程标识
- 在进入临界区循环检查是否允许本进程进入：turn为0时，进程0可进入；turn为1时，进程1可进入；
- 在退出区修改允许进入进程标识：进程0退出时，改turn为1；进程1退出时，改turn为0

问题
- 强制轮流进入临界区，没有考虑进程的实际需要。效率较低
- 违反规则：一个进程可能被一个不在临界区的进程阻止进入临界区

#### Peterson算法

```c
#define FALSE 0
#define TRUE  1
#define N     2    /* 进程的数量 */

int turn;          /* 轮到谁了？ */
int interested[N]; /* 所有初始值均为 0 (FALSE) */

void enter_region(int process); /* 进程为 0 或 1 */
{
    int other; /* 另一个进程的编号 */

    other = 1 - process;          /* 当前进程的对立进程 */
    interested[process] = TRUE;   /* 表示当前进程想要进入临界区 */
    turn = process;               /* 设置标志位 */
    while (turn == process && interested[other] == TRUE) /* 空语句 */ ;
}

void leave_region(int process) /* 参数 process: 哪个进程正在离开 */
{
    interested[process] = FALSE; /* 表示离开临界区 */
}
```

> Peterson算法在抢占式和非抢占式调度下都可行么？
> 抢占式OK.非抢占式No:可能先运行进程霸占CPU。

![alt text](image-17.png)

#### 硬件指令机制

Test and Set Lock指令
- IBM370系列机器中称为**TSL**；在INTEL8086中称为**XCHG**指令。
- TSL：将lock变量读入寄存器，然后置位1
- 测试（读）并加锁（写）：**保证读写是一个原子操作**
- 实现：执行TSL指令的CPU会通过锁住内存总线，禁止其他CPU访问内存

#### 问题--优先级反转

Peterson，TSL XCHG算法的问题：
如果不能满足进入临界区条件，都要进行**忙等**
忙等，不仅仅浪费CPU时间还会导致**优先级反转**

低优先级任务先拿到了锁（进入临界区）
高优先级任务想要这把锁，被阻塞 / 忙等
调度器会抢占低优先级任务的 CPU，让高优先级任务运行
→ 结果：低优先级任务没法释放锁，高优先级任务一直等，被 “反转” 成了实际的低优先级。

### 生产者－消费者问题

若干进程通过有限的**共享缓冲区**交换数据。其中，“生产者”进程不断写入，而“消费者”进程不断读出；共享缓冲区共有N个；任何时刻只能有一个进程可对共享缓冲区进行操作。

简单的（但有问题的）实现：
- 当缓冲区满，让生产者睡眠，等待消费者取出数据再唤醒生产者
- 当缓冲区空，让消费者睡眠，等待生产者放入数据再唤醒消费者
- 使用count变量来追踪缓冲区满或者空的状态

## 基于信号量的方法

### 信号量机制

新的变量类型Semaphore（信号量）
`S >= 0` 表示当前可用的资源的数目
对信号量P(S)&V(S)操作原语。
P: down/wait/获取资源 V：up/signal/释放资源
S的初值
- `S=1` 实现互斥：二元信号量(等于mutex)
- `S>1` 实现同步：通用信号量

信号量使用：
必须置一次且只能置一次初值（代表资源的个数）
只能由P、V操作来改变
P/V操作是原语：原子操作不会被打断

#### 物理意义

P（down）操作分配资源：检查信号量初值是否大于0，如果大于0，减1，继续执行；如果等于0，进程被直接阻塞（将当前进程从运行队列移动到信号量的队列），减1的操作暂时不做。
- P是原子操作：一组操作，要么都执行，要么都不执行
- 当S=1，A和B同时调用P(S), 只有一个进程能够完成P(S)继续执行

当进程执行P操作阻塞到某个信号量，进程不在运行态，所以在唤醒前都不会占用CPU资源

V（up）操作释放资源：首先将信号量S增加1 (原子操作)。但是如果有一个或者多个进程在信号量的队列睡眠（这时S=1），就会随机唤醒一个进程（将进程从信号量的队列移入就绪队列），并使得其运行后能完成P操作的减1，所以最终S还是0。
- V(S)原子操作
- 实现时，操作前关闭中断，操作后打开中断。
- 注意 V(S) != S=S+1
- 如果S=6，进程A，B任意顺序调用V(S), 那么结果**一定**是8

![alt text](image-18.png)

#### 实现

数据结构：一个整数+一个队列

对于单CPU系统；
- 系统在关闭中断的情况下，测试信号量，更新信号量，将进程睡眠或者唤醒。

对于多CPU系统：
- 需要有一个锁变量来保护信号量，并使用TSL指令或者XCHG指令来访问锁变量，从而保证每次只能有一个CPU检查信号量

#### 信号量机制解决生产者消费者问题

```c
#define N 100                  /* number of slots in the buffer */
typedef int semaphore;         /* semaphores are a special kind of int */
semaphore mutex = 1;           /* controls access to critical region */
semaphore empty = N;           /* counts empty buffer slots */
semaphore full = 0;            /* counts full buffer slots */

void producer(void)
{
    int item;

    while (TRUE) {             /* TRUE is the constant 1 */
        item = produce_item(); /* generate something to put in buffer */
        down(&empty);          /* decrement empty count */
        down(&mutex);          /* enter critical region */
        insert_item(item);     /* put new item in buffer */
        up(&mutex);            /* leave critical region */
        up(&full);             /* increment count of full slots */
    }
}

void consumer(void)
{
    int item;

    while (TRUE) {             /* infinite loop */
        down(&full);           /* decrement full count */
        down(&mutex);          /* enter critical region */
        item = remove_item();  /* take item from buffer */
        up(&mutex);            /* leave critical region */
        up(&empty);            /* increment count of empty slots */
        consume_item(item);    /* do something with the item */
    }
}
```

注意不能将down(&mutex)放在down(&empty)之前，否则可能会导致死锁：如果缓冲区是满的，生产者先将mutex设置为0，然后会阻塞在empty。这时消费者访问缓冲区，会对mutex执行P操作，就会阻塞在mutex。

### 信号量用法

#### 信号量用于互斥

![alt text](image-11.png)

初值S=1,等价于锁

#### 信号量同步

![alt text](image-12.png)

初值S=0; 代码B $\rightarrow$ 代码A

#### 信号量实现汇合

使用信号量实现线程A和线程B的汇合(Rendezvous)。使得a1永远在b2之前，而b1永远在a2之前。

![alt text](image-13.png)

#### 使用信号量实现多路复用

实现mutex的泛化，使得n个线程能够同时运行在临界区，有时候也称为限流阀。

```c
Semaphore multiplex = n
    P(multiplex)
    critical section
    V(multiplex)
```

#### 使用信号量实现屏障

用信号量实现n个线程的屏障（Barrier）。使得所有线程都到达某个点之后才能继续执行。

```c
n = the number of threads
count = 0 //到达汇合点的线程数
semaphore mutex = 1 //保护count
semaphore barrier = 0//线程到达之前都是0或者负值。到达后取正值

P(mutex)
count = count + 1
V(mutex)

if count == n: V(barrier) # 第n个进程到来，唤醒一个线程，触发
P(barrier) # 前n-1个进程在此排队
V(barrier) # 一旦线程被唤醒，有责任唤醒下一个线程
```

### “信号量集”机制

```c
Process A:
  P(Dmutex);
  P(Emutex);
Process B:
  P(Emutex);
  P(Dmutex);
Dmutex, Emutex = 1;
Process A: P(Dmutex);
Process B: P(Emutex);
Process A: P(Emutex);
Process B: P(Dmutex);
```

需要同时获取两个或多个临界资源时，就可能出现由于各进程分别获得部分临界资源并等待其余的临界资源的**死锁**局面

#### AND型信号量集机制

将进程需要的所有共享资源一次全部分配给它；待该进程使用完后再一起释放。

#### 一般“信号量集”机制

基本思想：在AND型信号量集的基础上进行扩充：进程对信号量Si的测试值为ti（用于信号量的判断，即Si >= ti，表示资源数量低于ti时，便不予分配），资源的申请量为di（用于信号量的增减，即Si = Si - di和Si = Si +di）

```pascal
SP(S1, t1, d1, … , Sn, tn, dn)
  if S1>=t1 and … and Sn>=tn then
    for I :=1 to n do
      Si := Si - di;
    endfor
  else
    wait in Si;
  endif

SV(S1, d1, … ,Sn, dn)
  for I :=1 to n do
    Si := Si + di;
    wake waited process
  endfor
```

![alt text](image-22.png)

### 互斥量 (Mutex)

### 条件变量 (Condition Variable)

## 基于管程的同步与互斥

管程：把分散的临界区集中起来，为每个临界资源设计一个专门机构来统一管理各进程对该资源的访问，这个专门机构称为管程。
管程可以函数库的形式实现。相比之下，管程比信号量易于使用。
管程是一种**高级同步原语**。

### 管程的实现

对于共享资源，管程需要提供互斥的访问和同步的机制
管程的机制保证**只有一个进程在管程内执行**(互斥)
同步机制使用
- wait和signal，两个同步变量

```pascal
monitor ProducerConsumer
    condition full, empty;
    integer count;

    procedure insert(item: integer);
    begin
        if count = N then wait(full);
        insert_item(item);
        count := count + 1;
        if count = 1 then signal(empty)
    end;

    function remove: integer;
    begin
        if count = 0 then wait(empty);
        remove := remove_item;
        count := count - 1;
        if count = N - 1 then signal(full)
    end;

    count := 0;
end monitor;

procedure producer;
begin
    while true do
    begin
        item = produce_item;
        ProducerConsumer.insert(item)
    end
end;

procedure consumer;
begin
    while true do
    begin
        item = ProducerConsumer.remove;
        consume_item(item)
    end
end;
```

### Java中的管程实现

```java
public class ProducerConsumer {
    static final int N = 100; // constant giving the buffer size
    static producer p = new producer(); // instantiate a new producer thread
    static consumer c = new consumer(); // instantiate a new consumer thread
    static our_monitor mon = new our_monitor(); // instantiate a new monitor

    public static void main(String args[]) {
        p.start(); // start the producer thread
        c.start(); // start the consumer thread
    }

    static class producer extends Thread {
        public void run() { // run method contains the thread code
            int item;
            while (true) { // producer loop
                item = produce_item();
                mon.insert(item);
            }
        }
        private int produce_item() { ... } // actually produce
    }

    static class consumer extends Thread {
        public void run() {
            int item;
            while (true) {
                item = mon.remove();
                consume_item(item);
            }
        }
        private void consume_item(int item) { ... } // actually consume
    }

    static class our_monitor { // this is a monitor
        private int buffer[] = new int[N];
        private int count = 0, lo = 0, hi = 0; // counters and indices

        public synchronized void insert(int val) {
            if (count == N) go_to_sleep(); // if the buffer is full, go to sleep
            buffer[hi] = val; // insert an item into the buffer
            hi = (hi + 1) % N; // slot to place next item in
            count = count + 1; // one more item in the buffer now
            if (count == 1) notify(); // if consumer was sleeping, wake it up
        }

        public synchronized int remove() {
            int val;
            if (count == 0) go_to_sleep(); // if the buffer is empty, go to sleep
            val = buffer[lo]; // fetch an item from the buffer
            lo = (lo + 1) % N; // slot to fetch next item from
            count = count - 1; // one few items in the buffer
            if (count == N - 1) notify(); // if producer was sleeping, wake it up
            return val;
        }

        private void go_to_sleep() {
            try {
                wait();
            } catch (InterruptedException exc) {}
        }
    }
}
```

### 管程优缺点

依赖于编译器支持，和特定语言相关
不适用于分布式系统，仅仅适用于单核或者多核的**共享内存**系统

> 原因：管程把共享数据 + 互斥访问 + 条件同步封装，依赖**共享内存、原子操作、即时调度**（同步阻塞/唤醒）
> 而分布式系统没有共享内存

![alt text](image-19.png)

## 进程通信的主要方法（IPC）

低级通信：只能传递状态和整数值（控制信息），包括进程互斥和同步所采用的**信号量**和**管程**机制。缺点：
- 传送信息量小：效率低，每次通信传递的信息量固定，若传递较多信息则需要进行多次通信。
- 编程复杂：用户直接实现通信的细节，编程复杂，容易出错。

高级通信：能够传送任意数量的数据，包括三类：**管道、共享内存、消息系统**等。

![alt text](image-20.png)

### 管道通信(Pipe)

管道是用于连接读进程和写进程以实现两个进程通信的**共享文件**，又称管道文件。
Unix系统中，管道分为有名管道和无名管道。
- 无名管道：`sort < file1 |grep sth_to_search`
- 有名管道：`mkfifo()`函数创建

#### 无名管道 (Pipe)

实例：杀死一个叫conky的进程

```
ps aux | grep conky| grep -v grep | awk '{print $2}' | xargs kill
```

管道是半双工的，**数据只能向一个方向流动**；需要双方通信时，需要建立起两个管道；

无名管道**只能用于父子进程或者兄弟进程之间**（具有亲缘关系的进程）；

单独构成一种独立的文件系统：管道对于管道两端的进程而言，就是一个文件，但它不是普通的文件，它不属于某种文件系统，而是自立门户，单独构成一种文件系统，并且**只存在在内存中**。

数据的读出和写入：一个进程向管道中写的内容被管道另一端的进程读出。写入的内容每次都添加在管道缓冲区的末尾，并且每次都是从缓冲区的头部读出数据。

#### 有名管道（Named Pipe或FIFO）

无名管道应用的一个重大限制是它没有名字，因此，只能用于具有亲缘关系的进程间通信，在有名管道提出后，该限制得到了克服。

FIFO不同于管道之处在于它提供一个路径名与之关联，以FIFO的文件形式存在于文件系统中。这样，即使与FIFO的创建进程不存在亲缘关系的进程，**只要可以访问该路径**，就能够彼此通过FIFO相互通信。

需注意的是，FIFO严格遵循**先进先出**（first in first out），对管道及FIFO的读总是从开始处返回数据，对它们的写则把数据添加到末尾。

![alt text](image-21.png)

### 消息传递（message passing）

略

## 经典的进程同步与互斥问题

### 读者-写者

#### 基于信号量机制

```c
int readers = 0
Semaphore mutex = 1
Semaphore roomEmpty = 1 

Writer
P(roomEmpty);
    write  
//critical region
V(roomEmpty);

Reader
P(mutex);
   readers=readers+1;
   if readers == 1 : //第一个读者
      P(roomEmpty)
V(mutex);
read //critical region
P(mutex);
   readers = readers-1;
   if readers == 0:
      V(roomEmpty);
V(mutex);
```

#### 灯开关模式

```python
class Lightswitch: 
    def __init__(self): 
        self.counter = 0 
        self.mutex = Semaphore(1) 
    def lock(self, semaphore): 
        self.mutex.wait() 
        self.counter += 1 
        if self.counter == 1: 
            semaphore.wait() 
        self.mutex.signal() 
    def unlock(self, semaphore): 
        self.mutex.wait() 
        self.counter -= 1 
        if self.counter == 0: 
            semaphore.signal() 
        self.mutex.signal() 
```

```c
信号量初始化
readLightswitch = Lightswitch() 
roomEmpty = Semaphore(1) 

Reader
readLightswitch.lock(roomEmpty)
    read # critical section 
readLightswitch.unlock(roomEmpty) 

Writer 代码不变
roomEmpty.wait();
    write  //critical region
roomEmpty.signal();
```

#### 一般信号量集机制

增加一个限制条件：同时读的“读者”最多RN个
mx表示“允许写”，初值是1
L表示“允许读者数目”，初值为RN

```c
Writer
SP(mx, 1, 1; L, RN, 0);
    write
SV(mx, 1);

Reader
SP(mx, 1, 0 ; L, 1, 1);
    read
SV(L, 1);
```

#### 公平读写算法

```c
int readers = 0
Semaphore mutex = 1
Semaphore roomEmpty =1
Semaphore turnstile = 1

Writer
P(turnstile);
P(roomEmpty);
    write  //critical region
V(turnstile);
V(roomEmpty);

Reader
P(turnstile)
V(turnstile)
P(mutex);
    readers=readers+1;
    if readers == 1 : //第一个读者
        P(roomEmpty)
V(mutex);
read //critical region
P(mutex);
    readers = readers-1;
    if readers == 0:
        V(roomEmpty);
V(mutex);
```

### 理发师问题

```c
#define CHAIRS 5   //chairs for waiting customers 
typedef int semaphore; 
semaphore customers = 0; //# of customers waiting service semaphore barbers = 0;  //# of barbers waiting customers semaphore mutex = 1;  //for mutual exclusion of waiting
int waiting = 0;  //customer are waiting (not being cut)

void barber(void) { 
    while (TRUE) { 
        down(&customers); /* go to sleep if # of customers is 0 */              
        down(&mutex); /* acquire access to "waiting' */ 
        waiting = waiting - 1; /* decrement count of waiting customers */                    	
        up(&mutex); /* release 'waiting' */ 
        up(&barbers); /* one barber is now ready to cut hair */   		
        cut_hair(); /* cut hair (outside critical region */ 
   	}
 }

void customer(void) { 
    down(&mutex); /* enter critical region */ 
    if (waiting < CHAIRS) { 
    /* if there is free chair, wait */ 
        waiting = waiting + 1; /* increment count of waiting customers */     
	    up(&mutex); /* release access to 'waiting' */ 
	    up(&customers); /* wake up barber if necessary */ 
	    down(&barbers); /* go to sleep if # of free barbers is 0 */ 
	    get_haircut(); /* be seated and be served */ 
    } 
    else { 
        up(&mutex); /* shop is full; do not wait */ 
    } 
}
```

### 柜员-顾客

#### 代码1：基于信号量同步

```c
int cstmr_cnt = 0; //下一个要服务的客户
Semaphore s_mutex=1;//服务器进程互斥访问cstmr_cnt
Semaphore next_cstmr = 0; //客户服务器进程同步

process customer i
Begin
    v(next_cstmr);
end

process servers i(i=1,...,n)
begin
    while(true){
        p(s_mutex);
        p(next_cstmr);
        cstmr_cnt ++;
        v(s_mutex);
        为持有next_cstmr的客户服务;
    }
end
```

这里servers进程里有 `p(next_cstmr)`，是等待customer来唤醒它

#### 代码2：基于忙等同步

```c
int cstmr_id = 0;  //当前客户编号
semaphore mutex=1; //对cstmr_id互斥访问
int next_cstmr = 0; //下一个要服务客户编号
semaphore s_mutex=1; //服务器进程互斥访next_cstmr

process customer i
Begin
    p(mutex);
        cstmr_id ++;
    v(mutex);
end

process servers i(i=1,...,n)
begin
    while(true){
        p(s_mutex);
        p(mutex);
        if(next_cstmr < cstmr_id)
            next_cstmr ++;
        v(mutex)
        v(s_mutex);
        为next_cstmr号码持有者服务;
    }
end
```

这里servers进程是一直循环检查条件是否成立

| 特性     | 信号量同步（阻塞等待）         | 忙等同步（自旋等待）                     |
| :------- | :----------------------------- | :--------------------------------------- |
| 等待方式 | P操作让进程阻塞，主动放弃 CPU  | 循环检查条件，一直占用 CPU               |
| CPU 消耗 | 低，等待时不占用 CPU           | 高，等待时一直空转消耗 CPU               |
| 适用场景 | 等待时间不确定、可能较长的场景 | 等待**时间很短**、上下文切换成本高的场景 |
| 同步核心 | 依赖信号量的P/V原语唤醒        | 依赖循环检查状态，无主动唤醒             |

### 构建水分子(H2O)问题

```c
oxygen = 0      // 氧原子计数器：记录当前有多少个氧线程准备就绪
hydrogen = 0    // 氢原子计数器：记录当前有多少个氢线程准备就绪
Semaphore mutex = 1  // 互斥锁：保护oxygen、hydrogen计数器，避免多线程同时修改
Barrier barrier(3)   // 屏障：必须等3个线程（1O+2H）都到达这里，才会一起放行
Semaphore oxyQueue = 0   // 氧线程的等待队列：氧原子不够条件时，在这里阻塞等待
Semaphore hydroQueue = 0 // 氢线程的等待队列：氢原子不够条件时，在这里阻塞等待

// 氧气线程

P(mutex)              // 加锁，保护计数器
oxygen += 1           // 氧原子就绪数+1

if hydrogen >= 2:     // 如果当前已经凑齐了≥2个氢原子
    V(hydroQueue)     // 唤醒1个等待的氢线程（发信号：可以来生成水了）
    V(hydroQueue)     // 再唤醒第2个等待的氢线程
    hydrogen -= 2     // 消耗掉2个氢原子名额
    V(oxyQueue)       // 唤醒自己（氧线程），让自己也能继续执行
    oxygen -= 1       // 消耗掉1个氧原子名额
else:                 // 氢原子还不够2个
    V(mutex)          // 先释放锁，让其他线程可以修改计数器

P(oxyQueue)           // 氧线程在这里阻塞，等待被唤醒
bond()                // 模拟“生成水分子”的动作
barrier.wait()        // 等3个线程（1O+2H）都到齐，再一起放行
V(mutex)              // 最后释放锁

// 氢气线程

P(mutex)              // 加锁，保护计数器
hydrogen += 1         // 氢原子就绪数+1

if hydrogen >= 2 and oxygen >= 1:  // 同时满足：氢≥2 且 氧≥1
    V(hydroQueue)     // 唤醒1个等待的氢线程
    V(hydroQueue)     // 再唤醒第2个等待的氢线程（包括自己）
    hydrogen -= 2     // 消耗2个氢名额
    V(oxyQueue)       // 唤醒1个等待的氧线程
    oxygen -= 1       // 消耗1个氧名额
else:                 // 条件不满足，凑不齐1O+2H
    V(mutex)          // 先释放锁，让其他线程可以修改计数器

P(hydroQueue)         // 氢线程在这里阻塞，等待被唤醒
bond()                // 模拟“生成水分子”的动作
barrier.wait()        // 等3个线程（1O+2H）都到齐，再一起放行
```

# 死锁

## 死锁的概念

### 死锁定义

死锁（Deadlock）：
如果一个进程集合中的每个进程都在等待只能由该进程集合中其他进程才能引发的事件，那么这个进程集合就是死锁的。

死锁的根本特征：
- 每个进程都在等待；
- 每个进程等待的条件，都依赖于同一组进程中的其他进程；
- 没有外力介入时，这种等待会一直持续下去。

#### 资源死锁：

如果每个进程等待的事件，都是**释放**该进程集合中其他进程所占有的**资源**，则称为资源死锁。

#### 通信死锁

例子：
- 进程 `A` 向进程 `B` 发送请求消息；
- `A` 发送后阻塞，等待 `B` 回复；
- 若该请求消息丢失，则 `A` 一直等回复；
- 而 `B` 根本没收到消息，也可能一直等新的请求；
- 于是形成通信死锁。

特点：
- 不一定涉及“占有资源不放”；
- 更难单纯靠调度避免；
- 常通过**超时与重传机制**避免。

### 死锁、饥饿、活锁

死锁不等于饥饿，也不等于活锁。

饥饿（Starvation）：
- 某个进程长期得不到所需资源或调度机会，因此一直无法推进。
- 例如读者优先的读者-写者问题中，写者可能长期得不到执行机会，这叫饥饿，不叫死锁。

活锁（Livelock）：
- 两个或多个线程不断改变状态、互相谦让，但谁都无法真正向前推进。
- 例如两个线程同时释放锁、同时重试、再次同时冲突，反复循环。
- 避免活锁的常见方法：引入随机退避时间（解锁之前，等待一个随机时间）。

### 死锁发生的原因

死锁通常由两类原因引起：
- 竞争资源；
- 并发执行顺序不当。

典型例子：

进程 `P1`
- 先申请文件 `F`
- 再申请打印机 `T`

进程 `P2`
- 先申请打印机 `T`
- 再申请文件 `F`

若 `P1` 已拿到 `F` 等待 `T`，同时 `P2` 已拿到 `T` 等待 `F`，就会形成死锁。

### 竞争资源引发死锁

#### 可剥夺资源与不可剥夺资源

可剥夺资源：
- 进程获得后，系统或其他进程可以强行夺走。
- 如 CPU、部分内存资源。

不可剥夺资源：
- 一旦分配给某进程，就不能强行收回，只能由进程用完后主动释放。
- 如打印机、刻录机。

#### 临时性资源

临时性资源也叫消耗性资源：
- 由一个进程产生，被另一个进程使用；
- 使用后很快失去意义。

例如：
- 消息；
- 中断；
- 通信数据包。

这类资源同样可能导致死锁。

例如三个进程：
- `P1` 等待 `P3` 的消息 `S3`，自己掌握 `S1`
- `P2` 等待 `P1` 的消息 `S1`，自己掌握 `S2`
- `P3` 等待 `P2` 的消息 `S2`，自己掌握 `S3`

若大家都先请求、后释放，就可能形成环路等待并发生死锁。

#### 资源死锁的必要条件

1. 互斥条件：指进程对所分配到的资源进行排它性使用，即在**一段时间内某资源只能有一个进程占用**。
2. 保持和请求条件：已经获得资源的线程可以请求新的资源
3. 不剥夺条件：指进程已获得的资源，在未使用完之前不能被强制剥夺，只能在使用完时由自己释放。
4. 环路等待条件：指在发生死锁时，必然存在两个或多个进程组成的环形链，每个进程都在等待环形链中下一个节点占用的资源。

## 处理死锁的基本方法

处理死锁的思路主要有四类：
- 鸵鸟算法：忽略死锁；
- 死锁检测与恢复：允许发生，再检测并解除；
- 死锁预防：破坏死锁的四个必要条件之一；
- 死锁避免：动态判断分配后是否仍安全，只在安全时分配。

> 越早对死锁下手，通常对系统性能影响越大。
> 像 Unix 这类重视性能的系统，通常不采用代价较高的预防/避免，而更倾向于检测与恢复。

### 鸵鸟算法

鸵鸟算法：
- 无视死锁的存在，假设它很少发生；
- 一旦发生，由人工重启、杀进程等方式处理。

适用场景：
- 死锁发生概率低；
- 死锁影响范围小；
- 系统更看重性能和实现简单性。

## 死锁检测与恢复

### 死锁检测

死锁检测的核心思想：
- 根据资源请求和资源分配信息，判断系统中是否存在循环等待。

常见方法：
- 资源分配图法；
- 资源向量/矩阵法。

#### 资源分配图

资源分配图（Resource Allocation Graph, RAG）中：
- 圆形结点表示进程；
- 方形结点表示资源；
- 资源 `->` 进程：资源已分配给该进程；
- 进程 `->` 资源：该进程正在请求该资源。

![alt text](image-29.png)

##### 每个资源只有一个实例

若每类资源都只有一个实例，则：
- 图中**有环**，当且仅当系统中**发生死锁**。

因此可以：
- 按请求/释放资源的过程更新图；
- 每次更新后检查图中是否存在环。

##### 多实例资源的资源分配图化简

当每类资源有多个实例时，仅仅“有环”不再是死锁的充要条件，需要看图能否化简。

封锁进程：请求量超过当前可用资源数，暂时无法满足的进程。

非封锁进程：其请求量不超过当前可用资源数的进程。

化简思想：
- 寻找一个非封锁进程 `Pi`；
- 先假设系统将其请求满足（请求边变成分配边）；
- `Pi` 在有限时间内执行结束并释放全部资源；
- 删除 `Pi` 的请求边和分配边；
- 重复以上过程。

死锁定理：
- 某时刻系统处于死锁状态，当且仅当此时资源分配图**不可完全化简**。

#### 资源向量（矩阵）算法

适用于每类资源有多个实例的情况。

定义：

- `E`：存在资源向量（Existing），表示各类资源总量；
- `A`：可用资源向量（Available），表示当前未分配资源数；
- `C`：当前分配矩阵（Current Allocation），第 `i` 行表示进程 `Pi` 已占有的各类资源数；
- `R`：请求矩阵（Request），第 `i` 行表示进程 `Pi` 仍请求的各类资源数。

检测算法思想：

1. 寻找某个进程 `Pi`，满足 `R_i <= A`
2. 若找到，则认为 `Pi` 可完成，把 `C_i` 归还给系统：
   `A = A + C_i`
3. 标记 `Pi` 完成，继续寻找下一进程
4. 若再也找不到满足条件的进程，则算法结束
5. 若仍有未标记进程，则这些进程就是死锁进程

本质：
- 反复寻找“还能完成”的进程；
- 若最终有人永远无法被满足，则系统存在死锁。

### 死锁恢复

检测到死锁后，可以采用以下方法恢复：

#### 资源抢占法

- 挂起一些占有资源的进程；
- 强行剥夺其资源；
- 把资源分配给其他死锁进程，使其先完成；
- 再恢复被挂起的进程。

问题：
- 资源未必适合抢占；
- 实现复杂；
- 可能带来一致性问题。

#### 杀死进程法

- 杀死一个或多个进程，释放其资源；
- 打破死锁环。

选择策略可以考虑：
- 优先杀死代价小的进程；
- 优先杀死可重启、无副作用的进程。

例如：
- 编译进程：通常可以杀死重来；
- 数据库事务进程：可能有副作用，要谨慎；
- 打印进程：可能造成输出混乱。

#### 回滚法

思想：
- 系统定期设置检查点（checkpoint）；
- 检测到死锁后，把某个进程回滚到“尚未占用关键资源”的状态；
- 释放其资源，让其他进程推进。

特点：
- 常见于事务系统和容错系统；
- 需要额外的检查点**存储开销**；
- 本质上也常用于故障恢复。

## 死锁预防

死锁预防：
- 通过破坏四个必要条件之一，使死锁不可能发生。

### 1. 打破互斥条件

思路：
让某些资源变成可共享资源。

局限：
很多资源天然是互斥的，如打印机、独占设备。

典型做法：
使用**假脱机技术（Spooling）**，把独占设备改造成逻辑上的共享设备。

### 2. 打破保持和请求条件

常见策略：
- 进程开始执行前，一次性申请所需全部资源；
- 若申请不到全部资源，则一个也不分配。

或：
- 进程申请新资源前，先释放当前已占有资源，再重新申请全部需要的资源。

优点：
- 不会出现“拿着一部分资源再等另一部分资源”的情况。

缺点：
- 很多程序事先并不知道完整资源需求（因为在许多情况下，进程在执行时是动态的，不可预测的）；
- 资源利用率低；
- 降低并发度。

### 3. 打破不可抢占条件

思路：
允许系统在必要时强行剥夺资源。

问题：
- 对很多独占设备不现实；
- 可能导致执行结果异常。

例如：
- 正在打印时抢占打印机，输出可能直接损坏。

### 4. 打破循环等待条件

最经典的方法：**资源有序分配法**

做法：
- 对系统中的所有资源统一编号；
- 规定所有进程必须按编号递增顺序申请资源。

这样做的效果：
- 不可能形成环形等待链；
- 因而可以预防死锁。

例子：
- `PA` 需要按顺序使用 `R1 -> R2`
- `PB` 原本想按 `R2 -> R1` 使用
- 若强制资源编号顺序申请，则 `PB` 也必须按 `R1 -> R2` 申请
- 环路等待被破坏

缺点：
- 资源编号本身不容易设计；
- 限制进程申请资源的灵活性；
- 可能导致某些暂时不用的资源也要提前申请，增加占用时间。

### 哲学家进餐问题

#### 问题描述

5 个哲学家围坐在圆桌旁，桌上有 5 支筷子。

规则：
- 每个哲学家需要同时拿到左、右两支筷子才能吃饭；
- 吃完后放下筷子，继续思考。

抽象代码：

```python
while True:
    think()
    get_forks()
    eat()
    put_forks()
```

它是死锁问题的经典模型。

#### 直接做法为何会死锁

若每个哲学家都先拿右边筷子，再拿左边筷子：

```python
def get_forks(i):
    fork[right(i)].wait()
    fork[left(i)].wait()
```

那么可能出现：
- 5 个哲学家同时各拿起一支右边的筷子；
- 然后都等待左边那支；
- 形成循环等待，发生死锁。

#### 常见解法

##### 方法1：最多只允许 4 个哲学家同时尝试拿筷子

增加信号量 `diners = 4`：

```python
diners = Semaphore(4)

def get_forks(i):
    diners.wait()
    fork[right(i)].wait()
    fork[left(i)].wait()

def put_forks(i):
    fork[right(i)].signal()
    fork[left(i)].signal()
    diners.signal()
```

作用：
- 保证至少有一个哲学家最终能拿到两支筷子；
- 破坏了**循环等待**条件。

##### 方法2：改变拿筷子顺序

例如：
- 奇数号哲学家先拿左边，再拿右边；
- 偶数号哲学家先拿右边，再拿左边。

效果：破坏**循环等待**条件。

##### 方法3：按资源编号有序申请

给筷子编号，哲学家总是先拿编号小的，再拿编号大的。

本质：
- 资源有序分配法；
- 破坏**循环等待**条件。

##### 方法4：要么同时拿两支，要么一支也不拿

效果：破坏**保持和请求**条件。

Tanenbaum 算法

```python
state = [' thinking '] * 5
sem = [Semaphore(0) for i in range(5)]
mutex = Semaphore (1)

def get_fork(i):
    mutex.wait()
    state[i] = 'hungry'
    test(i)
    mutex.signal()
    sem[i].wait()

def put_fork(i):
    mutex.wait()
    state[i] = 'thinking'
    test(right(i))
    test(left(i))
    mutex.signal()

def test(i):
    if state[i] == 'hungry' and \
       state[left(i)] != 'eating' and \
       state[right(i)] != 'eating':
        state[i] = 'eating'
        sem[i].signal()
```

#### 注意

某些算法可以避免死锁，但仍可能产生饥饿。

也就是说：
- “不会卡死”不等于“每个人都公平地最终吃到饭”。

## 死锁避免

死锁避免：
- 不直接破坏死锁必要条件；
- 允许系统处于可能产生死锁的结构中；
- 但在每次资源分配前动态判断：分配后系统是否仍然安全；
- 只有在安全时才真正分配资源。

它比死锁预防更灵活，但实现代价更高。
假设(限制)：需要事先知道进程请求的所有资源

### 安全序列

安全序列：
- 系统中的所有进程能够按照某种顺序，依次获得所需资源、执行完毕并释放资源；
- 这样的进程序列称为安全序列。

若存在安全序列，则系统处于安全状态。

### 安全状态与不安全状态

安全状态：
- 当前没有死锁；
- 并且即使各进程都按其最大需求申请资源，系统仍然**存在某种调度顺序**，使所有进程都能完成。

不安全状态：
- 不存在这样的安全序列。

注意：
- 不安全状态**不一定**产生死锁（因为不一定按最大需求申请资源）；
- 但一旦死锁，系统一定处于不安全状态。

### 银行家算法

银行家算法（Banker's Algorithm）是最经典的死锁避免算法。

核心思想：
- 像银行发放贷款一样，系统在每次分配资源前都先判断：
- 若这次分配后还能保证“最终所有进程都能完成”，则批准；
- 否则拒绝本次分配，让进程等待。

#### 基本前提

银行家算法要求：
- 每个进程在**开始时就声明最大资源需求**；
- 已分配资源最终会释放；
- 系统能够跟踪各类资源的总量、已分配量和剩余量。

#### 关键数据结构

- `Available`：当前系统可用资源向量；
- `Max`：最大需求矩阵；
- `Allocation`：当前分配矩阵；
- `Need`：尚需资源矩阵。

其中：

`Need = Max - Allocation`

#### 资源请求算法

设 `Request_i` 为进程 `Pi` 的请求向量，系统按如下步骤处理：

1. 若 `Request_i <= Need_i`，继续；否则说明请求超过最大声明，出错。
2. 若 `Request_i <= Available`，继续；否则当前资源不足，`Pi` 等待。
3. 试探性分配：

```text
Available  = Available  - Request_i
Allocation = Allocation + Request_i
Need       = Need       - Request_i
```

4. 执行安全性算法：
- 若分配后系统仍安全，则正式分配；
- 否则撤销本次试探分配，让 `Pi` 等待。

#### 安全性算法

设置：
- `Work = Available`
- `Finish[i] = false`

循环执行：

1. 找到某个 `Pi`，满足：
   - `Finish[i] == false`
   - `Need_i <= Work`
2. 若找到，则假设 `Pi` 执行结束并释放资源：

```text
Work = Work + Allocation_i
Finish[i] = true
```

3. 重复寻找下一进程
4. 若最终所有 `Finish[i]` 都为 `true`，则系统安全；否则系统不安全

#### 银行家算法的特点

优点：
- 允许互斥、部分分配和不可剥夺存在；
- 比“死锁预防”更灵活，资源利用率更高。

缺点：
- 必须预先知道最大资源需求；
- 现实系统中很多程序很难准确给出最大需求；
- 算法本身有额外运行开销。

## 典型错误回顾

### Rendezvous 中的死锁写法

若两个线程都把 `signal` 放在 `wait` 之后，就可能彼此等待，导致死锁。

说明：
- 同步原语的顺序写错，也可能导致死锁；
- 这类问题本质上仍然是“等待环”。

### 生产者-消费者中的死锁写法

如果把生产者写成：

```c
P(mutex);
P(empty);
```

而不是先 `P(empty)` 再 `P(mutex)`，就可能导致死锁：
- 生产者先拿到 `mutex`；
- 再因缓冲区满而阻塞在 `empty`；
- 消费者想进入缓冲区又必须申请 `mutex`；
- 于是双方互相等待。

这说明：
- 对多个信号量/锁的申请顺序不当，是死锁的常见来源。
