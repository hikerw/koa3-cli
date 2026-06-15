# Release Guide

本文档用于记录 Koa3 CLI 的发版流程，目标是让每次发布都能复现、可检查、可回滚。

## 发布前检查

1. 确认当前分支是 `master`，并且工作区干净。

```bash
git status --short --branch
```

2. 安装依赖并确认锁文件可用。

```bash
npm ci
```

3. 检查依赖安全风险。

```bash
npm audit
```

4. 运行自动化测试。

```bash
npm test
```

5. 检查 npm 发布包内容。

```bash
npm pack --dry-run
```

6. 确认 README、CHANGELOG 和文档站内容已经同步。

## 版本更新

根据变更范围选择版本类型：

- `patch`：bug 修复、依赖补丁、文档修正。
- `minor`：新增向后兼容能力，例如新模板、新命令、CI 或工程化能力。
- `major`：不兼容的 CLI、模板结构或运行时行为变更。

更新版本号：

```bash
npm version patch --no-git-tag-version
npm version minor --no-git-tag-version
npm version major --no-git-tag-version
```

如果需要指定版本：

```bash
npm version 1.1.0 --no-git-tag-version
```

版本号更新后，需要同步修改 `CHANGELOG.md`。

## 提交与标签

1. 提交版本变更。

```bash
git add package.json package-lock.json CHANGELOG.md RELEASE.md README.md
git commit -m "chore: release v1.1.0"
```

2. 创建 Git tag。

```bash
git tag v1.1.0
```

3. 推送到 GitHub 和 Gitee。

```bash
git push github master
git push github v1.1.0
git push origin master
git push origin v1.1.0
```

## 发布 npm

发布前再次确认包内容：

```bash
npm pack --dry-run
```

发布到 npm：

```bash
npm publish
```

发布后确认 npm 最新版本：

```bash
npm view koa3-cli version
```

## GitHub Release

在 GitHub 仓库创建 Release：

- Tag：`v1.1.0`
- Title：`v1.1.0`
- Release notes：参考 `CHANGELOG.md` 对应版本内容

建议 release notes 包含：

- 本次新增能力
- 依赖或安全修复
- 迁移说明
- 已知问题

## 发布后验证

1. 使用 npx 创建项目。

```bash
npx koa3-cli create koa3-release-test
cd koa3-release-test
npm install
npm run dev
```

2. 验证基础接口。

```bash
curl http://localhost:3000/api/user
```

3. 验证文档站。

```text
https://hikerw.github.io/koa3-cli/
```

4. 确认 GitHub Actions 和 GitHub Pages 部署均成功。

## 回滚策略

如果 npm 发布后发现严重问题：

1. 立即在 GitHub Release 说明中标记问题。
2. 优先发布修复版，例如 `1.1.1`。
3. 如必须撤回 npm 版本，需谨慎使用：

```bash
npm unpublish koa3-cli@1.1.0
```

注意：npm unpublish 有时间和生态限制，常规情况下更推荐发布修复版本。
