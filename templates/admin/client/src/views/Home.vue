<template>
  <div class="home">
    <el-card shadow="hover" class="info-card">
      <template #header>
        <span>系统信息</span>
      </template>
      <ul class="info-list" v-if="system.nodeVersion">
        <li><span class="label">Node 版本</span><span class="value">{{ system.nodeVersion }}</span></li>
        <li><span class="label">运行环境</span><span class="value">{{ system.env }}</span></li>
        <li><span class="label">操作系统</span><span class="value">{{ platformLabel(system.platform) }}</span></li>
      </ul>
      <el-empty v-else description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { fetchDashboardStats } from '../api/dashboard';

const system = reactive({ nodeVersion: '', env: '', platform: '' });

function platformLabel(p) {
  const map = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' };
  return map[p] || p || '-';
}

async function loadSystemInfo() {
  try {
    const data = await fetchDashboardStats();
    if (data?.system) {
      Object.assign(system, data.system);
    }
  } catch (_) {}
}

onMounted(loadSystemInfo);
</script>

<style scoped>
.home {
  max-width: 100%;
}
.info-card {
  border-radius: 12px;
}
.info-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.info-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.info-list li:last-child {
  border-bottom: none;
}
.info-list .label {
  color: #64748b;
  font-size: 0.875rem;
}
.info-list .value {
  font-weight: 500;
  color: #1e293b;
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
}
</style>
