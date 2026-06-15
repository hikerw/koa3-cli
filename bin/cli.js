#!/usr/bin/env node

/**
 * Koa3 CLI 工具
 * 用于快速创建 Koa3 项目
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取命令行参数
const args = process.argv.slice(2);
const command = args[0];
const projectName = args[1];

// 显示帮助信息
function showHelp() {
  console.log(`
Koa3 CLI - 快速创建 Koa3 项目脚手架

用法:
  koa3-cli create <project-name>  创建新项目

示例:
  koa3-cli create my-app

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

// 判断是否跳过文件
function shouldSkipFile(filename) {
  const skipFiles = [
    'node_modules',
    '.git',
    '.DS_Store',
    'package-lock.json',
    '.env',
    'logs',
    'coverage',
    '.nyc_output',
    'dist',
    'build',
    'tmp',
    'temp'
  ];
  
  return skipFiles.some(skip => filename.includes(skip));
}

// 更新 package.json
function updatePackageJson(projectPath, projectName) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.name = projectName;
  packageJson.version = '1.0.0';
  packageJson.description = `基于 Koa3 的 ${projectName} 项目`;
  
  // 移除 bin 字段（如果存在）
  delete packageJson.bin;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

// 创建项目
function createProject(projectName) {
  if (!projectName) {
    console.error('❌ 错误: 请提供项目名称');
    console.log('\n用法: koa3-cli create <project-name>');
    process.exit(1);
  }

  const currentDir = process.cwd();
  const projectPath = path.join(currentDir, projectName);

  // 检查项目目录是否已存在
  if (fs.existsSync(projectPath)) {
    console.error(`❌ 错误: 目录 "${projectName}" 已存在`);
    process.exit(1);
  }

  console.log(`🚀 正在创建项目: ${projectName}...\n`);

  try {
    // 获取模板目录（当前项目的根目录）
    const templateDir = path.join(__dirname, '..');

    // 创建项目目录
    fs.mkdirSync(projectPath, { recursive: true });

    // 复制模板文件
    console.log('📁 复制项目文件...');
    const filesToCopy = [
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

    for (const file of filesToCopy) {
      const srcPath = path.join(templateDir, file);
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

    // 创建新的 package.json（不包含 bin 字段）
    console.log('📝 创建 package.json...');
    const templatePackageJson = require('../package.json');
    const newPackageJson = {
      ...templatePackageJson,
      name: projectName,
      version: '1.0.0',
      description: `基于 Koa3 的 ${projectName} 项目`
    };
    delete newPackageJson.bin;
    
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(newPackageJson, null, 2) + '\n'
    );

    // 创建 .env 文件
    console.log('⚙️  创建环境配置文件...');
    if (fs.existsSync(path.join(templateDir, 'env.example'))) {
      fs.copyFileSync(
        path.join(templateDir, 'env.example'),
        path.join(projectPath, '.env')
      );
    }

    console.log('\n✅ 项目创建成功！\n');
    console.log('下一步:');
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  npm run dev\n');
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
    createProject(projectName);
  } else {
    console.error(`❌ 未知命令: ${command}`);
    console.log('\n使用 koa3-cli --help 查看帮助信息');
    process.exit(1);
  }
}

// 运行主函数
main();
