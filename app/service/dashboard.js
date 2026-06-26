const os = require('os');
const { mongoose } = require('../model/db');

const BYTES_PER_MB = 1024 * 1024;
const CPU_SAMPLE_INTERVAL_MS = 120;

// 告警阈值集中管理，后续接入配置中心或环境变量时只需要改这里。
const RESOURCE_THRESHOLDS = {
  cpu: { warning: 80, danger: 95 },
  memory: { warning: 80, danger: 95 }
};

const MONGO_READY_STATE_LABELS = {
  0: '未连接',
  1: '已连接',
  2: '连接中',
  3: '断开中'
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFixedPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(1));
}

function bytesToMb(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value / BYTES_PER_MB);
}

function getLevelByPercent(percent, thresholds) {
  if (percent >= thresholds.danger) return 'danger';
  if (percent >= thresholds.warning) return 'warning';
  return 'normal';
}

function getCpuSnapshot() {
  return os.cpus().map((cpu) => {
    const times = cpu.times;
    const total = Object.values(times).reduce((sum, value) => sum + value, 0);
    return { idle: times.idle, total };
  });
}

/**
 * 采集 CPU 使用率。
 *
 * Node 只能直接读取 CPU 时间片快照，不能拿到一个“瞬时使用率”。这里短暂等待后对比两次快照，
 * 计算这段时间内非 idle 时间占比，这样首页展示的是当前运行环境的真实负载，而不是硬编码。
 *
 * @returns {Promise<Object>} CPU 使用率、告警级别和阈值描述
 */
async function getCpuStats() {
  const startSnapshot = getCpuSnapshot();
  await delay(CPU_SAMPLE_INTERVAL_MS);
  const endSnapshot = getCpuSnapshot();

  const usages = endSnapshot.map((endCpu, index) => {
    const startCpu = startSnapshot[index];
    const totalDiff = endCpu.total - startCpu.total;
    const idleDiff = endCpu.idle - startCpu.idle;

    if (totalDiff <= 0) return 0;
    return ((totalDiff - idleDiff) / totalDiff) * 100;
  });

  const averageUsage = usages.length
    ? usages.reduce((sum, value) => sum + value, 0) / usages.length
    : 0;
  const percent = toFixedPercent(averageUsage);

  return {
    key: 'cpu',
    title: 'CPU',
    value: `${percent}%`,
    percent,
    level: getLevelByPercent(percent, RESOURCE_THRESHOLDS.cpu),
    description: `警告 ${RESOURCE_THRESHOLDS.cpu.warning}% · 严重 ${RESOURCE_THRESHOLDS.cpu.danger}%`,
    tooltip: '基于服务器 CPU 时间片差值计算的实时平均使用率。'
  };
}

/**
 * 采集服务器内存使用情况。
 *
 * 这里统计的是宿主机系统内存，而不是 Node 进程堆内存，便于判断整台服务运行环境是否紧张。
 *
 * @returns {Object} 内存使用率、用量和告警级别
 */
function getMemoryStats() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = Math.max(total - free, 0);
  const percent = total > 0 ? toFixedPercent((used / total) * 100) : 0;

  return {
    key: 'memory',
    title: '内存',
    value: `${percent}%`,
    percent,
    level: getLevelByPercent(percent, RESOURCE_THRESHOLDS.memory),
    description: `${bytesToMb(used)} / ${bytesToMb(total)} MB`,
    tooltip: '基于服务器系统内存统计，展示当前已使用内存占比。'
  };
}

/**
 * 获取 MongoDB 连接状态。
 *
 * 项目目前只有 Mongoose 数据库连接，没有连接池明细统计接口，所以这里只展示可确认的真实状态。
 *
 * @returns {Object} 数据库连接状态卡片
 */
function getDatabaseStats() {
  const readyState = mongoose.connection.readyState;
  const stateLabel = MONGO_READY_STATE_LABELS[readyState] || '未知';
  const isConnected = readyState === 1;
  const databaseName = mongoose.connection.name || 'MongoDB';

  return {
    key: 'database',
    title: '数据库',
    value: isConnected ? '正常' : stateLabel,
    level: isConnected ? 'normal' : 'warning',
    description: `${databaseName} · ${stateLabel}`,
    tooltip: '来自 Mongoose 当前连接状态。'
  };
}

function getSystemInfo() {
  return {
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
    platform: process.platform,
    uptime: Math.floor(process.uptime())
  };
}

class DashboardService {
  /**
   * 生成首页状态卡片数据。
   *
   * 当前只返回项目已有真实来源的指标；Redis、队列任务等未接入模块不在这里伪造展示。
   *
   * @returns {Promise<Object>} 首页系统状态和基础运行信息
   */
  async getDashboardStats() {
    const [cpu, memory] = await Promise.all([
      getCpuStats(),
      Promise.resolve(getMemoryStats())
    ]);

    return {
      cards: [cpu, memory, getDatabaseStats()],
      system: getSystemInfo()
    };
  }
}

module.exports = new DashboardService();
