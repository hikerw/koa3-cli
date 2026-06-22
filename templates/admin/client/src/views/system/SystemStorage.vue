<template>
  <div class="storage-page">
    <el-card shadow="hover" class="storage-card">
      <template #header>
        <div class="card-header">
          <div>
            <h2>存储配置</h2>
            <p>选择后管上传文件的保存位置</p>
          </div>
          <el-tag :type="form.driver === 'qiniu' ? 'success' : 'info'">
            {{ form.driver === 'qiniu' ? '七牛云存储' : '本地存储' }}
          </el-tag>
        </div>
      </template>

      <el-skeleton :loading="loading" animated :rows="6">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="storage-form">
          <el-form-item label="上传方式" prop="driver">
            <el-radio-group v-model="form.driver">
              <el-radio-button label="local">本地存储</el-radio-button>
              <el-radio-button label="qiniu">七牛云存储</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-alert
            v-if="form.driver === 'local'"
            title="本地存储会把文件保存到服务端磁盘，适合开发环境或单机部署。"
            type="info"
            show-icon
            :closable="false"
            class="form-alert"
          />
          <el-alert
            v-else
            title="七牛云存储由服务端上传文件，不会把 AccessKey / SecretKey 暴露给客户端。"
            type="success"
            show-icon
            :closable="false"
            class="form-alert"
          />

          <section v-if="form.driver === 'local'" class="setting-section">
            <h3>本地存储</h3>
            <el-form-item label="保存目录" prop="local.dir">
              <el-input v-model="form.local.dir" placeholder="public/uploads/materials" />
            </el-form-item>
            <el-form-item label="访问路径" prop="local.publicPath">
              <el-input v-model="form.local.publicPath" placeholder="/uploads/materials" />
            </el-form-item>
          </section>

          <section v-else class="setting-section">
            <h3>七牛云存储</h3>
            <el-form-item label="AccessKey" prop="qiniu.accessKey">
              <el-input v-model="form.qiniu.accessKey" placeholder="七牛云 AccessKey" autocomplete="off" />
            </el-form-item>
            <el-form-item label="SecretKey" prop="qiniu.secretKey">
              <el-input
                v-model="form.qiniu.secretKey"
                placeholder="七牛云 SecretKey"
                autocomplete="off"
                show-password
              />
            </el-form-item>
            <el-form-item label="空间名称" prop="qiniu.bucket">
              <el-input v-model="form.qiniu.bucket" placeholder="Bucket 名称" />
            </el-form-item>
            <el-form-item label="访问域名" prop="qiniu.domain">
              <el-input v-model="form.qiniu.domain" placeholder="https://cdn.example.com" />
            </el-form-item>
            <el-form-item label="存储区域" prop="qiniu.region">
              <el-select v-model="form.qiniu.region" placeholder="请选择区域" style="width: 100%">
                <el-option v-for="item in regionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="文件前缀" prop="qiniu.prefix">
              <el-input v-model="form.qiniu.prefix" placeholder="materials" />
            </el-form-item>
          </section>

          <div class="form-actions">
            <el-button @click="loadSetting">重置</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
          </div>
        </el-form>
      </el-skeleton>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchStorageSetting, saveStorageSetting } from '../../api/system/storage';

const defaultForm = {
  driver: 'local',
  local: {
    dir: 'public/uploads/materials',
    publicPath: '/uploads/materials'
  },
  qiniu: {
    accessKey: '',
    secretKey: '',
    bucket: '',
    domain: '',
    region: 'z0',
    prefix: 'materials'
  }
};

const regionOptions = [
  { label: '华东 z0', value: 'z0' },
  { label: '华东-浙江 cn_east_2', value: 'cn_east_2' },
  { label: '华北 z1', value: 'z1' },
  { label: '华南 z2', value: 'z2' },
  { label: '北美 na0', value: 'na0' },
  { label: '东南亚 as0', value: 'as0' }
];

const formRef = ref();
const loading = ref(false);
const saving = ref(false);
const form = reactive(JSON.parse(JSON.stringify(defaultForm)));

const requiredWhenQiniu = (_rule, value, cb) => {
  if (form.driver !== 'qiniu') {
    cb();
    return;
  }
  if (!String(value || '').trim()) {
    cb(new Error('启用七牛云时必填'));
    return;
  }
  cb();
};

const rules = {
  driver: [{ required: true, message: '请选择上传方式', trigger: 'change' }],
  'local.dir': [{ required: true, message: '请输入保存目录', trigger: 'blur' }],
  'local.publicPath': [{ required: true, message: '请输入访问路径', trigger: 'blur' }],
  'qiniu.accessKey': [{ validator: requiredWhenQiniu, trigger: 'blur' }],
  'qiniu.secretKey': [{ validator: requiredWhenQiniu, trigger: 'blur' }],
  'qiniu.bucket': [{ validator: requiredWhenQiniu, trigger: 'blur' }],
  'qiniu.domain': [{ validator: requiredWhenQiniu, trigger: 'blur' }],
  'qiniu.region': [{ validator: requiredWhenQiniu, trigger: 'change' }]
};

function assignForm(setting = {}) {
  const next = {
    ...defaultForm,
    ...setting,
    local: { ...defaultForm.local, ...(setting.local || {}) },
    qiniu: { ...defaultForm.qiniu, ...(setting.qiniu || {}) }
  };
  form.driver = next.driver === 'qiniu' ? 'qiniu' : 'local';
  form.local.dir = next.local.dir;
  form.local.publicPath = next.local.publicPath;
  form.qiniu.accessKey = next.qiniu.accessKey;
  form.qiniu.secretKey = next.qiniu.secretKey;
  form.qiniu.bucket = next.qiniu.bucket;
  form.qiniu.domain = next.qiniu.domain;
  form.qiniu.region = next.qiniu.region || 'z0';
  form.qiniu.prefix = next.qiniu.prefix;
}

function buildPayload() {
  // 保存完整配置，切换驱动时保留另一套参数，方便运维临时切换后再切回来。
  return {
    driver: form.driver,
    local: { ...form.local },
    qiniu: { ...form.qiniu }
  };
}

async function loadSetting() {
  loading.value = true;
  try {
    const data = await fetchStorageSetting();
    assignForm(data);
  } catch (err) {
    ElMessage.error(err.message || '加载存储配置失败');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  const ok = await formRef.value?.validate().catch(() => false);
  if (!ok) return;
  saving.value = true;
  try {
    const data = await saveStorageSetting(buildPayload());
    assignForm(data);
    ElMessage.success('存储配置已保存');
  } catch (err) {
    ElMessage.error(err.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(loadSetting);
</script>

<style scoped>
.storage-page {
  max-width: 920px;
}

.storage-card {
  background: var(--app-bg-card, var(--el-bg-color));
  border-color: var(--el-border-color-lighter);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--app-text-primary, var(--el-text-color-primary));
}

.card-header p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.storage-form {
  max-width: 720px;
}

.form-alert {
  margin: 0 0 18px 120px;
}

.setting-section {
  padding: 4px 0 0;
}

.setting-section h3 {
  margin: 0 0 16px 120px;
  font-size: 15px;
  color: var(--app-text-primary, var(--el-text-color-primary));
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

@media (max-width: 720px) {
  .storage-page {
    max-width: none;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .form-alert,
  .setting-section h3 {
    margin-left: 0;
  }
}
</style>
