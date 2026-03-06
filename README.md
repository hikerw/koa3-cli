# Koa3 CLI

基于 Koa3 的脚手架项目，提供 CLI 工具快速创建项目。

- 📖 文档地址：https://atwzc.cn/
- 🔗 Gitee 地址：https://gitee.com/wangziwl/koa3-cli

## 安装 CLI 工具

### 全局安装（推荐）

```bash
npm install -g koa3-cli
```

### 使用 npx（无需安装）

```bash
npx koa3-cli create my-project
```

## 使用 CLI 创建项目

```bash
# 创建新项目
koa3-cli create my-project

# 进入项目目录
cd my-project

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 项目结构

```
koa3-cli/
├── app/                    # 应用代码目录
│   ├── controller/        # 控制器目录
│   │   ├── home.js        # 首页控制器
│   │   └── user.js        # 用户控制器
│   ├── service/           # 服务层目录
│   │   └── user.js        # 用户服务
│   ├── model/             # 数据模型目录
│   │   └── user.js        # 用户模型
│   ├── middleware/        # 中间件目录
│   │   ├── index.js       # 中间件入口
│   │   ├── auth.js        # 认证中间件示例
│   │   └── requestLogger.js # 请求日志中间件
│   ├── lib/               # 基础能力目录
│   │   └── logger.js      # 日志工具
│   └── router.js          # 路由配置
├── config/                # 配置文件目录
│   ├── config.default.js  # 默认配置
│   ├── config.local.js    # 本地开发配置
│   └── config.prod.js     # 生产环境配置
├── logs/                  # 日志输出目录（运行时自动创建）
├── public/                # 静态资源目录
│   └── index.html         # 首页
├── app.js                 # 应用入口文件
├── package.json           # 项目配置
└── README.md             # 项目说明
```

## 特性

- ✅ 基于 Koa3，轻量高效
- ✅ CLI 工具，一键创建项目
- ✅ 项目结构，清晰规范
- ✅ 支持多环境配置（development/production）
- ✅ MVC 架构（Controller/Service/Model）
- ✅ 中间件支持
- ✅ 统一的错误处理
- ✅ 内置日志系统（访问日志、错误日志、请求追踪）
- ✅ RESTful API 示例

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动项目

开发环境（使用 nodemon 自动重启）：
```bash
npm run dev
```

生产环境：
```bash
npm start
```

### 访问应用

- 首页: http://localhost:3000
- API 示例: http://localhost:3000/api/user
- 文档: http://localhost:3000/index.html

## 环境配置

项目支持多环境配置，通过 `NODE_ENV` 环境变量控制：

- `development` 或 `local`: 加载 `config.local.js`
- `production`: 加载 `config.prod.js`
- 默认: 加载 `config.default.js`

可以通过 `.env` 文件配置环境变量（参考 `.env.example`）。

### 日志配置

日志系统默认开启控制台和文件输出，支持 4 个级别：`debug`、`info`、`warn`、`error`。

`.env` 可配置项：

```bash
LOG_LEVEL=info
LOG_DIR=logs
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
```

运行后会在日志目录按天生成文件：

- `<date>.log`：通用应用日志
- `<date>.access.log`：请求访问日志（JSON 行格式）
- `<date>.error.log`：错误级别日志

请求日志中间件会自动处理 `x-request-id`：

- 如果请求头带有 `x-request-id`，服务端会透传并写入日志
- 如果没有，服务端会自动生成并在响应头返回
- 出错日志会带上 `requestId`，便于串联排查

## API 示例

### 获取用户列表
```bash
GET /api/user
```

### 获取用户详情
```bash
GET /api/user/:id
```

### 创建用户
```bash
POST /api/user
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com"
}
```

### 更新用户
```bash
PUT /api/user/:id
Content-Type: application/json

{
  "name": "李四",
  "email": "lisi@example.com"
}
```

### 删除用户
```bash
DELETE /api/user/:id
```

## 开发指南

### 添加新的控制器

1. 在 `app/controller/` 目录下创建控制器文件
2. 在 `app/router.js` 中注册路由

示例：
```javascript
// app/controller/product.js
class ProductController {
  async list(ctx) {
    ctx.body = await productService.getList();
  }
}
module.exports = new ProductController();

// app/router.js
const productController = require('./controller/product');
router.get('/api/product', productController.list);
```

### 添加新的服务

在 `app/service/` 目录下创建服务文件，处理业务逻辑。

### 添加新的模型

在 `app/model/` 目录下创建模型文件，处理数据访问。

### 添加中间件

在 `app/middleware/` 目录下创建中间件文件，然后在 `app/middleware/index.js` 中引入使用。

## 技术栈

- **Koa3**: Web 框架
- **@koa/router**: 路由
- **koa-bodyparser**: 请求体解析
- **koa-static**: 静态资源服务
- **koa-views**: 模板引擎支持
- **dotenv**: 环境变量管理

## 许可证

MIT
