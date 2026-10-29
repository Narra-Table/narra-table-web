# 工作区容器与 WM

> 状态：设计稿 · 待审核

本文是空间工作台的目标设计：容器、窗口、焦点、布局、任务栏、启动台、持久化和独立 WM 包。当前实现见 [README.md](README.md)；应用、规则和角色卡见 [app-rule-model.md](../../../backend/docs/features/app-rule-model.md)。本文不与它们重复同一层的细节。

参考：[niri Tabs](https://niri-wm.github.io/niri/Tabs.html)、[niri Layout](https://niri-wm.github.io/niri/Configuration%3A-Layout.html)、[niri Floating Windows](https://niri-wm.github.io/niri/Floating-Windows.html)。

## 一、范围

目标：

- 把窗口、容器和程序分开：应用是程序，窗口是实例，容器是布局。
- 用 column + floating 两种容器覆盖标准、堆叠、分页、悬浮。
- 明确滚动平铺、焦点、键盘、拖拽、任务栏、启动台和持久化。
- WM 独立成一个可复用包，web 只是宿主之一。

非目标：

- 不把平台页面窗口化。角色管理页等仍走平台路由。
- 不做全局 undo/redo、最近关闭、重置布局。
- 不做 rule 切换和迁移。
- 不做 iframe 实时缩略图。
- 不做跨应用窗口通信。

## 二、决策摘要

| #   | 决策                                                                                       |
| --- | ------------------------------------------------------------------------------------------ |
| 1   | 容器只有 `column` 和 `floating` 两种。                                                     |
| 2   | 标准/堆叠/分页是 column 的三种状态，由 `display` 和窗口数推导。                            |
| 3   | 容器不得二次嵌套：column 只装窗口，floating 只装一个窗口。                                 |
| 4   | 容器高度固定，宽度显式；不提供填满视口的模式。                                             |
| 5   | 窗口是稳定实例，移动/合并/解散只换容器，不重建。                                           |
| 6   | 同一应用可开多个独立实例；应用自己决定共享哪些状态。                                       |
| 7   | 焦点是窗口级且唯一；悬浮层独立，始终在平铺层上方。                                         |
| 8   | 键盘方向性动作为主，启动台只处理复杂操作。                                                 |
| 9   | 所有 ntp 窗口强制转发工作区快捷键；输入框内默认放行。                                      |
| 10  | 任务栏固定占底部，一项一个窗口实例，按容器分组。                                           |
| 11  | 启动台是宿主模态浮层，统一新建窗口和管理已有窗口。                                         |
| 12  | 工作区快照按 `user + space` 服务端同步，包含应用可恢复视图状态。                           |
| 13  | 窄屏是桌面布局的投影，不写回桌面宽度和行高。                                               |
| 14  | 不做 undo、最近关闭、重置布局。                                                            |
| 15  | WM 是 NarraTable 工作台的内部能力，放在 `web/src/features/workbench`，不设计成跨项目框架。 |

## 三、模型

### 3.1 容器

```ts
type Container = ColumnContainer | FloatingContainer;

interface ColumnContainer {
  id: string;
  kind: 'column';
  display: 'normal' | 'tabbed';
  width: number; // 视口可用宽度的比例，扣除间隙后计算
  lastNonFullWidth: number; // 快速宽度切换的记忆值
  windows: WindowInstanceId[];
  heights?: number[]; // 仅 normal 多窗口；权重和归一化为 1
}

interface FloatingContainer {
  id: string;
  kind: 'floating';
  window: WindowInstanceId;
  x: number;
  y: number;
  width: number;
  height: number;
  zOrder: number;
}
```

状态推导：

| 状态     | 条件                                          |
| -------- | --------------------------------------------- |
| 标准容器 | `kind = column`，`display = normal`，1 个窗口 |
| 堆叠容器 | `kind = column`，`display = normal`，多个窗口 |
| 分页容器 | `kind = column`，`display = tabbed`           |
| 悬浮容器 | `kind = floating`，1 个窗口                   |

不存 `type: standard | stacked | paged`；这些是派生状态，避免转换矩阵和过期字段。

### 3.2 窗口实例

```ts
interface WindowInstance {
  instanceId: string; // 稳定，不复用
  appId: string;
  windowTypeId: string;
  title: string;
  icon?: string;
  chrome: 'full' | 'titlebar-hidden';
  lastTiledWidth?: number; // 解散时还原
  state?: unknown; // 应用可恢复视图状态，宿主不解释
}
```

规则：

- 移动、合并、解散、停靠/悬浮都保持 `instanceId`，内容不卸载。
- 同一应用默认可多实例；应用声明 `singleton` 时最多一个。
- 应用可决定哪些状态共享。聊天当前房间/场景是聊天应用按 `user + space` 共享的视图状态；聊天记录、房间数据由服务端共享。
- 工作区不保存 `roomId` / `scene`；它们属于聊天应用的 `state`。

### 3.3 应用与窗口声明

应用注册项、默认宽度、显示模式、chrome、悬浮/模态、singleton、可嵌入性等以 [app-rule-model.md](../../backend/docs/features/app-rule-model.md) 为准。

WM 只消费：

```text
appId / windowTypeId / title / icon / defaultWidth / defaultDisplay
chrome / floating / modal / singleton / embeddable
```

宿主通过 `AppRegistry` 注入，WM 不 import API、路由、角色或规则代码。

## 四、几何与视觉

- 顶部工具栏固定；底部任务栏固定，约 48px；容器可用高度 = 视口高度 - 两者。
- 列间和四周间隙 8px；列宽比例按扣除间隙后的可用宽度计算。
- 容器直角、实心、不透明；不使用毛玻璃、半透明或浮动卡片样式。
- 每个容器 1px 边框；焦点窗口 2px accent 焦点环；不叠加容器边框和窗口边框。
- 阴影只给悬浮容器；平铺容器不用阴影。
- 任务栏顶部 1px 分隔线；不加浮夸阴影。
- 宽度：`1/3`、`1/2`、`2/3`、`1` 预设；右边缘拖拽调整；最小宽度限制。
- 快速宽度按钮：`< 1` 时记下 `lastNonFullWidth` 并设为 `1`；`= 1` 时还原，缺失则回 `1/2`。
- 行高：权重数组；默认等分；拖相邻分隔条；加行拆焦点行 50/50；删行按比例分配；切到 `tabbed` 不丢权重。
- 窄屏不显示宽度、行高和横向滚动；容器占满可用宽度。

## 五、容器操作

### 5.1 拖拽

| 操作                | 结果                               |
| ------------------- | ---------------------------------- |
| 标准 → 标准，内容区 | 合并为 `normal`，两行堆叠          |
| 标准 → 标准，顶部条 | 合并为 `tabbed`，两个标签          |
| 标准 → 已划分容器   | 沿用目标当前 `display`，按位置插入 |
| 多窗口 column 拖拽  | 只整体换位，不合并                 |
| 拖到两列之间        | 重排                               |
| 拖到空白条带        | 新建标准 column                    |
| 拖标签/行头到空白   | 拆成新的标准 column                |
| 拖走最后一个窗口    | 容器消失                           |

- 双区域只在“两个标准容器”合并时出现；其他目标不显示模式切换区。
- 合并保留目标宽度；来源宽度记入窗口的 `lastTiledWidth`。
- 触摸端用长按进入拖拽，并提供菜单替代路径。

### 5.2 新建按钮

- 标准容器没有 `+`；变成多窗口靠拖拽合并或启动台。
- 分页容器 `+`：在当前活动标签后插入新标签。
- 堆叠容器 `+`：在焦点行后插入新行，拆分焦点行高度。
- `+` 打开可嵌入窗口选择器，和启动台共用数据源。
- 新窗口默认标准 column，插在焦点列右侧并聚焦；应用默认浮动则开悬浮。

### 5.3 关闭与解散

| 状态          | 右上角按钮       |
| ------------- | ---------------- |
| 标准容器      | 宽度、更多、关闭 |
| 分页/堆叠容器 | 宽度、更多、解散 |
| 悬浮容器      | 更多、关闭       |

- 标签/行各自有关闭按钮；只关当前窗口。
- 多窗口容器的「更多」里有「关闭容器」，要求确认。
- 解散把每个窗口还原成独立标准 column，插在原容器位置，按 `lastTiledWidth` 还原宽度；焦点跟随原焦点窗口。
- 单窗口容器显示关闭，不显示解散。
- 不做 undo、最近关闭、重置布局。

### 5.4 更多菜单

| 状态 | 菜单项                                                  |
| ---- | ------------------------------------------------------- |
| 标准 | 应用偏好、宽度预设、变为悬浮                            |
| 分页 | 应用偏好、宽度预设、切换为堆叠、关闭容器                |
| 堆叠 | 应用偏好、宽度预设、行高预设/等分、切换为分页、关闭容器 |
| 悬浮 | 应用偏好、停靠到平铺、重置尺寸/位置                     |

- 只显示当前状态有效的项。
- 「移动到…」「加入当前标签/堆叠」留给启动台，不重复。
- 菜单是浮层，不创建窗口，不入快照。

## 六、焦点与键盘

### 6.1 焦点

```ts
interface FocusState {
  layer: 'tiling' | 'floating';
  focusedWindowId: WindowInstanceId | null;
  lastFocusedWindowByContainer: Record<ContainerId, WindowInstanceId>;
}
```

- 焦点窗口唯一；容器只记最近焦点。
- 悬浮始终渲染在平铺层上方；多个悬浮按最近聚焦排序，最后聚焦的在最上。
- 点击窗口/标签/行头设置焦点；点击容器 chrome 回到该容器最近焦点。
- 左右在 column 间移动；上下在堆叠行/分页标签间移动。
- 平铺/悬浮是两层焦点，用专门 action 进入/退出；悬浮不混进左右遍历。
- 关闭焦点窗口后，焦点回同容器相邻窗口 → 相邻容器 → 悬浮/平铺层。
- 模态打开时焦点进入模态，关闭后恢复原焦点；模态不自动恢复。

### 6.2 键盘

- 方向性动作为主；启动台处理开窗、任意目标移动、批量操作。
- 默认修饰键层级：`Ctrl+方向` 聚焦，`Ctrl+Shift+方向` 移动，`Ctrl+Alt+方向` 调整尺寸。
- 避开浏览器硬快捷键：`Ctrl+W/T/N/R/Q/L/D` 等。
- 输入框、文本编辑器内默认放行；`Ctrl+Alt+Escape` 作为宿主逃生键。
- ntp iframe 强制注入键盘桥；只转发工作区快捷键，应用可以保留个别键，但不能封死逃生键。
- 所有动作有命名 action；鼠标、键盘、启动台调用同一套 action。
- 具体默认键位待定，但方向键是主路径，H/J/K/L 只作可选别名。

### 6.3 横向滚动

- 窗口内容滚动优先，垂直滚轮不滚工作区。
- 背景/间隙上滚轮横向滚工作区；`Shift + 滚轮` 在任意位置横向滚。
- 触控板横向滑动在窗口内容上交给应用，不冒泡；背景上滚工作区。
- 焦点移动自动把目标列滚进可视区。
- 悬浮不参与工作区滚动；位置相对视口固定。
- 滚动位置按 `user + space` 持久化。

## 七、任务栏与启动台

### 7.1 任务栏

- 固定底部，约 48px；不自动隐藏。
- 左侧「应用」按钮打开启动台；其余按容器分组列出打开窗口实例。
- 后台标签、堆叠非焦点行、悬浮窗口都出现在任务栏。
- 点击跳转：切标签、聚焦行、把悬浮提到最上、滚容器进可视区。
- 顺序：平铺容器按工作区顺序，容器内按窗口顺序；悬浮组按最近聚焦。
- 预览：图标、标题、应用名、容器位置；应用可提供 `previewText` / `previewImage`，宿主限制大小。不做 iframe 实时克隆。
- 超出时任务栏内部横向滚动；项保持最小可点击宽度。
- 键盘可聚焦任务栏项，左右移动、Enter 跳转、Esc 返回原焦点。

### 7.2 启动台

- 任务栏「应用」按钮或统一快捷键打开；宿主模态浮层，不创建窗口实例。
- 两个页签：
  - 应用：窗口类型，默认新开标准 column；次级动作加入当前标签/堆叠/悬浮。
  - 窗口：已打开实例，按容器分组；支持聚焦、关闭、移动、加入容器、停靠/悬浮、解散容器。
- 搜索按窗口标题、应用名、描述过滤；方向键选择，Enter 执行，Esc 关闭。
- 分页/堆叠的 `+` 复用同一选择器，进入「加入当前容器」模式。
- 启动台不进入工作区快照，不参与任务栏分组。

### 7.3 注意提示

- 应用调用 `setAttention(instanceId, level, payload)`；级别 `none | info | urgent`。
- 任务栏项、标签、行头显示圆点/数字；`urgent` 轻微脉冲，尊重 reduced-motion。
- 不自动聚焦、不重排、不发声；默认聚焦时清除，应用可关闭自动清除。
- 注意状态是瞬态，不入快照；恢复后由应用重新计算。

## 八、窗口生命周期

### 8.1 打开

- 默认：标准 column，插在焦点列右侧，聚焦并滚进可视区。
- 应用声明默认浮动则开悬浮；声明 `tabbed` 则新 column 以 tabbed 打开。
- 默认宽度：打开请求 > 窗口类型默认 > 应用默认 > 全局默认。
- `singleton` 已存在时聚焦已有实例，返回原 `instanceId`。
- 当前焦点在悬浮时，插在最近的平铺焦点列右侧；没有平铺焦点则放最前。
- 空工作区开第一个 column。

### 8.2 应用窗口 API

```ts
window.open(windowTypeId, options?) -> instanceId
window.close(instanceId)
window.focus(instanceId)
window.setTitle(instanceId, title)
window.setIcon(instanceId, icon)
window.setAttention(instanceId, level, payload?)
window.postMessage(targetInstanceId, type, payload)
window.broadcast(type, payload)
window.onMessage(handler)
```

- 只能打开自己声明的窗口类型；不能操作其他应用的实例。
- `close` 走关闭守卫；不能强关其他应用窗口。
- 窗口通信总线按 `spaceId + appId` 隔离；默认不跨应用；消息只允许 JSON，有大小限制；不持久化、不排队。
- 注意提示、标题/图标更新同步到容器、任务栏和启动台。

### 8.3 后台与错误

- 窗口只要开着就保持挂载；切标签、移容器、滚出视口都不卸载。
- 宿主发 `visibility` 事件；应用自行暂停/降频。
- 首版不自动挂起/卸载；以后加 `suspendable` 和 `suspend/resume`。
- 容器 chrome 立即出现；内容区负责加载骨架和错误面板。
- 加载超时、iframe 握手失败、心跳超时：内容区显示错误面板，可重试/关闭；不弹全局模态。
- 内置应用按窗口 error boundary 隔离；一个窗口错误不影响其他窗口。
- 应用被禁用/rule 不匹配：显示不可用并保留关闭，不静默消失。
- 恢复时窗口类型不存在：跳过该实例，不生成错误窗口。

### 8.4 模态

- 启动台本身是宿主模态浮层。
- 应用同一时间只允许一个模态悬浮；模态阻止平铺和非模态悬浮交互，禁用任务栏。
- 模态有 `aria-modal`、焦点陷阱、Esc（如果 dismissible）、关闭守卫。
- 关闭后焦点回到打开前窗口；模态不自动恢复。

## 九、持久化

- 每个 `user + space` 一份工作区快照，服务端持久化，本地缓存用于首屏。
- 快照包含：

```text
WorkspaceSnapshot
├─ version
├─ containers[]
├─ windows[]（instanceId / appId / windowTypeId / chrome / floating geometry）
├─ focus
├─ scrollOffset
└─ appStates { [instanceId]: unknown }
```

- `appStates` 是应用自愿提供的视图状态，不透明、有大小上限和版本号；不存业务数据。
- 聊天当前房间/场景作为聊天应用的 state 进入快照；聊天记录仍由服务端管。
- 空快照有效；不要因为聊天有上次房间就补默认布局。
- 有快照就整套恢复；没有快照才创建默认布局：一个 2/3 宽的聊天标准容器。
- 没有聊天或聊天不可用时显示空工作区 + 任务栏 + 启动台。
- 模态状态、注意提示不恢复；窗口类型缺失则跳过。
- 恢复失败不阻塞进入工作区；无法解析的布局回退默认。

## 十、窄屏

- `<1024px` 一次显示一个容器，顶部用容器切换器/标签切换。
- 标准容器占满；分页容器显示标签；堆叠容器投影成一次一行的分页，保留行顺序和行高数据。
- 悬浮容器变成底部 sheet 或全屏覆盖层；模态仍锁焦点。
- 宽度、横向滚动、拖拽调宽隐藏；桌面宽度/行高/悬浮几何不被窄屏覆盖。
- 拖拽合并改为长按菜单；键盘仍可用同一套 action。
- 任务栏保留，固定在底部；高度可略减。

## 十一、辅助技术

实用基线，不追求完整 WCAG：

- 容器、任务栏、启动台、菜单可 Tab 到达，焦点可见。
- 基本角色：容器 `region`/`group`，分页 `tablist`/`tab`/`tabpanel`，堆叠 `list`/`listitem`，启动台 `dialog` + 搜索 + `listbox`。
- 模态焦点陷阱、关闭后焦点恢复。
- 拖拽有键盘/菜单替代。
- 尊重 `prefers-reduced-motion`。
- 应用内部无障碍由应用负责；宿主只提供 iframe 标题和焦点桥。

## 十二、代码位置与分割

WM 在 `web/src/features/workbench` 内实现，不单独发 npm 包。

```text
web/src/features/workbench/
├─ model/window-manager/  状态、action、selector、序列化
├─ ui/window-manager/     Provider、hooks、容器、任务栏、启动台
├─ ui/windows/            NarraTable 业务窗口
└─ ui/WorkbenchPage.tsx   页面编排
```

依赖约束：

- `model/window-manager` 保持纯数据与纯函数，不依赖 React。
- `ui/window-manager` 只负责 React 生命周期和交互编排。
- 业务窗口通过 Feature 内部 registry 接入，不对外暴露通用框架 API。
- 构建把工作台拆到 `workbench` chunk；空间路由懒加载页面。

宿主端口：

```text
AppRegistry        应用/窗口类型、默认值、标题/图标
WindowRenderer     renderWindow(instance)：内置组件或 ntp iframe
Persistence        load/save WorkspaceSnapshot
Config             宽度默认、偏好
KeyboardBridge     iframe 快捷键转发
Attention          注意提示
Messages           文案
IconRenderer       图标
```

样式：

- 只用 `--wm-*` CSS 变量，宿主映射主题。
- 默认 CSS 保证直角、实心、固定 chrome、焦点环、任务栏布局。
- 文案通过 `messages` 注入；model/ui 提供英文默认值，宿主传中文。

```css
--wm-gap: 8px;
--wm-toolbar-height: 48px;
--wm-taskbar-height: 48px;
--wm-radius: 0;
--wm-surface: ...;
--wm-surface-muted: ...;
--wm-text: ...;
--wm-text-muted: ...;
--wm-border: ...;
--wm-border-subtle: ...;
--wm-accent: ...;
--wm-accent-text: ...;
--wm-danger: ...;
--wm-focus-ring-width: 2px;
```

## 十三、迁移

- 当前 [README.md](README.md) 描述已接入的内置工作台。
- 移除工作区的全局 `roomId` / `scene`；聊天应用自己持有。
- 内置应用按 App Registry 注册；不要求所有平台页面窗口化。
- 服务端增加工作区快照接口；客户端保留本地缓存。
- 旧 `localStorage` 布局不迁移；按新默认布局重建。

## 十四、验收

- 标准、堆叠、分页、悬浮四种状态可以互相转换，窗口实例状态不丢。
- 两个标准容器合并时出现双区域；多窗口容器只能换位。
- 解散按 `lastTiledWidth` 还原，容器消失，焦点跟随。
- 焦点唯一；平铺/悬浮两层独立；悬浮始终在上，按最近聚焦排序。
- 键盘可以完成聚焦、移动、合并、解散、调宽/调高、开关窗口；iframe 内快捷键可达。
- 任务栏按容器分组列出窗口；点击跳转正确；预览用应用元数据。
- 启动台可新建/管理窗口；`+` 复用同一选择器。
- 刷新后整套工作区恢复；空快照不补默认布局。
- 窄屏投影不覆盖桌面宽度和行高。
- 单窗口加载失败不影响其他窗口。

## 十五、未决问题

1. 默认键位的具体映射（Ctrl 三层方向已定，字母别名和冲突回退待定）。
2. License、发布渠道、Node/pnpm/Vite 的具体版本。
3. 任务栏预览元数据的字段、大小上限和是否允许图片。
4. 触摸端长按阈值、拖拽热区、自动滚动速度。
5. 注意提示 payload 的最终形状和未读计数语义。
6. 应用页面与工作区的导航入口（不属于 WM，但与顶部工具栏相关）。
7. 工具栏/任务栏的最终高度和移动端尺寸。
