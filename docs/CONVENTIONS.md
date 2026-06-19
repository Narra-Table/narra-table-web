# 代码约定

## 添加 shadcn UI 组件

```bash
pnpm dlx shadcn@latest add <组件名>
```

组件会被复制到 `src/components/ui/`，源码归项目所有，可以随意修改。

### 添加后必须检查样式

shadcn 组件默认使用自己的 token，添加后需要将硬编码颜色替换为项目 `docs/DESIGN.md` 中定义的语义 token
