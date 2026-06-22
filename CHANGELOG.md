# Changelog

所有重要变更都会记录在这里。

本项目遵循语义化版本思路：

- `MAJOR`：包含不兼容的 CLI、模板或运行时行为变更。
- `MINOR`：新增向后兼容的能力、模板或工程化设施。
- `PATCH`：修复问题、依赖补丁、安全修复和文档修正。

## 1.1.0 - 2026-06-15

### Added

- 新增 `admin` 后台管理模板，可通过 `koa3-cli create my-admin --template admin` 创建。
- 新增 GitHub Pages 文档部署流程，使用 `public/` 目录作为静态文档源。
- 新增 GitHub Actions CI，覆盖 Node.js `20.18.1` 和 `24`。
- 新增 CLI 创建项目的自动化测试，验证版本输出、项目目录、关键文件和生成后的 `package.json`。
- 新增 CORS 配置能力，使用 `@koa/cors`，默认关闭并可通过环境变量开启。
- 新增 npm 发布白名单，控制发布包内容，避免临时目录和构建产物混入。
- 新增 `npm run sync:admin-template`，用于将 `admin` 分支同步到 `--template admin` 模板目录。

### Changed

- CLI 创建流程支持 `--template` / `-t` 参数，并会根据模板输出对应的安装步骤。
- 将主仓库地址切换为 GitHub，并在 README 首屏补充 npm、CI、License、Node.js badge。
- 重写 README 首屏定位、快速开始、能力表、分支说明和路线图。
- 将 `koa-cors` 替换为维护更明确的 `@koa/cors`。
- 升级核心依赖：`koa`、`@koa/router`、`dotenv`、`joi`。
- 修复 `package-lock.json` 与 Node.js 24 / 新版 npm 的兼容问题。

### Fixed

- 修复 GitHub Pages 子路径部署时 CSS / JS 资源路径失效的问题。
- 修复 npm 发布包包含 `release-temp/`、`release-dist/` 的问题。
- 修复依赖安全风险，`npm audit` 当前为 0 vulnerabilities。
- 修复 `package-lock.json` 根版本和 `package.json` 版本不一致的问题。

### Branches

- `admin` 分支已同步依赖安全治理。
- `admin` 分支服务端和客户端 audit 均已清零。
- `admin` 分支客户端升级到 Vite 8，并通过生产构建验证。

## 1.0.9 - 2026-06-08

### Changed

- 维护 Koa3 CLI 基础脚手架能力。
- 包含 Koa 3、MVC 分层、多环境配置、日志、参数校验、错误处理和 RESTful 示例。
