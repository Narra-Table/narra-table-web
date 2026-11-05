# Window Manager

## 范围

- 管理有序窗口列表和唯一焦点。
- 打开、关闭、聚焦和更新窗口业务状态。
- 使用固定宽度预设并排渲染窗口。
- 序列化和恢复最小工作区快照。
- 不解释业务窗口类型和业务状态。

## 边界

```text
Workbench application
        ↓
WorkspacePort
        ↑
Workbench infrastructure adapter
        ↓
Window Manager
```

- Workbench application 和 model 不导入 Window Manager。
- Window Manager 不导入 Workbench。
- adapter 同时依赖端口和 Window Manager 公共 API。
- `WorkbenchPage` 创建 store、adapter 和业务窗口渲染器。

## 模型

```ts
interface WindowInstance {
  instanceId: string;
  appId: string;
  windowTypeId: string;
  title: string;
  width: number;
  state?: unknown;
}

interface WindowManagerState {
  version: 2;
  windows: WindowInstance[];
  focusedWindowId: string | null;
}
```

- 数组顺序就是窗口显示顺序。
- `instanceId` 在窗口生命周期内稳定。
- `state` 归宿主所有，Window Manager 只负责保存和恢复。
- 关闭焦点窗口后聚焦同位置的相邻窗口。

## UI

- 桌面端横向并排列，窄屏纵向排列。
- 窗口只有标题、关闭操作和内容区域。
- 焦点窗口使用语义强调边框。
- 样式只使用 Tailwind utility 和项目语义 token。

## 非目标

- 堆叠和分页容器。
- 悬浮窗口和层级。
- 拖拽合并、拆分和重排。
- 任务栏、启动台和窗口菜单。
- 自定义键盘窗口管理。
- 工作区滚轮拦截和边缘自动滚动。
- 跨项目包和桌面系统抽象。
