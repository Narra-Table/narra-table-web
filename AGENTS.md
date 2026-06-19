# AGENTS.md

## 项目概览

Narra Table Web 是一个 TRPG 平台，基于 Vite+ 0.1.21、React 19、TypeScript 和 Tailwind CSS 4 构建。

## 如有需要，请参考以下文档

- 架构决策：`docs/ARCHITECTURE.md`
- 代码约定：`docs/CONVENTIONS.md`
- 设计和样式规则：`docs/DESIGN.md`
- 贡献和验证流程：`docs/CONTRIBUTING.md`
- 更多 Vite+ 信息：本地 `node_modules/vite-plus/docs` 或 <https://viteplus.dev/guide/>

## 开发与验证

- 安装：`vp install`
- 开发：`vp dev`
- 格式化与 Lint：`vp check --fix`
- 测试：`vp test`
- 构建：`vp build`

## 必须遵循的规则

- 使用 TypeScript 严格模式。
- 使用 Tailwind CSS utility classes 编写样式，不要编写原始 CSS 或内联 `style` 属性。

### 样式系统约束

颜色、字号、圆角必须使用 `docs/DESIGN.md` 中的语义 token。禁止对这三类使用任意值。禁止 `dark:` variant，项目通过 `data-theme` 切换主题。

> **⚠️ Tailwind 内置颜色类（`text-red-500` 等）和字号类（`text-sm` 默认值等）在本项目中不生效——`src/style.css` 已将其清空并替换为语义 token。**
