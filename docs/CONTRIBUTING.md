# 贡献和验证流程

## 环境准备

安装 Vite+ CLI：

macOS / Linux：

```bash
curl -fsSL https://vite.plus | bash
```

Windows：

```powershell
irm https://vite.plus/ps1 | iex
```

## 开始开发

```bash
vp install
vp dev
```

## 提交前检查

提交前至少执行：

```bash
vp check --fix
vp test
```

涉及构建配置、路由、入口文件或依赖变更时，再执行：

```bash
vp build
```

## Git Hooks

项目使用 `.vite-hooks/pre-commit`，提交时会自动执行：

```bash
vp staged
```

如果检查失败，提交会被阻止。修复问题后重新提交即可。

## 提交建议

- 每次提交聚焦一个明确改动。
- 不要提交 `.env`、`dist/`、本地调试文件。
- 提交信息建议使用 `<type>: <summary>` 格式，`<type>` 例如 `feat:`、`fix:`、`docs:`、`test:`、`chore:` 等。
