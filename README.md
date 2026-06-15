# Koa3 CLI

[![npm version](https://img.shields.io/npm/v/koa3-cli.svg)](https://www.npmjs.com/package/koa3-cli)
[![CI](https://github.com/hikerw/koa3-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/hikerw/koa3-cli/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/koa3-cli.svg)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-339933.svg)](https://nodejs.org/)

面向 Koa 3 的现代 Node.js API 项目脚手架。它不是只复制一个空目录，而是把后端项目常见的分层结构、环境配置、日志、错误处理、参数校验和 RESTful 示例先搭好，让你可以更快进入业务开发。

- 文档地址：https://hikerw.github.io/koa3-cli/
- GitHub：https://github.com/hikerw/koa3-cli
- Gitee：https://gitee.com/wangziwl/koa3-cli
- npm：https://www.npmjs.com/package/koa3-cli

## 为什么选择 Koa3 CLI

- 基于 Koa 3，适合需要轻量、清晰、可控的 Node.js API 服务。
- 内置 Controller / Service / Model 分层，避免新项目从第一天就把逻辑堆在路由里。
- 内置多环境配置，支持 `development`、`local`、`production` 差异化加载。
- 内置请求日志、错误日志和 `x-request-id`，方便定位线上问题。
- 内置 Joi 参数校验示例，校验失败统一返回 422。
- 内置全局错误处理和 404 处理，接口响应行为更一致。
- 提供 CLI，一条命令创建可运行项目。

## 30 秒快速开始

```bash
npx koa3-cli create my-api
cd my-api
npm install
npm run dev
```

启动后访问：

- 首页：http://localhost:3000
- API 示例：http://localhost:3000/api/user
- 本地文档：http://localhost:3000/index.html

也可以全局安装：

```bash
npm install -g koa3-cli
koa3-cli create my-api
```

## 当前能力

| 能力 | 说明 |
| --- | --- |
| Koa 3 | 使用 Koa 3 作为核心 Web 框架 |
| 路由 | 使用 `@koa/router` 管理 API 路由 |
| 分层结构 | 默认拆分 `controller`、`service`、`model`、`middleware`、`lib` |
| 环境配置 | 通过 `config.default.js`、`config.local.js`、`config.prod.js` 管理环境差异 |
| 日志 | 支持控制台日志、文件日志、访问日志、错误日志 |
| 请求追踪 | 自动生成或透传 `x-request-id` |
| CORS | 使用 `@koa/cors`，默认关闭，可通过配置显式开启 |
| 参数校验 | 使用 Joi 校验 `body`、`query`、`params` |
| 错误处理 | 统一处理业务异常、校验异常和未知异常 |
| 静态资源 | 内置 `public` 静态目录和文档页 |
| 自动化测试 | 使用 `node:test` 覆盖 CLI 创建项目关键路径 |
| CI | 使用 GitHub Actions 自动运行测试和 npm 打包检查 |

## 项目结构

```text
koa3-cli/
├── app/                       # 应用代码目录
│   ├── controller/            # 控制器：处理请求输入输出
│   │   ├── home.js
│   │   └── user.js
│   ├── service/               # 服务层：承载业务逻辑
│   │   └── user.js
│   ├── model/                 # 模型层：描述数据结构或数据访问
│   │   └── user.js
│   ├── middleware/            # 中间件
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── index.js
│   │   ├── notFound.js
│   │   └── requestLogger.js
│   ├── lib/                   # 基础工具
│   │   ├── logger.js
│   │   └── validator.js
│   ├── processEvents.js       # 进程异常事件处理
│   ├── router.js              # 路由入口
│   └── setup.js               # 应用装配入口
├── config/                    # 多环境配置
│   ├── config.default.js
│   ├── config.local.js
│   ├── config.prod.js
│   └── loader.js
├── public/                    # 静态资源和本地文档
├── bin/cli.js                 # CLI 入口
├── app.js                     # 应用启动入口
├── env.example                # 环境变量示例
└── package.json
```

## 常用命令

```bash
# 启动开发环境
npm run dev

# 启动生产环境
npm start

# 查看 CLI 帮助
npx koa3-cli --help

# 查看 CLI 版本
npx koa3-cli --version
```

## 环境配置

项目通过 `NODE_ENV` 控制配置加载：

- `development` 或 `local`：加载 `config.local.js`
- `production`：加载 `config.prod.js`
- 其他情况：加载 `config.default.js`

可以复制 `env.example` 为 `.env` 后按需修改：

```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
LOG_DIR=logs
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
CORS_ENABLE=false
CORS_ORIGIN=*
```

## 日志与请求追踪

日志系统默认支持 4 个级别：`debug`、`info`、`warn`、`error`。运行后会在日志目录按天生成文件：

- `<date>.log`：应用日志
- `<date>.access.log`：访问日志，采用 JSON 行格式
- `<date>.error.log`：错误日志

请求日志中间件会处理 `x-request-id`：

- 请求头已有 `x-request-id` 时，服务端会透传并写入日志。
- 请求头没有 `x-request-id` 时，服务端会自动生成并写入响应头。
- 错误日志会带上 `requestId`，方便串联一次请求的完整链路。

## 参数校验

项目内置 `app/lib/validator.js`，提供两种使用方式：

```javascript
const { Joi, validate, validateValue } = require('../lib/validator');
```

### 在路由中使用中间件

```javascript
const { validate, Joi } = require('./lib/validator');

const createUserBody = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().allow('').optional()
});

router.post('/api/user', validate({ body: createUserBody }), userController.create);
```

校验通过后，结果会挂到 `ctx.state.validated`：

- `ctx.state.validated.body`
- `ctx.state.validated.query`
- `ctx.state.validated.params`

### 在控制器中校验单个对象

当前用户示例在 `app/controller/user.js` 中使用 `validateValue()`，适合把校验规则放在控制器附近，便于小项目快速阅读和维护。

```javascript
const userData = await validateValue(createUserBodySchema, ctx.request.body);
```

校验失败时会返回 422：

```json
{
  "success": false,
  "message": "用户名为必填",
  "errors": [
    {
      "field": "name",
      "message": "用户名为必填"
    }
  ]
}
```

## API 示例

```bash
# 获取用户列表
GET /api/user

# 获取用户详情
GET /api/user/:id

# 创建用户
POST /api/user
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "age": 18
}

# 更新用户
PUT /api/user/:id
Content-Type: application/json

{
  "name": "李四"
}

# 删除用户
DELETE /api/user/:id
```

## 分支说明

- `master`：稳定的 Koa 3 API 脚手架，适合作为 npm 默认模板和开源首屏展示。
- `admin`：后台管理方向的功能分支，包含登录鉴权、菜单、角色、权限、素材管理、系统配置和 Vue 管理端等能力，适合继续打磨成进阶模板。

## 后续路线

- 扩展 CLI 创建项目后的启动测试和接口冒烟测试。
- 增加 TypeScript 模板。
- 将 `admin` 分支能力整理为可选模板，例如 `koa3-cli create my-api --template admin`。
- 增加 `add controller/service/route` 等代码生成命令。

## 许可证

[MIT](./LICENSE)
