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
