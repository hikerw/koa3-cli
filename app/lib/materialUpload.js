/**
 * 素材上传：类型识别、安全落盘路径、删除本地已托管文件
 */
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogv',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'text/plain': '.txt'
};

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|bmp|ico|svg)$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|avi|mkv|m4v)$/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i;

function classifyMaterialType(mimetype = '', originalFilename = '') {
  const mime = String(mimetype || '').toLowerCase();
  const fname = String(originalFilename || '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (IMAGE_EXT.test(fname)) return 'image';
  if (VIDEO_EXT.test(fname)) return 'video';
  if (AUDIO_EXT.test(fname)) return 'audio';
  return 'file';
}

function extFromMime(mime) {
  const m = String(mime || '').toLowerCase();
  return MIME_TO_EXT[m] || '';
}

function makeStoredFilename(originalFilename, mimetype) {
  let ext = path.extname(String(originalFilename || ''));
  if (!ext || ext.length > 12) ext = extFromMime(mimetype) || '.bin';
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

function uploadAbsDir(rootDir, relativeDir) {
  return path.join(rootDir, relativeDir.replace(/\\/g, '/'));
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function moveFile(src, dest) {
  try {
    await fs.rename(src, dest);
  } catch (e) {
    if (e.code === 'EXDEV') {
      await fs.copyFile(src, dest);
      await fs.unlink(src);
    } else throw e;
  }
}

/**
 * url 为存库路径（如 /uploads/materials/xxx）；uploadDirRelative 如 public/uploads/materials
 */
async function removeStoredFileIfManaged(url, rootDir, publicPath, uploadDirRelative) {
  if (!url || typeof url !== 'string' || !publicPath || !uploadDirRelative) return;
  const u = url.trim().split('?')[0];
  if (!u.startsWith(publicPath)) return;
  const base = path.basename(u);
  if (!base || base === '.' || base === '..') return;
  const uploadRoot = path.join(rootDir, uploadDirRelative.replace(/\\/g, '/'));
  const resolved = path.resolve(uploadRoot, base);
  const rootResolved = path.resolve(uploadRoot);
  if (!resolved.startsWith(rootResolved)) return;
  try {
    await fs.unlink(resolved);
  } catch (_) {}
}

function publicUrlForFile(publicPath, filename) {
  const prefix = publicPath.endsWith('/') ? publicPath.slice(0, -1) : publicPath;
  return `${prefix}/${filename}`;
}

module.exports = {
  classifyMaterialType,
  makeStoredFilename,
  ensureDir,
  moveFile,
  removeStoredFileIfManaged,
  publicUrlForFile,
  uploadAbsDir
};
