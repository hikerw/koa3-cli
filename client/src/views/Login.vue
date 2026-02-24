<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="login-bg-gradient" />
      <div class="login-bg-grid" aria-hidden="true" />
    </div>

    <div class="login-container">
      <div class="login-card">
        <el-tooltip :content="isDark ? '切换为浅色' : '切换为深色'" placement="left">
          <el-button link circle class="login-theme-btn" @click="toggleTheme" :aria-label="isDark ? '浅色模式' : '深色模式'">
            <el-icon :size="20"><Sunny v-if="isDark" /><Moon v-else /></el-icon>
          </el-button>
        </el-tooltip>
        <div class="login-header">
          <div class="login-logo">
            <span class="logo-text">Koa3</span>
            <span class="logo-badge">Admin</span>
          </div>
          <p class="login-subtitle">欢迎回来，请登录您的账号</p>
        </div>

        <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          label-position="top"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              autocomplete="username"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              autocomplete="current-password"
              :prefix-icon="Lock"
              show-password
              clearable
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item class="login-actions">
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              {{ loading ? '登录中…' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <p class="login-footer">Koa3 Admin · 后台管理系统</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { User, Lock, Sunny, Moon } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { login } from '../api/auth';
import { useTheme } from '../composables/useTheme';

const { isDark, toggleTheme } = useTheme();

const loading = ref(false);
const formRef = ref();
const form = ref({ username: '', password: '' });
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

async function handleLogin() {
  await formRef.value.validate();
  loading.value = true;
  try {
    const  data  = await login({
      username: form.value.username,
      password: form.value.password
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('admin', JSON.stringify(data.user));
    ElMessage.success('登录成功');
    window.location.href = '/';
  } catch (err) {
    ElMessage.error(err.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* 背景 */
.login-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.login-bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99, 102, 241, 0.18), transparent),
    radial-gradient(ellipse 60% 50% at 100% 50%, rgba(59, 130, 246, 0.08), transparent),
    radial-gradient(ellipse 50% 40% at 0% 80%, rgba(139, 92, 246, 0.06), transparent);
}
html.dark .login-bg-gradient {
  background:
    radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99, 102, 241, 0.2), transparent),
    radial-gradient(ellipse 60% 50% at 100% 50%, rgba(59, 130, 246, 0.1), transparent),
    radial-gradient(ellipse 50% 40% at 0% 80%, rgba(139, 92, 246, 0.08), transparent);
}
.login-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
}
html.dark .login-bg-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
}

/* 卡片容器 */
.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.06),
    0 10px 20px -4px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.04);
  position: relative;
}
html.dark .login-card {
  background: rgba(22, 27, 34, 0.92);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 20px -4px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}
.login-theme-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--app-text-secondary);
}
.login-theme-btn:hover {
  color: var(--el-color-primary);
}

.login-header {
  margin-bottom: 32px;
  text-align: center;
}

.login-logo {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.logo-text {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1e293b;
}
html.dark .logo-text {
  color: #e6edf3;
}

.logo-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  letter-spacing: 0.02em;
}

.login-subtitle {
  margin: 0;
  font-size: 0.9375rem;
  color: #64748b;
}
html.dark .login-subtitle {
  color: #8b949e;
}

.login-form {
  --el-form-label-font-size: 0.875rem;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-form-item__label) {
  color: #475569;
  font-weight: 500;
}
html.dark .login-form :deep(.el-form-item__label) {
  color: #8b949e;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 12px;
  box-shadow: 0 0 0 1px var(--el-border-color);
  transition: box-shadow 0.2s ease;
}

.login-form :deep(.el-input__wrapper:hover),
.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary), 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.login-actions {
  margin-top: 28px;
  margin-bottom: 0;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-weight: 600;
  font-size: 0.9375rem;
  border-radius: 10px;
  letter-spacing: 0.04em;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 0.8125rem;
  color: #94a3b8;
}
html.dark .login-footer {
  color: #6e7681;
}
</style>
