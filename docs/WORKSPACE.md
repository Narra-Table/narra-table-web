# 空间工作台

> 目标设计见 [WORKSPACE-WM.md](WORKSPACE-WM.md)。通用 WM 位于 `src/modules/workbench`，业务宿主位于 `src/features/workbench`。

## 路由

| 路径                             | 行为                                         |
| -------------------------------- | -------------------------------------------- |
| `/spaces/$spaceId`               | 默认工作台；路由懒加载 `WorkbenchPage`       |
| `/spaces/$spaceId/workbench`     | 默认工作台的兼容别名                         |
| `/spaces/$spaceId/rooms/$roomId` | 兼容旧链接；保存房间偏好后重定向到空间工作台 |

空间卡片进入工作台时沿用同一套本地偏好；房间标签只预选房间。

## 结构

```text
src/modules/workbench/
├─ core/           # 状态、action、selector、快照、store
├─ react/          # Provider、列/悬浮/任务栏/启动台/键盘/拖拽
└─ styles.css      # --wm-* 结构样式

src/features/workbench/
├─ hooks/          # 宿主生命周期和副作用 Hook
├─ infrastructure/ # 本地持久化和兼容迁移
├─ model/          # 业务窗口状态
├─ windows/        # 内置业务窗口内容、类型和标题
├─ WorkbenchPage.tsx
└─ index.ts        # Feature 公共 API
```

空间路由懒加载 `WorkbenchPage`；构建再拆分 WM、窗口内容和 TipTap 编辑器代码。

## 数据流

- `windows/windows.ts`：内置窗口类型和标题。
- `windows/registry.ts`：把窗口类型映射成 App Registry 声明，`appId` 固定为 `narratable`。
- `WorkbenchPage.tsx`：组合 Provider、工作台和窗口内容。
- `model/chat-state.ts`：聊天房间、场景和搜索存在每个窗口的 `window.state`；多个聊天窗口互相独立。
- `infrastructure/persistence.ts`：工作区快照与房间偏好存入 `localStorage`。
- `hooks/useWorkbenchPersistence.ts`：合并高频状态更新，页面离开时立即刷新快照。
- 首次进入没有快照时，创建 2/3 聊天列和 1/2 角色列，并聚焦聊天。
- 「加入焦点容器」会把新窗口插入当前列：普通列变堆叠，分页列增加标签。
- 稳定宿主/portal 保持窗口内容挂载；换容器、切分页和停靠/悬浮不会卸载。
- 键盘方向键、移动、调宽/调高和宿主逃生键已接入。
- 启动台支持窗口搜索、打开和加入当前容器。
- 窄屏使用单容器投影、堆叠行标签和悬浮 sheet。
- 桌面拖拽支持整列重排、合并为标签/堆叠和空白处新建列。

## 持久化与兼容

- 工作区快照 key：`narratable.workbench-next.snapshot.<spaceId>`。
- 房间偏好 key：`narratable.workbench-next.room.<spaceId>`。
- 读取旧工作台数据时只迁移选中的房间；旧布局按新默认布局重建。
- 房间失效时回到会话房或第一间房。
- 场景和搜索是聊天窗口的会话状态，不进入 URL。

## 当前限制

- 模态和触屏长按拖拽尚未接入。
- 快照仅存本地，尚无服务端 workspace API。

## 验证

```bash
vp check --fix
vp test
pnpm build
```

浏览器中验证打开/关闭/聚焦、加入焦点容器、堆叠/分页、宽度菜单和刷新恢复。
