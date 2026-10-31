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
cp .env.example .env.development
vp dev
```

未配置本地环境变量且没有启动后端时，开发服务器会提示启用 MSW Mock 的复制命令。

宿主机的 inotify 监听器不足时，用轮询启动：

```bash
VITE_WATCH_POLL=1 vp dev
```

## 同步后端接口

从对应后端版本生成 Swagger，再生成前端 API 和 Mock：

```bash
# backend 目录
make swagger-gen
# web 目录
NARRATABLE_OPENAPI=../backend/docs/swagger.json pnpm generate
```

`NARRATABLE_OPENAPI` 接受本地文件或 Swagger URL；省略时使用线上文档。客户端和 Mock 必须从同一份 Swagger 生成，不手工修改生成文件。

- 管理 API 使用独立的 `adminFetch` 和管理会话，不刷新普通用户 token。
- `BotInvocation` 使用 `invocationFetch`，调用者通过 `Authorization: Bearer <invocationToken>` 传入调用令牌；401 不刷新或清除用户、管理员会话。
- 文件接口使用 `orvalBlobFetch`，成功响应保留原始字节和 MIME 类型，错误响应按 JSON 解析。插件资源 Mock 支持多级路径。
- 后端 `.swaggo` 将任意 `json.RawMessage` 映射为无类型约束的 JSON schema，前端生成 `unknown`；显式对象约束继续保留。

同步后运行 `vp test --run`、`pnpm exec tsc --noEmit` 和 `pnpm build`。`src/lib` 的请求测试与 `src/mocks/apiContracts.test.ts` 覆盖认证隔离、二进制响应、任意 JSON 和嵌套资源路径；后端 `go test ./docs ./pkg/protocol` 检查 Swagger 与序列化契约。

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
