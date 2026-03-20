# 私人助理

这个仓库现在分成两部分：

1. 根目录保留当前已经上线的静态 PWA 原型，用来继续给家人访问和安装。
2. `apps/`、`packages/`、`infra/` 下开始搭真正的前后端分离产品骨架。

## 当前仓库结构

- `index.html` 等根目录静态文件：现有 PWA 原型
- `apps/web`: 用户端前端骨架
- `apps/api`: 后端 API 骨架
- `packages/shared`: 共享常量和前后端共用数据
- `infra`: 本地和生产部署编排
- `docs/architecture.md`: 架构说明

## 本地开发规划

后续本地开发统一按 monorepo 方式进行：

```text
apps/web      前端
apps/api      后端
packages/*    共享包
infra/*       部署配置
```

建议本机补齐：

- Node.js 22
- pnpm 10
- Docker Desktop 或等价容器环境

工作区依赖安装：

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
pnpm install
```

## 环境变量

根目录示例：

```bash
cp .env.example .env
```

API 示例：

```bash
cp apps/api/.env.example apps/api/.env
```

如果本地开发直接使用腾讯云上的 PostgreSQL，请改用：

```bash
cp apps/api/.env.tunnel.example apps/api/.env
```

然后把 `DATABASE_URL` 里的密码替换成当前服务器数据库密码。

## 现有 PWA 原型

根目录静态页仍然可直接用 Python 启：

```bash
python3 -m http.server 8080
```

用于快速验证：

- 手机安装到桌面
- 家庭成员访问入口
- 现有品牌与图标

## 服务器规划

腾讯云服务器已经按这个方向初始化：

- Ubuntu 24.04
- Docker
- Docker Compose
- UFW
- Fail2ban
- `/srv/private-assistant` 部署目录

后续正式部署走 Git + 容器镜像/构建物，不在服务器上直接开发。

## 本地连接云数据库

开发时推荐通过 SSH 隧道连云上的 PostgreSQL，而不是直接开放公网数据库端口：

```bash
bash scripts/dev-db-tunnel.sh
```

隧道建立后，本地访问地址就是：

```text
127.0.0.1:5433
```

## 当前认证开发默认值

- 管理员账号：`owner`
- 管理员密码：`ChangeMe123!`
- 邀请码：`FAMILY-ACCESS`

## 当前本地启动方式

先开数据库隧道：

```bash
bash scripts/dev-db-tunnel.sh
```

再开 API：

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
pnpm --filter @private-assistant/api dev
```

再开 Web：

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
pnpm --filter @private-assistant/web dev
```
