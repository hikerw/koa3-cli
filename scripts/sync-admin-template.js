#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const templateDir = path.join(repoRoot, 'templates', 'admin');

/**
 * admin 分支中需要同步到 CLI 模板的顶层文件和目录。
 * 这里保持白名单，是为了避免把开发分支里的临时文件、发布产物或本地配置误带进 npm 包。
 */
const SYNC_ENTRIES = [
  '.gitignore',
  '.npmignore',
  'LICENSE',
  'README.md',
  'app',
  'app.js',
  'client',
  'config',
  'env.example',
  'package-lock.json',
  'package.json',
  'public',
  'scripts'
];

/**
 * 这些目录和文件只服务本地开发或构建结果，进入模板后会污染新项目。
 * .env.example 是对外配置示例，需要保留，所以不能简单按 .env* 全量忽略。
 */
const EXCLUDED_NAMES = new Set([
  '.git',
  '.idea',
  '.vscode',
  'build',
  'coverage',
  'dist',
  'logs',
  'node_modules',
  'release-dist',
  'release-temp',
  'temp',
  'tmp'
]);

const EXCLUDED_FILE_PATTERNS = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\..*\.local$/,
  /^npm-debug\.log.*$/,
  /^yarn-debug\.log.*$/,
  /^yarn-error\.log.*$/,
  /^.*\.log$/,
  /^.*\.tgz$/
];

function runGit(args, options = {}) {
  const output = execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe']
  });

  return typeof output === 'string' ? output.trim() : '';
}

function ensureOnMasterBranch() {
  const currentBranch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (currentBranch !== 'master') {
    throw new Error(`请先切换到 master 分支再同步模板，当前分支是 ${currentBranch}`);
  }
}

function ensureAdminBranchExists() {
  runGit(['rev-parse', '--verify', 'admin'], { stdio: 'ignore' });
}

function ensureTemplateClean() {
  const status = runGit(['status', '--porcelain', '--', 'templates/admin']);
  if (status) {
    throw new Error('templates/admin 存在未提交改动。请先提交或处理后再同步，避免覆盖你的本地修改。');
  }
}

function shouldCopy(sourcePath) {
  const name = path.basename(sourcePath);
  if (EXCLUDED_NAMES.has(name)) return false;
  return !EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(name));
}

function copyEntry(sourceRoot, entry) {
  const sourcePath = path.join(sourceRoot, entry);
  const targetPath = path.join(templateDir, entry);
  if (!fs.existsSync(sourcePath)) return;

  fs.rmSync(targetPath, { recursive: true, force: true });
  fs.cpSync(sourcePath, targetPath, {
    recursive: true,
    force: true,
    filter: shouldCopy
  });
}

function createTemplateDotfileBackup(fileName, templateFileName) {
  const sourcePath = path.join(templateDir, fileName);
  const targetPath = path.join(templateDir, templateFileName);
  if (!fs.existsSync(sourcePath)) return;

  /**
   * npm 打包时嵌套 .gitignore/.npmignore 容易触发忽略规则。
   * CLI 创建项目时会把这些 template 文件还原成真正的点文件。
   */
  fs.copyFileSync(sourcePath, targetPath);
}

function syncFromAdminWorktree(worktreeDir) {
  fs.mkdirSync(templateDir, { recursive: true });

  for (const entry of SYNC_ENTRIES) {
    copyEntry(worktreeDir, entry);
  }

  createTemplateDotfileBackup('.gitignore', 'gitignore.template');
  createTemplateDotfileBackup('.npmignore', 'npmignore.template');
}

function removeWorktree(worktreeDir) {
  try {
    runGit(['worktree', 'remove', '--force', worktreeDir], { stdio: 'ignore' });
  } catch (_) {
    fs.rmSync(worktreeDir, { recursive: true, force: true });
  }
}

function main() {
  const worktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'koa3-admin-template-'));

  try {
    ensureOnMasterBranch();
    ensureAdminBranchExists();
    ensureTemplateClean();

    runGit(['worktree', 'add', '--detach', worktreeDir, 'admin'], { stdio: 'ignore' });
    syncFromAdminWorktree(worktreeDir);

    console.log('✅ 已从 admin 分支同步到 templates/admin');
    console.log('建议继续执行: npm test && npm pack --dry-run');
  } finally {
    removeWorktree(worktreeDir);
  }
}

main();
