---
title: BUAA OS 知识结构梳理
date: 2026-08-12 10:00:00
categories: [操作系统, 知识梳理]
tags: [操作系统]
description: BUAA OS 知识结构梳理。
---

```
env_create
    |-- env_alloc
    |       |-- asid_alloc
    |       |-- env_setup_vm
    |               |-- page_alloc
    |-- load_icode
            |-- elf_from
            |-- elf_load_seg
                    |-- load_icode_mapper
                                |-- page_alloc
                                |-- page_insert
env_run
    |-- env_pop_tf
            |-- RESET_KCLOCK
exc_gen_entry
      |-- exception_handlers
                  |-- handle_int
                  |-- handle_mod
                  |-- handle_tlb
                  |-- handle_sys
                  |-- handle_reserved
```
