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
│   ├── DESIGN.md              # 设计和样式规则
│   └── workbench/
│       ├── README.md          # 空间工作台的当前实现
│       └── WINDOW-MANAGER.md  # 工作区容器与 WM 的目标设计
├── public/
│   └── mockServiceWorker.js   # MSW 浏览器端 Service Worker
├── src/
│   ├── api/                   # orval 自动生成的 API（不要手动编辑）
│   ├── components/
│   │   └── ui/                # shadcn 复制来的 UI 组件
│   ├── features/              # 功能模块
│   │   ├── resources/         # 资源访问能力
│   │   └── workbench/         # 空间工作台、窗口模型和业务窗口
│   ├── lib/                   # 平铺的跨 Feature 基础设施与工具
│   │   ├── apiClient.ts       # 生成 API 使用的请求客户端
│   │   ├── authSession.ts     # 普通用户会话
│   │   ├── adminSession.ts    # 管理员会话
│   │   ├── queryClient.ts     # TanStack Query 全局客户端
│   │   ├── appTheme.ts        # 全局主题读取与持久化
│   │   ├── classNames.ts      # 样式类名合并工具
│   │   └── useMediaQuery.ts   # 跨 Feature 的媒体查询 Hook
│   ├── mocks/                 # MSW mock 数据和请求处理器
│   ├── routes/                # TanStack Router 文件路由
│   │   └── __root.tsx         # 根布局路由
│   ├── types/
│   │   └── narratable-protocol-compat.d.ts # @narratable/protocol 兼容类型声明
│   ├── views/                 # 路由级页面骨架和 Feature 组合视图
│   │   └── layouts/           # App、Room 等路由 Layout
│   ├── main.tsx               # 应用入口
│   ├── routeTree.gen.ts       # 自动生成的路由树（不要手动编辑）
│   └── style.css
├── AGENTS.md
├── CLAUDE.md
├── components.json            # shadcn CLI 配置
├── index.html
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite+ 配置
└── vitest.config.ts           # Vitest 配置
```

## 模块边界

- `features/<name>` 按业务能力划分，每个 Feature 使用 `index.ts` 声明公共 API。
- `views` 放路由级页面骨架和多个 Feature 的组合视图；只有布局、导航或页面编排，不作为业务 Feature。
- 路由和其他 Feature 只能从 `@/features/<name>` 导入，不得深层引用 Feature 内部文件。
- Feature 内部按复杂度渐进拆分；小模块保持扁平，大模块使用 `ui`、`model`、`api`、`hooks`、`lib` 等职责目录，不创建空目录占位。
- `lib` 放无业务所有权的基础设施和工具，使用明确文件名平铺组织，例如 `apiClient.ts`、`authSession.ts` 和 `useMediaQuery.ts`。
- `lib` 不使用只有单个实现文件的分类子目录；同类文件使用共同前缀或明确职责名。
- Hook 默认与所属 Feature 共置，只有跨 Feature 复用且不含业务语义时才进入 `lib`。
- 测试与被测模块共置，跨 Feature 集成测试放在负责组合这些 Feature 的宿主模块中。

依赖方向：

```text
routes -> features -> lib
   +-> views -> features / lib
```

- `lib` 不依赖 `features`。
- Feature 之间通过公共 API 协作，不共享内部状态实现。

Feature 目录模板：

```text
features/<feature>/
├── index.ts          # 对外公开 API
├── ui/               # 页面、组件和 UI 子模块
├── model/            # 状态、类型和业务规则
├── api/              # 请求、Socket 和 Query 定义
├── hooks/            # 仅该 Feature 使用的复合 Hook
└── lib/              # Feature 内部基础设施和工具
```

- 目录按需创建，不为保持外观一致创建空目录。
- 一个文件包含多个可独立命名、测试或复用的组件时，拆入同一职责目录的子文件夹。
- 大型 Feature 在职责目录内继续按子能力分包，例如 `room-chat/ui/chat`、`ui/composer`、`ui/messages`；不把只能共同工作的内部组件伪装成多个顶层 Feature。
- 页面文件只负责组合；数据访问放 `api`，复杂状态操作放 `model` 或 `hooks`。
