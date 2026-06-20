# 设计系统

所有视觉 token 在 `src/style.css` 中定义，通过 Tailwind CSS 4 `@theme` 注册为工具类。

## 字体

### 字族

MiSans

### 字号（`--text-*`）

| 工具类      | 大小  | 用途                           |
| ----------- | ----- | ------------------------------ |
| `text-2xs`  | 11 px | 移动端底部导航标签、极紧凑标记 |
| `text-xs`   | 12 px | 时间戳、元信息、次要说明       |
| `text-sm`   | 13 px | 次级正文、辅助描述             |
| `text-base` | 14 px | **主体正文**（默认）           |
| `text-lg`   | 16 px | 强调文本、导航标签             |
| `text-xl`   | 18 px | 子标题                         |
| `text-2xl`  | 22 px | 页面级标题                     |
| `text-3xl`  | 28 px | 展示型大标题                   |

**禁止**使用 `text-[Npx]` 任意值，从上表选取最接近的语义尺寸。

### 字重

| 工具类          | 用途                     |
| --------------- | ------------------------ |
| `font-normal`   | 正文内容                 |
| `font-medium`   | 强调正文、标签、次级头部 |
| `font-semibold` | 标题、激活状态、按钮文字 |
| `font-bold`     | 仅用于主展示标题         |

---

## 颜色

颜色 token 随主题切换，始终使用语义类名：

| 工具类                 | 含义                     |
| ---------------------- | ------------------------ |
| `bg-app-bg`            | 页面底层背景             |
| `bg-surface`           | 卡片、侧边栏、浮层背景   |
| `bg-surface-muted`     | 悬停、选中、输入框背景   |
| `text-text`            | 主要文字                 |
| `text-text-muted`      | 次要文字、占位符、禁用态 |
| `border-border-subtle` | 分割线、卡片边框（淡）   |
| `border-border`        | 输入框、强调边框         |
| `text-accent`          | 链接、高亮、激活状态     |
| `bg-accent`            | 主要按钮背景             |
| `text-accent-text`     | 主要按钮上的文字         |

**功能色**（随主题变化，浅色主题饱和度高，深色主题亮度提高以保证对比度）：

| 工具类         | 含义                   |
| -------------- | ---------------------- |
| `text-success` | 成功状态、正向反馈     |
| `text-warning` | 警告状态、需注意信息   |
| `text-danger`  | 错误状态、危险操作提示 |
| `text-info`    | 信息提示、中性通知     |

`bg-success`、`bg-warning`、`bg-danger`、`bg-info` 同样可用于背景色。

**禁止**使用 `dark:` variant。项目通过 `data-theme` 属性切换主题，所有颜色已通过 `--theme-*` 变量自动跟随主题变化，无需也不应手动区分明暗模式。

### 主题列表

在根元素上设置 `data-theme` 属性即可切换主题：

| `data-theme`  | 色调        | 强调色         |
| ------------- | ----------- | -------------- |
| `kraft-teal`  | 浅色·暖米色 | 青绿 `#0da898` |
| `kraft-brown` | 浅色·暖米色 | 棕褐 `#8b5a35` |
| `kraft-pink`  | 浅色·暖米色 | 粉红 `#f28bb8` |
| `pure-white`  | 浅色·黑白   | 近黑 `#0f0f0f` |
| `black-green` | 深色·纯黑   | 翠绿 `#22c55e` |
| `black-blue`  | 深色·纯黑   | 蓝色 `#3b82f6` |
| `ink-gold`    | 深色·墨绿   | 金色 `#d9d2b0` |

基础暖米色调色板定义在 `:root`，三个 kraft 变体仅覆盖 `--theme-accent`。

## 圆角（`--radius-*`）

使用**语义别名**，不使用数字级别名（`rounded-xl / 2xl / 3xl`）：

| 工具类            | 大小  | 用途                                   |
| ----------------- | ----- | -------------------------------------- |
| `rounded-sm`      | 2 px  | 内联 Badge、极小 Chip（Tailwind 内置） |
| `rounded`         | 4 px  | 最小圆角（Tailwind 内置）              |
| `rounded-thumb`   | 8 px  | 小缩略图、图标容器                     |
| `rounded-control` | 12 px | **按钮、输入框、表单控件**             |
| `rounded-card`    | 16 px | **卡片、导航条目、悬浮按钮（FAB）**    |
| `rounded-overlay` | 24 px | **遮罩层、抽屉、弹窗、气泡**           |
| `rounded-full`    | ∞     | 头像、圆形图标                         |

**规则**：同一语义元素在全局只选一个圆角值，不允许不同页面对同类控件使用不同圆角。

## 间距

使用 Tailwind 默认 4 px 步进单位，按语义分层：

### 内边距（padding）

| 场景                     | 用法          |
| ------------------------ | ------------- |
| 紧凑控件（小按钮、标签） | `px-3 py-1.5` |
| 标准控件（按钮、输入框） | `px-4 py-2`   |
| 主要操作按钮             | `px-5 py-2.5` |
| 卡片、面板内边距         | `p-4`         |
| 侧边栏内边距             | `px-6 py-8`   |
| 页面主内容区             | `px-8 py-8`   |

### 间距（gap / space-y）

| 场景             | 用法      |
| ---------------- | --------- |
| 图标 + 文字      | `gap-1.5` |
| 紧凑内联元素     | `gap-2`   |
| 列表项、表单字段 | `gap-3`   |
| 组件内元素       | `gap-4`   |
| 区块分隔         | `gap-6`   |
| 页面级区块       | `gap-8`   |

---

## 自定义 Tailwind Variant

针对 Radix UI 的 `data-state` / `data-*` 属性，项目注册了以下 variant，可直接用于 className：

| Variant            | 匹配条件                                                 |
| ------------------ | -------------------------------------------------------- |
| `data-open:`       | `data-state="open"` 或 `data-open`（非 false）           |
| `data-closed:`     | `data-state="closed"` 或 `data-closed`（非 false）       |
| `data-checked:`    | `data-state="checked"` 或 `data-checked`（非 false）     |
| `data-unchecked:`  | `data-state="unchecked"` 或 `data-unchecked`（非 false） |
| `data-selected:`   | `data-selected="true"`                                   |
| `data-disabled:`   | `data-disabled="true"` 或 `data-disabled`（非 false）    |
| `data-active:`     | `data-state="active"` 或 `data-active`（非 false）       |
| `data-horizontal:` | `data-orientation="horizontal"`                          |
| `data-vertical:`   | `data-orientation="vertical"`                            |

示例：`data-open:opacity-100 data-closed:opacity-0`

---

## 工具类

| 类名                          | 说明                                      |
| ----------------------------- | ----------------------------------------- |
| `scroll-subtle-native-hidden` | 隐藏原生滚动条（`scrollbar-width: none`） |
