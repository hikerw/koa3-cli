const { mongoose } = require('./db');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

AdminSchema.methods.comparePassword = function (raw) {
  return bcrypt.compare(raw, this.password);
};

AdminSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function ensureDefaultAdmin({ username, password }) {
  if (!username || !password) return;
  const exist = await Admin.findOne({ username: username.toLowerCase().trim() });
  if (exist) return;
  await Admin.create({ username, password });
  console.log(`[Admin] 默认管理员已创建: ${username}`);
}

module.exports = {
  Admin,
  ensureDefaultAdmin
};
