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
│   ├── avatar.webp            # 本地 mock 用户头像
│   ├── space*.webp            # 本地 mock 空间封面
│   └── mockServiceWorker.js   # MSW 浏览器端 Service Worker
├── src/
│   ├── features/              # 按业务功能组织的模块
│   │   ├── characters/        # 角色卡 API 和 Query hooks
│   │   ├── masks/             # 面具 API 和 Query hooks
│   │   ├── messages/          # 消息 API、分页查询和变更 hooks
│   │   ├── resources/         # 素材资源 API 和 Query hooks
│   │   ├── rooms/             # 房间 API 和 Query hooks
│   │   └── spaces/            # 空间 API 和 Query hooks
│   ├── lib/
│   │   ├── client.ts          # Fetch 封装与 ApiError
│   │   ├── client.test.ts     # Fetch 封装单元测试
│   │   └── queryClient.ts     # TanStack Query client 实例
│   ├── mocks/                 # MSW mock 数据和请求处理器
│   │   ├── db.ts              # 内存 mock 数据源
│   │   ├── browser.ts         # 浏览器端 MSW worker
│   │   ├── node.ts            # 测试/Node 端 MSW server
│   │   └── handlers/          # 按资源拆分的 handler
│   ├── routes/                # TanStack Router 文件路由
│   │   ├── __root.tsx         # 根布局路由；全局 pending/error/portal 挂载点
│   │   ├── _app.tsx           # 常规应用 App Shell；桌面 rail / 移动底部导航
│   │   ├── _app.index.tsx     # 首页 Dashboard
│   │   ├── _app.characters.tsx
│   │   ├── _app.characters.$characterId.tsx
│   │   ├── _app.modules.tsx
│   │   ├── _app.modules.$moduleId.tsx
│   │   ├── _app.assets.tsx
│   │   ├── _app.assets.$assetId.tsx
│   │   ├── _app.notifications.tsx
│   │   ├── _app.settings.tsx  # /settings，桌面 route-backed modal，移动整页
│   │   ├── _table.tsx         # 跑团工作区独立布局
│   │   ├── _table.tables.$tableId.tsx
│   │   └── about.tsx          # About 页面路由
│   ├── main.tsx               # 应用入口
│   ├── routeTree.gen.ts       # 自动生成的路由树（不要手动编辑）
│   ├── types/
│   │   └── protocol.ts        # 前后端协议类型
│   └── style.css              # Tailwind v4 主题 token 和少量全局样式
├── AGENTS.md                  # Codex MD
├── CLAUDE.md                  # Claude MD
├── index.html                 # HTML 入口
├── package.json               # 包信息和脚本
├── pnpm-workspace.yaml        # pnpm workspace 与 catalog 配置
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite+ 配置
└── vitest.config.ts           # Vitest 配置
```

## 数据层约定

- 每个 `src/features/<feature>/queries.ts` 维护自己的 query key factory，例如
  `spaceKeys`、`roomKeys`、`messageKeys`。不要在页面或 mutation 中散落手写 query key。
- 查询逻辑使用 `queryOptions` / `infiniteQueryOptions` 导出可复用 options，再由 hooks 包装。
- mutation 成功后需要刷新所有受影响的缓存：
  - 创建/删除子资源时，刷新父资源详情和对应列表。
  - 更新详情时，刷新该详情和它所在的列表。
  - 删除详情时，刷新列表并移除对应详情缓存。
  - 影响多个视图的数据变更优先按 query key 前缀刷新，例如同一房间下的普通消息流和置顶消息。
- MSW handlers 应尽量模拟真实后端约束。嵌套路由的更新/删除需要同时校验父级 id，避免 mock 行为比真实接口宽松。
