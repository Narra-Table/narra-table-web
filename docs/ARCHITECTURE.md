# ARCHITECTURE.md

## 技术栈

- 框架：React 19
- 语言：TypeScript 6.0
- 工具链：Vite+
- 样式：Tailwind CSS v4
- UI 组件：不安装组件库；可以自由搜索并复制 2024 Shadcn Registry 的组件源码。
- 路由：TanStack Router（文件路由）
- 状态管理：React Context（全局）+ useState
- 服务端状态：TanStack Query
- Mock：MSW
- 图标：lucide-react

## 项目目录结构

```text
narra-table-web/
├── .vite-hooks/               # Vite+ Git hooks 配置
├── docs/                      # 项目文档
│   ├── ARCHITECTURE.md        # 架构和目录说明
│   ├── CONTRIBUTING.md        # 贡献和验证流程
│   ├── CONVENTIONS.md         # 代码约定
│   └── DESIGN.md              # 设计和样式规则
├── public/                    # 静态资源
│   └── mockServiceWorker.js   # MSW 浏览器端 Service Worker
├── src/
│   ├── api/
│   │   ├── client.ts          # Fetch 封装
│   ├── components/            # React 组件
│   ├── lib/
│   │   └── queryClient.ts     # TanStack Query client 实例
│   ├── mocks/                 # MSW 相关
│   ├── routes/                # TanStack Router 文件路由
│   │   ├── __root.tsx         # 根布局路由
│   │   ├── about.tsx          # About 页面路由
│   │   └── index.tsx          # 首页路由
│   ├── main.tsx               # 应用入口
│   ├── routeTree.gen.ts       # 自动生成的路由树（不要手动编辑）
│   └── style.css              # 全局样式
├── AGENTS.md                  # Codex MD
├── CLAUDE.md                  # Claude MD
├── index.html                 # HTML 入口
├── package.json               # 包信息和脚本
├── pnpm-workspace.yaml        # pnpm workspace 与 catalog 配置
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite+ 配置
└── vitest.config.ts           # Vitest 配置
```
