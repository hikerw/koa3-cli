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
