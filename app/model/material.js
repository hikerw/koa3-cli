/**
 * 素材数据模型
 */
const { mongoose } = require('./db');

const MaterialSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaterialGroup',
      default: null,
      comment: '所属分组 ID，null 表示未分组'
    },
    name: { type: String, required: true, trim: true, comment: '素材名称' },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file', 'other'],
      default: 'other',
      comment: '素材类型：图片/视频/音频/文件/其他'
    },
    url: { type: String, required: true, trim: true, comment: '素材访问 URL 或相对路径' },
    thumbnail: { type: String, default: '', trim: true, comment: '缩略图 URL（图片通常与 url 相同）' },
    storageDriver: { type: String, enum: ['local', 'qiniu'], default: 'local', comment: '素材所在存储驱动' },
    mimeType: { type: String, default: '', trim: true, comment: '文件 MIME 类型' },
    size: { type: Number, default: 0, comment: '文件大小（字节）' },
    description: { type: String, default: '', comment: '素材描述（可选）' },
    tags: {
      type: [{ type: String, trim: true }],
      default: [],
      comment: '素材标签列表（可选）'
    },
    fileHash: { type: String, default: '', trim: true, index: true, comment: '内容 MD5（小写 hex），用于秒传与去重' }
  },
  { timestamps: true }
);

MaterialSchema.index({ fileHash: 1, size: 1 });

MaterialSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.groupId) ret.groupId = ret.groupId.toString();
    else ret.groupId = null;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Material = mongoose.models.Material || mongoose.model('Material', MaterialSchema);
module.exports = Material;
