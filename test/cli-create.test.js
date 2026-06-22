const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const cliPath = path.join(projectRoot, 'bin', 'cli.js');

/**
 * 创建独立临时目录，避免测试过程污染当前仓库或用户已有项目。
 * @returns {string} 临时工作目录绝对路径
 */
function createTempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'koa3-cli-test-'));
}

/**
 * 读取 JSON 文件并解析为对象，集中处理测试里重复的文件读取逻辑。
 * @param {string} filePath - JSON 文件绝对路径
 * @returns {object} 解析后的 JSON 对象
 */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('CLI 可以输出当前版本号', () => {
  const result = spawnSync(process.execPath, [cliPath, '--version'], {
    cwd: projectRoot,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^koa3-cli v\d+\.\d+\.\d+/);
});

test('CLI create --help 只展示帮助信息，不创建项目目录', () => {
  const workspace = createTempWorkspace();
  const helpProjectPath = path.join(workspace, '--help');

  try {
    const result = spawnSync(process.execPath, [cliPath, 'create', '--help'], {
      cwd: workspace,
      encoding: 'utf8'
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /可用模板/);
    assert.equal(fs.existsSync(helpProjectPath), false, '查看 create 帮助时不应该创建 --help 目录');
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test('CLI create 遇到未知模板时会返回明确错误', () => {
  const workspace = createTempWorkspace();
  const projectName = 'bad-template-app';
  const projectPath = path.join(workspace, projectName);

  try {
    const result = spawnSync(process.execPath, [cliPath, 'create', projectName, '--template', 'missing'], {
      cwd: workspace,
      encoding: 'utf8'
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /未知模板/);
    assert.equal(fs.existsSync(projectPath), false, '模板参数错误时不应该创建项目目录');
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test('CLI create 可以生成可运行的 Koa3 项目骨架', () => {
  const workspace = createTempWorkspace();
  const projectName = 'demo-api';
  const projectPath = path.join(workspace, projectName);

  try {
    const result = spawnSync(process.execPath, [cliPath, 'create', projectName], {
      cwd: workspace,
      encoding: 'utf8'
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(fs.existsSync(projectPath), '项目目录应该被创建');

    const expectedFiles = [
      'app.js',
      'package.json',
      '.env',
      'env.example',
      'README.md',
      'app/controller/user.js',
      'app/service/user.js',
      'app/model/user.js',
      'config/config.default.js',
      'public/index.html'
    ];

    for (const file of expectedFiles) {
      assert.ok(fs.existsSync(path.join(projectPath, file)), `缺少关键文件: ${file}`);
    }

    const packageJson = readJson(path.join(projectPath, 'package.json'));
    assert.equal(packageJson.name, projectName);
    assert.equal(packageJson.version, '1.0.0');
    assert.equal(packageJson.description, `基于 Koa3 的 ${projectName} 项目`);
    assert.equal(packageJson.bin, undefined, '生成后的业务项目不应该继续暴露 CLI bin 字段');
  } finally {
    // 测试结束后清理临时项目，保证重复运行测试时不会受到上一次结果影响。
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test('CLI create --template admin 可以生成后台管理项目骨架', () => {
  const workspace = createTempWorkspace();
  const projectName = 'demo-admin';
  const projectPath = path.join(workspace, projectName);

  try {
    const result = spawnSync(process.execPath, [cliPath, 'create', projectName, '--template', 'admin'], {
      cwd: workspace,
      encoding: 'utf8'
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /后台管理模板/);

    const expectedFiles = [
      'app.js',
      'package.json',
      'package-lock.json',
      '.gitignore',
      '.npmignore',
      '.env',
      'env.example',
      'app/controller/admin.js',
      'app/router/modules/system.js',
      'app/service/storage.js',
      'client/package.json',
      'client/package-lock.json',
      'client/.env',
      'client/src/views/Login.vue',
      'client/src/views/system/SystemUsers.vue',
      'public/uploads/materials/.gitkeep'
    ];

    for (const file of expectedFiles) {
      assert.ok(fs.existsSync(path.join(projectPath, file)), `缺少 admin 模板关键文件: ${file}`);
    }

    const packageJson = readJson(path.join(projectPath, 'package.json'));
    assert.equal(packageJson.name, projectName);
    assert.equal(packageJson.version, '1.0.0');
    assert.equal(packageJson.description, `基于 Koa3 的 ${projectName} 后台管理项目`);
    assert.equal(packageJson.bin, undefined, 'admin 业务项目不应该继续暴露 CLI bin 字段');
    assert.equal(packageJson.files, undefined, 'admin 业务项目不应该继承 CLI 发布白名单');

    const packageLock = readJson(path.join(projectPath, 'package-lock.json'));
    assert.equal(packageLock.name, projectName);
    assert.equal(packageLock.version, '1.0.0');
    assert.equal(packageLock.packages[''].name, projectName);
    assert.equal(packageLock.packages[''].version, '1.0.0');
    assert.equal(packageLock.packages[''].bin, undefined, 'admin 锁文件根项不应该继续包含 CLI bin 字段');
  } finally {
    // admin 模板文件较多，测试结束后立即清理，避免临时目录长期占用磁盘空间。
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
