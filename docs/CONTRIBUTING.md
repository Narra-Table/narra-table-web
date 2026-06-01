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

## 提交

推荐使用终端进行交互，以获得更好的提交日志高亮：

进入项目根目录：

```bash
cd narra-table-web
```

暂存改动：

```bash
git add .
```

如果只想暂存部分文件，可以使用：

```bash
git add <files>
```

提交：

```bash
git commit -m "<type>: <summary>"
```

推送：

```bash
git push
```

## Git Hooks

项目配置了 `.vite-hooks/pre-commit`，提交时会自动执行：

```bash
vp staged
```

项目配置了 `.vite-hooks/commit-msg`，提交时会自动执行：

```bash
commitlint --edit "$1"
```

任一检查失败，提交都会被阻止。

如果是代码问题，修复问题后重新提交即可。

如果是提交格式问题，请更改提交信息格式。

## 提交建议

- 每次提交聚焦一个明确改动。
- 不要提交 `.env`、`dist/`、本地调试文件。
- 提交信息格式参考 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)。
