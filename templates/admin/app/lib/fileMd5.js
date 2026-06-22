const fs = require('fs');
const crypto = require('crypto');

function md5FileHex(absolutePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(absolutePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/** 返回小写 32 位 hex，非法则空串 */
function normalizeMd5(s) {
  const x = String(s || '').trim().toLowerCase();
  return /^[a-f0-9]{32}$/.test(x) ? x : '';
}

module.exports = { md5FileHex, normalizeMd5 };
