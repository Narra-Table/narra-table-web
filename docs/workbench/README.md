# 空间工作台

NarraTable 提供以空间为边界的 TRPG 协作工作台，业务窗口通过独立窗口管理能力组织和呈现。

## Language

**Workbench**:
承载空间和内置业务窗口的产品能力。
_Avoid_: Window Manager、窗口系统

**Workspace Port**:
Workbench 用产品语言声明的窗口组织能力边界。
_Avoid_: Store Actions、Window Manager API

**Window Manager**:
管理窗口列表、焦点和并排布局的基础能力，不解释业务窗口状态。
_Avoid_: Workbench、桌面系统

**Business Window**:
Workbench 中承载聊天、角色、成员、线索、战斗或地图内容的独立视图实例。
_Avoid_: Container、Panel

## 路由

| 路径                             | 行为                                   |
| -------------------------------- | -------------------------------------- |
| `/spaces/$spaceId`               | 默认工作台；路由懒加载 `WorkbenchPage` |
| `/spaces/$spaceId/workbench`     | 默认工作台的兼容别名                   |
| `/spaces/$spaceId/rooms/$roomId` | 兼容旧地址，直接重定向到空间工作台     |

## 结构

```text
src/features/
├─ workbench/
│  ├─ application/     # WorkspacePort
│  ├─ infrastructure/  # Window Manager adapter
│  ├─ hooks/           # 持久化生命周期
│  ├─ lib/             # 本地窗口快照
│  ├─ model/           # 业务窗口类型和状态
│  └─ ui/              # 页面和业务窗口内容
└─ window-manager/
   ├─ model/           # 窗口状态和 store
   ├─ ui/              # 窗口管理器渲染组件
   └─ index.ts         # 公共 API
```

## 数据流

- Workbench 通过 `WorkspacePort` 打开、关闭、聚焦和更新业务窗口。
- `window-manager-workspace.ts` 把端口调用映射到 Window Manager store。
- Window Manager 只保存窗口标识、类型、标题、宽度和不透明业务状态。
- `WorkbenchPage` 注入业务窗口渲染函数，不把业务组件放入 Window Manager。
- 聊天、角色、成员、线索、战斗和地图均为极简本地功能 mock。
- 默认布局打开 2/3 聊天窗口和 1/2 角色窗口。
- 顶部工具栏打开新的业务窗口；窗口标题栏负责关闭。

## 持久化

- 工作区快照 key：`narratable.workbench-next.snapshot.<spaceId>`。
- 快照版本不兼容时重建默认布局。

## 验证

```bash
vp check --fix
vp test
vp build
```
