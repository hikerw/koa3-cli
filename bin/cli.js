#!/usr/bin/env node

/**
 * Koa3 CLI 工具
 * 用于快速创建 Koa3 项目
 */

const fs = require('fs');
const path = require('path');

// 获取命令行参数
const args = process.argv.slice(2);
const command = args[0];
const projectName = args[1];

const rootDir = path.join(__dirname, '..');

const DEFAULT_TEMPLATE_FILES = [
  'app',
  'config',
  'public',
  'app.js',
  'env.example',
  'README.md',
  'LICENSE',
  '.gitignore',
  '.npmignore'
];

const ADMIN_TEMPLATE_FILES = [
  'app',
  'client',
  'config',
  'public',
  'scripts',
  'app.js',
  'env.example',
  'README.md',
  'LICENSE',
  '.gitignore',
  '.npmignore',
  'package.json',
  'package-lock.json'
];

const TEMPLATE_CONFIG = {
  default: {
    name: 'default',
    displayName: '基础 API 模板',
    sourceDir: rootDir,
    files: DEFAULT_TEMPLATE_FILES,
    description(projectName) {
      return `基于 Koa3 的 ${projectName} 项目`;
    },
    nextSteps(projectName) {
      return [
        `cd ${projectName}`,
        'npm install',
        'npm run dev'
      ];
    }
  },
  admin: {
    name: 'admin',
    displayName: '后台管理模板',
    sourceDir: path.join(rootDir, 'templates', 'admin'),
    files: ADMIN_TEMPLATE_FILES,
    renameFiles: [
      { source: 'gitignore.template', target: '.gitignore' },
      { source: 'npmignore.template', target: '.npmignore' }
    ],
    description(projectName) {
      return `基于 Koa3 的 ${projectName} 后台管理项目`;
    },
    nextSteps(projectName) {
      return [
        `cd ${projectName}`,
        'npm install',
        'npm --prefix client install',
        'npm run dev'
      ];
    }
  }
};

// 显示帮助信息
function showHelp() {
  console.log(`
Koa3 CLI - 快速创建 Koa3 项目脚手架

用法:
  koa3-cli create <project-name>  创建新项目
  koa3-cli create <project-name> --template admin  创建后台管理项目

示例:
  koa3-cli create my-app
  koa3-cli create my-admin --template admin

可用模板:
  default  基础 API 模板
  admin    后台管理模板（服务端 + Vue 管理端）

更多信息: https://github.com/hikerw/koa3-cli
`);
}

// 显示版本信息
function showVersion() {
  const pkg = require('../package.json');
  console.log(`koa3-cli v${pkg.version}`);
}

// 复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      // 跳过不需要的文件
      if (shouldSkipFile(entry.name)) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 解析 create 命令参数，集中处理 --template / -t，便于后续继续扩展更多模板选项。
function parseCreateOptions(commandArgs) {
  const options = {
    template: 'default'
  };

  for (let index = 0; index < commandArgs.length; index += 1) {
    const arg = commandArgs[index];

    if (arg === '--template' || arg === '-t') {
      options.template = commandArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg && arg.startsWith('--template=')) {
      options.template = arg.split('=')[1];
    }
  }

  return options;
}

function getTemplateConfig(templateName) {
  const config = TEMPLATE_CONFIG[templateName || 'default'];
  if (!config) {
    const templateNames = Object.keys(TEMPLATE_CONFIG).join(', ');
    throw new Error(`未知模板 "${templateName}"，可用模板: ${templateNames}`);
  }

  if (!fs.existsSync(config.sourceDir)) {
    throw new Error(`模板目录不存在: ${config.sourceDir}`);
  }

  return config;
}

// 判断是否跳过文件
function shouldSkipFile(filename) {
  const exactSkipFiles = [
    'node_modules',
    '.git',
    '.DS_Store',
    '.env',
    '.env.local',
    'logs',
    'coverage',
    '.nyc_output',
    'dist',
    'build',
    'tmp',
    'temp',
    'release-dist',
    'release-temp'
  ];

  const patternSkipFiles = [
    /^\.env\..*\.local$/,
    /^npm-debug\.log/,
    /^yarn-debug\.log/,
    /^yarn-error\.log/
  ];
  
  return exactSkipFiles.includes(filename) || patternSkipFiles.some(pattern => pattern.test(filename));
}

/**
 * 移除脚手架自身字段，避免生成后的业务项目继续暴露 CLI 或 npm 发布配置。
 * @param {Object} packageJson package.json 内容
 * @returns {Object} 清理后的 package.json 内容
 */
function sanitizeGeneratedPackageJson(packageJson) {
  delete packageJson.bin;
  delete packageJson.files;
  delete packageJson.preferGlobal;
  delete packageJson.repository;
  delete packageJson.bugs;
  delete packageJson.homepage;

  return packageJson;
}

// 更新 package.json
function updatePackageJson(projectPath, projectName, templateConfig) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    : require('../package.json');
  
  packageJson.name = projectName;
  packageJson.version = '1.0.0';
  packageJson.description = templateConfig.description(projectName);
  
  sanitizeGeneratedPackageJson(packageJson);
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

// 更新 package-lock.json 根项，保证复制模板后锁文件与新项目 package.json 保持一致。
function updatePackageLock(projectPath, projectName) {
  const packageLockPath = path.join(projectPath, 'package-lock.json');
  if (!fs.existsSync(packageLockPath)) {
    return;
  }

  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
  packageLock.name = projectName;
  packageLock.version = '1.0.0';

  if (packageLock.packages && packageLock.packages['']) {
    packageLock.packages[''].name = projectName;
    packageLock.packages[''].version = '1.0.0';
    delete packageLock.packages[''].bin;
  }

  fs.writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2) + '\n');
}

function copyEnvExample(projectPath, relativeExamplePath, relativeTargetPath) {
  const examplePath = path.join(projectPath, relativeExamplePath);
  const targetPath = path.join(projectPath, relativeTargetPath);

  if (fs.existsSync(examplePath) && !fs.existsSync(targetPath)) {
    fs.copyFileSync(examplePath, targetPath);
  }
}

function copyRenamedTemplateFiles(projectPath, templateConfig) {
  const renameFiles = templateConfig.renameFiles || [];

  for (const file of renameFiles) {
    const srcPath = path.join(templateConfig.sourceDir, file.source);
    const destPath = path.join(projectPath, file.target);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 创建项目
function createProject(projectName, options = {}) {
  if (!projectName) {
    console.error('❌ 错误: 请提供项目名称');
    console.log('\n用法: koa3-cli create <project-name>');
    process.exit(1);
  }

  let templateConfig;
  try {
    templateConfig = getTemplateConfig(options.template);
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }

  const currentDir = process.cwd();
  const projectPath = path.join(currentDir, projectName);

  // 检查项目目录是否已存在
  if (fs.existsSync(projectPath)) {
    console.error(`❌ 错误: 目录 "${projectName}" 已存在`);
    process.exit(1);
  }

  console.log(`🚀 正在创建项目: ${projectName}`);
  console.log(`📦 使用模板: ${templateConfig.displayName}\n`);

  try {
    // 创建项目目录
    fs.mkdirSync(projectPath, { recursive: true });

    // 复制模板文件
    console.log('📁 复制项目文件...');

    for (const file of templateConfig.files) {
      const srcPath = path.join(templateConfig.sourceDir, file);
      const destPath = path.join(projectPath, file);

      if (!fs.existsSync(srcPath)) {
        continue;
      }

      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }

    console.log('📝 更新 package.json...');
    updatePackageJson(projectPath, projectName, templateConfig);
    updatePackageLock(projectPath, projectName);
    copyRenamedTemplateFiles(projectPath, templateConfig);

    // 创建 .env 文件
    console.log('⚙️  创建环境配置文件...');
    copyEnvExample(projectPath, 'env.example', '.env');
    copyEnvExample(projectPath, path.join('client', '.env.example'), path.join('client', '.env'));

    console.log('\n✅ 项目创建成功！\n');
    console.log('下一步:');
    for (const step of templateConfig.nextSteps(projectName)) {
      console.log(`  ${step}`);
    }
    if (templateConfig.name === 'admin') {
      console.log('\n提示: admin 模板依赖 MongoDB，请先检查 .env 中的 MONGO_URI、JWT_SECRET 和默认管理员配置。');
    }
    console.log('');
    console.log('📖 文档: https://hikerw.github.io/koa3-cli/');
    console.log('🔗 Gitee: https://gitee.com/wangziwl/koa3-cli\n');

  } catch (error) {
    console.error('❌ 创建项目时出错:', error.message);
    
    // 清理已创建的目录
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
    
    process.exit(1);
  }
}

// 主函数
function main() {
  if (!command || command === 'help' || command === '-h' || command === '--help') {
    showHelp();
    return;
  }

  if (command === 'version' || command === '-v' || command === '--version') {
    showVersion();
    return;
  }

  if (command === 'create') {
    if (!projectName || projectName === 'help' || projectName === '-h' || projectName === '--help') {
      showHelp();
      return;
    }

    createProject(projectName, parseCreateOptions(args.slice(2)));
  } else {
    console.error(`❌ 未知命令: ${command}`);
    console.log('\n使用 koa3-cli --help 查看帮助信息');
    process.exit(1);
  }
}

// 运行主函数
main();
