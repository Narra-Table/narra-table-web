# 代码约定

## 模块与文件命名

- 业务能力放在 `features/<name>`，跨 Feature 的基础设施和无业务工具放在 `lib`。
- `lib` 保持平铺，不为单个文件创建分类目录；同类文件使用共同前缀，例如 `authSession.ts` 和 `authSession.test.ts`。
- 文件名必须表达具体职责，禁止使用 `utils.ts`、`helpers.ts`、`common.ts` 等宽泛名称。
- Feature 外部只能从该 Feature 的 `index.ts` 导入，Feature 内部使用相对路径。
- Hook 默认与所属 Feature 共置；跨 Feature 复用且不包含业务语义时，使用 `use` 前缀放入 `lib`。

## 添加 shadcn UI 组件

```bash
pnpm dlx shadcn@latest add <组件名>
```

组件会被复制到 `src/components/ui/`，源码归项目所有，可以随意修改。

### 添加后必须检查样式

shadcn 组件默认使用自己的 token，添加后需要将硬编码颜色替换为项目 `docs/DESIGN.md` 中定义的语义 token
