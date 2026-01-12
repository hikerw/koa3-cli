# Koa3 CLI 使用说明

## 安装

### 全局安装

```bash
npm install -g koa3-cli
```

安装后，可以在任何地方使用 `koa3-cli` 命令。

### 使用 npx（无需安装）

```bash
npx koa3-cli create my-project
```

## 命令

### 创建项目

```bash
koa3-cli create <project-name>
```

**示例：**

```bash
koa3-cli create my-app
```

这会在当前目录下创建一个名为 `my-app` 的新项目。

### 查看帮助

```bash
koa3-cli --help
# 或
koa3-cli help
```

### 查看版本

```bash
koa3-cli --version
# 或
koa3-cli version
```

## 创建项目后的步骤

1. 进入项目目录：
   ```bash
   cd my-app
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

4. 访问应用：
   - 首页: http://localhost:3000
   - API 示例: http://localhost:3000/api/user
   - 文档: http://localhost:3000/index.html

## 项目结构

创建的项目包含以下结构：

```
my-app/
├── app/                    # 应用代码目录
│   ├── controller/        # 控制器目录
│   ├── service/           # 服务层目录
│   ├── model/             # 数据模型目录
│   ├── middleware/        # 中间件目录
│   └── router.js          # 路由配置
├── config/                # 配置文件目录
├── public/                # 静态资源目录
├── app.js                 # 应用入口文件
├── package.json           # 项目配置
└── README.md             # 项目说明
```

## 注意事项

- 项目名称不能包含空格和特殊字符
- 如果目录已存在，CLI 会提示错误
- 创建的项目会自动配置好所有必要的文件和目录结构
