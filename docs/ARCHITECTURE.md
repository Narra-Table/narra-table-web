# ARCHITECTURE.md

## 技术栈

- 框架：React 19
- 语言：TypeScript 6.0
- 工具链：Vite+
- 路由：TanStack Router（文件路由）
- 状态管理：React Context（全局）+ useState
- 服务端状态：TanStack Query
- Mock：MSW
- 图标：lucide-react
- 样式：Tailwind CSS v4
- UI 组件：不安装组件库；可以自由搜索并复制 2024 Shadcn Registry 的组件源码，或者通过 `pnpm dlx shadcn@latest add` 按需复制组件源码到 `src/components/ui/`

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
├── components.json            # shadcn CLI 配置
├── src/
│   ├── components/
│   │   └── ui/                # shadcn 复制来的基础组件
│   ├── features/              # 按业务功能组织的模块
│   ├── lib/
│   │   ├── client.ts          # Fetch 封装与 ApiError
│   │   ├── client.test.ts     # Fetch 封装单元测试
│   │   ├── queryClient.ts     # TanStack Query client 实例
│   │   └── utils.ts           # cn() 等通用工具函数
│   ├── mocks/                 # MSW mock 数据和请求处理器
│   ├── routes/                # TanStack Router 文件路由
│   │   └── __root.tsx         # 根布局路由
│   ├── main.tsx               # 应用入口
│   ├── routeTree.gen.ts       # 自动生成的路由树（不要手动编辑）
│   ├── types/
│   │   └── narratable-protocol-compat.d.ts # @narratable/protocol 兼容类型声明
│   └── style.css              # Tailwind v4 主题 token 和少量全局样式
├── AGENTS.md
├── CLAUDE.md
├── index.html                 # HTML 入口
├── package.json               # 包信息和脚本
├── pnpm-workspace.yaml        # pnpm workspace 与 catalog 配置
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite+ 配置
└── vitest.config.ts           # Vitest 配置
```
