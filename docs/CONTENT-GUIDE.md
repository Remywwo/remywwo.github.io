# 内容 Frontmatter 规范

新建、整理、发布文章前先读这份。规则与代码实装一致，改代码时请同步改这里。

- 归属判定：`src/logics/index.ts` 的 `sectionOf` / `inSection`
- 列表入口：`src/components/ListPosts.vue:46`、`src/components/ProductWaterfall.vue:22`

---

## 一、一句话规则

> **`title` + `date` 必需；归属由 `type` 决定，没写 `type` 就看所在目录。**

---

## 二、文章归属怎么算

### 判定顺序

1. **frontmatter 里有 `type`** → 按 `type` 归入对应列表
2. **没有 `type`** → 按文件所在目录映射：
   - `pages/posts/` → `blog`
   - `pages/product/` → `design`
   - `pages/thinking/` → `thinking`
   - `pages/daily/` → `daily`

### 支持复合归属

```yaml
type: blog+thinking
```

一篇文章同时出现在博客列表和思考列表。

### 各列表认什么

| 页面        | 认的 section                   |
| ----------- | ------------------------------ |
| 首页 `/`    | `blog`                         |
| `/thinking` | `thinking`                     |
| `/product`  | `design`                       |
| `/daily`    | 日历组件，不是列表（见第六节） |

### 进入列表的硬条件

`ListPosts` 和 `ProductWaterfall` 都要求：

- **`date` 存在**
- **`draft` 不为 true**
- 路径不以 `.html` 结尾

没有 `date` 的文章不会出现在任何列表里。

---

## 三、必需字段

| 字段    | 缺失后果                                                                      |
| ------- | ----------------------------------------------------------------------------- |
| `title` | 整个文章头不渲染 —— 封面、标题、日期、阅读时长、AI 标签全部消失，页面只剩正文 |
| `date`  | 进不了任何列表，只能靠 URL 直达                                               |

---

## 四、各类文章模板

### 博客（`pages/posts/`）

```yaml
---
title: Koa 中间件执行顺序
date: 2026-11-27
type: blog
lang: zh
description: 一句话摘要，显示在列表卡片上
---

[[toc]]

# # 第一节

# # 第二节
```

- `[[toc]]` 是博客惯例（现有 20 篇都有），紧跟 frontmatter
- 正文从 `##` 开始 —— 标题已由 frontmatter 渲染为 h1

### 思考（`pages/thinking/`）

```yaml
---
title: 关于专注的一点想法
date: 2026-11-27
type: thinking
lang: zh
description: 摘要
---

[[toc]]

# # 正文
```

也可以放进 `pages/posts/` 写 `type: thinking` —— 归属看 `type`，不看目录。

### 作品集（`pages/product/`）

```yaml
---
title: FView Power
description: 极简的跨平台桌面文件预览器
date: 2026-11-27
type: design
category: 桌面应用
image: /images/fview-power/first.png
---

# # 项目背景

# # 核心特性

# # 技术栈

# # 设计展示

<ProductGallery :images="['/images/fview-power/shot-1.png']" />
```

- **`category` 必写** —— 瀑布流卡片要显示
- **`type: design`** —— 作品集列表认这个值
- **不写 `[[toc]]`**（现有 2 篇都没有）
- 章节骨架固定四段，见上

### 碎记（`pages/daily/`）

```yaml
---
title: 今天的杂记
date: 2026-11-27
---
```

⚠️ 这个分区目前是半成品：`DailyDetail.vue` 永远显示「暂无记录」，从不读文章内容；`pages/daily/index.md` 渲染的是日历，不是列表。**写了也基本没人看得到内容**，不建议投入。

---

## 五、字段总表

### 必写

| 字段    | 说明                            |
| ------- | ------------------------------- |
| `title` | 标题，渲染为 h1，也用于列表卡片 |
| `date`  | 列表准入 + 排序依据             |

### 建议写

| 字段          | 说明                                                              |
| ------------- | ----------------------------------------------------------------- |
| `type`        | 归属依据。`blog` / `thinking` / `design` / `daily`，可用 `+` 复合 |
| `description` | 列表卡片摘要                                                      |
| `lang`        | 写 `zh`。目前唯一作用是 RSS（见第八节），保持与现有 20 篇一致     |

### 按分区写

| 字段       | 分区             | 说明                                        |
| ---------- | ---------------- | ------------------------------------------- |
| `category` | 作品集**必写**   | 瀑布流卡片分类标签                          |
| `image`    | 作品集**建议写** | 封面，绝对路径 `/images/<英文名>/first.png` |

### 可选

| 字段          | 说明                                                             |
| ------------- | ---------------------------------------------------------------- |
| `ai: true`    | 显示「AI 生成」标签（文章页「由 AI 整理生成」、卡片「AI 生成」） |
| `draft: true` | 草稿：隐藏于列表，文章顶部显示橙色提示                           |
| `imageType`   | 卡片封面位置：`top`（默认）/ `left` / `cover`                    |
| `display`     | 用别的文字覆盖 h1                                                |
| `art`         | 背景装饰：`plum` / `dots` / `random`                             |

### 禁止手写

| 字段       | 原因                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| `duration` | **自动计算**（`vite.config.ts:129-132`），手写会被覆盖逻辑跳过但永远不准 |

---

## 六、`date` 格式

**新文章统一用 `YYYY-MM-DD`**：

```yaml
date: 2026-11-27
```

现有 15 篇 posts 用的是 `YYYY-MM-DDTHH:mm:ss`（历史遗留），也能正常解析，但排序只精确到天，时分秒没有任何地方消费。

---

## 七、图片

### 博客

推荐放文章同名子目录：

```markdown
![需求分析工作图](./幕后产品/需求分析工作图.png)
```

也支持与 `.md` 同目录：

```markdown
![alt text](./image-2.png)
```

两种都能渲染。**推荐第一种** —— `blog_publish` 发布时会把「`.md` + 同名目录」整体提交，散在同目录的图片不会被带走。

外链图片（OSS、CDN）也完全可用，现有文章大量使用。

### 作品集

必须放 `public/`，用绝对路径：

```yaml
image: /images/fview-power/first.png
```

```markdown
<ProductGallery :images="['/images/fview-power/shot-1.png']" />
```

真实文件在 `public/images/<英文名>/` 下，`first.png` 作封面。

---

## 八、文件名

文件路径就是路由：`pages/posts/用户调研.md` → `/posts/用户调研`。

- **保留中文**，不要拼音化 —— 现有文章都是中文名
- 禁止字符：`/ \ : * ? " < > |`，会被替换为连字符
- 不要命名为 `index.md`（分区首页专用）
- 不要命名为 `[date].md`（`pages/daily/` 的动态路由模板）

---

## 九、已知限制

### RSS 目前是空的

`scripts/rss.ts:47` 判断 `if (data.lang !== 'en') return` —— 只收 `lang: en` 的文章，而现有 20 篇全是 `lang: zh`。

加上站点没有暴露任何订阅入口（没有 `<link rel="alternate">`，导航页脚也没有 RSS 链接），所以 `dist/feed.xml` 生成出来是空 feed，无人引用。**暂时无需处理**，将来做订阅时两处要一起改。

### `type: interest`

`create-post.sh` 里列了 `interest`，但站点没有 `/interest` 路由。历史遗留，**不要使用**。

### `type` 的取值别乱写

写错值不会报错，只会让文章从所有列表里消失（例如 `type: posts` 而不是 `blog`）。可用的值只有：

`blog` · `thinking` · `design` · `daily`

---

## 十、发布流程

写完文章用 `blog_publish` 工具发布，它会建主题分支、提交、推送并开 PR：

```
blog_publish(path: "pages/posts/xxx.md", section: "post", message: "docs: 新增《xxx》")
```

| 参数      | 说明                                                          |
| --------- | ------------------------------------------------------------- |
| `path`    | 仓库相对路径                                                  |
| `section` | `post` / `daily` / `product` / `thinking`，**必须与目录一致** |
| `message` | 提交信息                                                      |

发布前可以用 `blog_preview` 跑一次完整构建确认能编译。

两条硬规则：**永不直接推 main，永不合并 PR**。合并由人决定，合并后才触发部署上线。

工作区有无关改动时发布会拒绝执行 —— 先提交或 stash 掉。
