# NarraTable Web

TRPG 协作叙事平台「故桌（NarraTable）」的 Web 端。

## 快速开始

安装 Vite+ CLI

macOS / Linux：

```bash
curl -fsSL https://vite.plus | bash
```

Windows：

```powershell
irm https://vite.plus/ps1 | iex
```

验证是否安装成功

```bash
vp --version
```

从 github 上克隆本项目

```bash
git clone git@github.com:Narra-Table/narra-table-web.git
```

切换到项目目录

```bash
cd narra-table-web
```

安装依赖

```bash
vp install
```

配置环境变量

macOS / Linux：

```bash
cp .env.example .env.development
```

Windows：

```powershell
copy .env.example .env.development
```

复制完成后，`.env.development` 中的 `VITE_MOCK=true` 会启用 MSW mock 数据。
如果没有本地环境变量文件，开发服务器会在终端提示复制命令；此时未启动真实后端会出现代理连接失败。

启动开发服务器

```bash
vp dev
```
