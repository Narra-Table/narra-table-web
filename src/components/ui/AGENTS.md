# src/components/ui

shadcn 组件目录。通过 `pnpm dlx shadcn@latest add <组件名>` 复制进来，源码归项目所有。
样式必须使用项目 token，**禁止**使用 `dark:` variant 或硬编码颜色。

需要新组件或当前组件不满足需求时，参考官网：

- shadcn 组件库：https://ui.shadcn.com/docs/components

---

## Avatar

`avatar.tsx` — 底层 `@radix-ui/react-avatar`

### 子组件

| 子组件           | 说明                                                |
| ---------------- | --------------------------------------------------- |
| `Avatar`         | 根容器，默认 `size-10 rounded-full overflow-hidden` |
| `AvatarImage`    | 头像图片，加载失败时自动隐藏并显示 Fallback         |
| `AvatarFallback` | 图片加载失败或加载中时的占位内容                    |

### 用法

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
```

**基础**

```tsx
<Avatar>
  <AvatarImage src="/avatar.webp" alt="用户头像" />
  <AvatarFallback>铃</AvatarFallback>
</Avatar>
```

**调整尺寸**（用 `className` 覆盖默认的 `size-10`）

```tsx
<Avatar className="size-6">
  <AvatarImage src={url} alt="..." />
</Avatar>
```

**方形缩略图**（`rounded-thumb` 覆盖默认的 `rounded-full`）

```tsx
<Avatar className="size-10 rounded-thumb">
  <AvatarImage src={url} alt="素材缩略图" />
</Avatar>
```

**加描边**

```tsx
<Avatar className="size-9 ring-1 ring-border">
  <AvatarImage src={url} alt="..." />
</Avatar>
```

**头像堆叠**（无独立 AvatarGroup 组件，直接用 flex 布局）

```tsx
<div className="flex -space-x-1.5">
  {urls.map((src, i) => (
    <Avatar key={i} className="size-6 ring-2 ring-surface">
      <AvatarImage src={src} />
    </Avatar>
  ))}
  {overflow > 0 && (
    <div className="flex size-6 items-center justify-center rounded-full bg-surface-muted text-2xs font-medium text-text-muted ring-2 ring-surface">
      +{overflow}
    </div>
  )}
</div>
```
