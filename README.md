# Kindergarten Management System

幼儿园综合管理平台，包含 Rails API 后端和 React/Vite 前端，并集成儿童学习、教学视频、成长记录、家长沟通及家园育儿建议等功能。

## 项目结构

- `kindergarten-management-system-backend/`：Ruby on Rails API、SQLite 数据库、后台任务和测试
- `kindergarten-management-system-frontend/`：React/Vite 前端应用
- `child_dev2/`：独立的管理侧应用 Git 子模块
- `docker-compose.yml`：本地容器化开发配置（不包含任何真实凭据）

## 开始使用

先初始化子模块：

```bash
git submodule update --init --recursive
```

复制示例环境文件并按本地环境填写配置。不要提交 `.env` 或任何包含真实密钥、密码、账号和令牌的文件：

```bash
cp .env.example .env
cp kindergarten-management-system-frontend/.env.example kindergarten-management-system-frontend/.env
```

### Docker Compose

已安装 Docker Compose 时，可直接启动前后端：

```bash
docker compose up --build
```

默认前端地址为 `http://localhost:4000`，后端地址为 `http://localhost:3000`。端口可以通过 `.env` 中的 `FRONTEND_HOST_PORT` 和 `BACKEND_HOST_PORT` 调整。

### 本地运行

后端：

```bash
cd kindergarten-management-system-backend
bundle install
bin/rails db:prepare
bin/rails server -b 127.0.0.1 -p 3000
```

前端：

```bash
cd kindergarten-management-system-frontend
npm install
npm start
```

## 测试

后端使用 Rails/Minitest：

```bash
cd kindergarten-management-system-backend
bin/rails test
```

前端测试和构建命令以 `package.json` 为准：

```bash
cd kindergarten-management-system-frontend
npm test
npm run build
```

## 安全说明

环境变量示例只提供配置项名称。真实 API 密钥、SMTP 凭据、JWT 密钥、数据库文件、运行日志、账号清单和部署归档均应保留在本地或部署环境中，并由 `.gitignore` 排除。
