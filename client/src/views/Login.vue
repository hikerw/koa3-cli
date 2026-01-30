<template>
  <div class="login-wrapper">
    <el-card class="login-card" shadow="hover">
      <h2 class="title">Koa3 Admin 登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" autocomplete="current-password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { login } from '../api/auth';

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
    const { data } = await login({
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
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  padding: 24px;
}
.login-card {
  width: 360px;
}
.title {
  margin: 0 0 16px;
  font-weight: 700;
  text-align: center;
}
</style>
