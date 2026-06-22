const fs = require('fs');
const path = require('path');
const util = require('util');

const LEVEL_WEIGHT = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function normalizeLevel(level) {
  const resolved = String(level || 'info').toLowerCase();
  return LEVEL_WEIGHT[resolved] ? resolved : 'info';
}

function formatDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimestamp(date = new Date()) {
  return date.toLocaleString();
}

function safeSerialize(meta) {
  if (meta === undefined) {
    return '';
  }

  if (meta instanceof Error) {
    return JSON.stringify({
      name: meta.name,
      message: meta.message,
      stack: meta.stack
    });
  }

  if (typeof meta === 'string') {
    return meta;
  }

  try {
    return JSON.stringify(meta);
  } catch (error) {
    return util.inspect(meta, { depth: 4, breakLength: 120 });
  }
}

class Logger {
  constructor(options = {}) {
    this.level = normalizeLevel(options.level);
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.dir = options.dir || 'logs';
    this.appName = options.appName || 'koa3-cli';
    this.cwd = options.cwd || process.cwd();
    this.logDir = path.isAbsolute(this.dir) ? this.dir : path.join(this.cwd, this.dir);

    if (this.enableFile) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  shouldLog(level) {
    return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[this.level];
  }

  write(level, message, meta) {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = formatTimestamp();
    const metaText = safeSerialize(meta);
    const line = `[${timestamp}] [${this.appName}] [${level.toUpperCase()}] ${message}${metaText ? ` ${metaText}` : ''}`;

    if (this.enableConsole) {
      const printer = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      printer(line);
    }

    if (!this.enableFile) {
      return;
    }

    const date = formatDate();
    const commonPath = path.join(this.logDir, `${date}.log`);
    fs.appendFile(commonPath, `${line}\n`, () => {});

    if (level === 'error') {
      const errorPath = path.join(this.logDir, `${date}.error.log`);
      fs.appendFile(errorPath, `${line}\n`, () => {});
    }
  }

  access(data) {
    const line = {
      timestamp: formatTimestamp(),
      type: 'access',
      app: this.appName,
      ...data
    };

    if (this.enableConsole && this.shouldLog('info')) {
      console.log(`[${line.timestamp}] [${this.appName}] [ACCESS] ${line.method} ${line.url} ${line.status} ${line.duration}ms ${line.requestId}`);
    }

    if (!this.enableFile) {
      return;
    }

    const date = formatDate();
    const accessPath = path.join(this.logDir, `${date}.access.log`);
    fs.appendFile(accessPath, `${JSON.stringify(line)}\n`, () => {});
  }

  debug(message, meta) {
    this.write('debug', message, meta);
  }

  info(message, meta) {
    this.write('info', message, meta);
  }

  warn(message, meta) {
    this.write('warn', message, meta);
  }

  error(message, meta) {
    this.write('error', message, meta);
  }
}

function createLogger(options) {
  return new Logger(options);
}

module.exports = {
  createLogger
};
