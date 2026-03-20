# 私人助理架构草案

## 目标

- 面向家庭场景的私人助理 Web 产品
- 前后端分离，本地开发，Git 管理
- 第一阶段完成认证、用户管理、工具中心

## 仓库结构

- `apps/web`: 前端，建议用 Next.js 负责页面和用户端交互
- `apps/api`: 后端，建议用 Fastify 提供认证和工具 API
- `packages/shared`: 共享常量、类型、前后端共用配置
- `infra`: 本地和生产部署编排
- 根目录静态文件：保留为当前已上线 PWA 原型

## 第一阶段模块

- 认证
  - 登录
  - 邀请注册
  - 刷新令牌
  - 当前用户
- 用户管理
  - 家庭成员列表
  - 角色和状态
- 工具中心
  - 家庭常用工具聚合页
  - 收藏和排序
- 审计
  - 登录与关键操作日志

## 部署策略

- 本地开发
  - 前端和后端在本机启动
  - PostgreSQL 用 `infra/docker-compose.dev.yml`
- 服务器
  - Ubuntu 24.04
  - Docker + Docker Compose
  - `/srv/private-assistant` 作为统一部署目录

## 后续优先级

1. 真正安装 Node.js 与 pnpm，拉起 monorepo
2. 接 PostgreSQL 和 Prisma migration
3. 接登录注册真实接口
4. 前端接登录页和受保护路由
5. 做首批家庭工具
