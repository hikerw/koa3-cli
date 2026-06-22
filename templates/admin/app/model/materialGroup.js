/**
 * 素材分组
 */
const { mongoose } = require('./db');

const MaterialGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, comment: '分组名称' },
    order: { type: Number, default: 0, comment: '分组排序值，越小越靠前' }
  },
  { timestamps: true }
);

MaterialGroupSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const MaterialGroup = mongoose.models.MaterialGroup || mongoose.model('MaterialGroup', MaterialGroupSchema);
module.exports = MaterialGroup;
