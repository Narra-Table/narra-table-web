# CLAUDE.md

## 项目概览

Narra Table Web 是一个 TRPG 平台，基于 Vite+ 0.2.1、React 19、TypeScript 和 Tailwind CSS 4 构建。

## 参考文档

> **⚠️ 只要涉及以下场景，必须先读对应文档再操作。**

- 新增目录、调整项目结构：`docs/ARCHITECTURE.md`
- 写代码（命名、组件约定等）：`docs/CONVENTIONS.md`
- 写组件或页面、涉及任何样式：`docs/DESIGN.md`
- 提交代码：`docs/CONTRIBUTING.md`
- 涉及构建、工具链配置：本地 `node_modules/vite-plus/docs` 或 <https://viteplus.dev/guide/>

## 开发与验证

- 安装：`vp install`
- 开发：`vp dev`
- 格式化与 Lint：`vp check --fix`
- 测试：`vp test`
- 构建：`vp build`

## 更新文档的规则

更新 `docs/` 下的文档、`CLAUDE.md`、`AGENTS.md` 等配置文件时：

- `CLAUDE.md` 与 `AGENTS.md` 内容保持一致，更新其中一个时必须同步更新另一个。
- 对齐已有文档的写作风格，不引入更啰嗦的写法。
- 使用渐进式披露：高层结构在目录树，细节放独立章节或另一份文档，不在同一层重复。
- 目录树注释一行说完，不在文档其他地方重复解释同一条目。
- 不写引导语（"如下所示""见下方"）、不写解释为什么的散文，只写规则本身。

## 编码规则

- 使用 TypeScript 严格模式。
- 使用 Tailwind CSS utility classes 编写样式。不要编写原始 CSS 或内联 `style` 属性。

### 样式系统约束

颜色、字号、圆角必须使用 `docs/DESIGN.md` 中的语义 token。禁止对这三类使用任意值。禁止 `dark:` variant，项目通过 `data-theme` 切换主题。

> **⚠️ Tailwind 内置颜色类（`text-red-500` 等）和字号类（`text-sm` 默认值等）在本项目中不生效——`src/style.css` 已将其清空并替换为语义 token。**
