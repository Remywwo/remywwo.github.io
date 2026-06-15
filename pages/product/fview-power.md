---
title: FView Power
description: 极简的跨平台桌面文件预览器，支持 Markdown 滚动同步、PDF 大纲、代码高亮、HTML 沙箱渲染，开源免费。
date: 2026-06-15
type: design
category: 桌面应用
image: /images/fview-power/first.png
---

[官网](https://remywwo.com/FView-Power/) ｜ [GitHub](https://github.com/Remywwo/FView-Power)

## 项目背景

在日常开发与文档阅读中，经常需要在不同工具间切换来预览各类文件。FView Power 旨在用一个极简的桌面应用解决 Markdown、PDF、代码、HTML、图片等多种格式的预览需求，让用户专注于内容本身。

## 核心特性

- **Markdown 滚动同步**：编辑器与预览实时联动，右侧浮动目录悬停跳转
- **HTML 沙箱预览**：本地 iframe 渲染，CSS/JS 完整保留，零网络请求
- **文件夹浏览**：左侧树形目录，自动跳过构建产物，拖拽即可打开
- **PDF 大纲导航**：支持跳页、方向键翻页、大纲面板实时高亮当前位置
- **拖拽打开**：文件或文件夹直接拖入窗口，自动识别类型并渲染
- **可定制排版**：字体、字号、行高、亮暗主题自由组合，配置本地保存

## 技术栈

Electron + Monaco Editor + PDF.js + marked.js，跨平台支持 macOS、Windows、Linux。

## 设计展示

<ProductGallery :images="[
  '/images/fview-power/iShot_2026-06-15_18.40.07.png',
  '/images/fview-power/iShot_2026-06-15_18.40.44.png',
  '/images/fview-power/iShot_2026-06-15_18.41.52.png',
  '/images/fview-power/iShot_2026-06-15_18.42.27.png',
  '/images/fview-power/iShot_2026-06-15_18.41.02.png',
  '/images/fview-power/iShot_2026-06-15_19.00.27.png'
]" alt="FView Power" />
