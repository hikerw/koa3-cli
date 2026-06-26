<template>
  <div class="home">
    <section class="status-panel" v-loading="loading">
      <div class="status-grid" v-if="dashboard.cards.length">
        <article
          v-for="card in dashboard.cards"
          :key="card.key"
          class="status-card"
          :class="`status-card--${card.level || 'normal'}`"
        >
          <div class="status-card__header">
            <span>{{ card.title }}</span>
            <el-tooltip v-if="card.tooltip" :content="card.tooltip" placement="top">
              <el-icon class="status-card__info"><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="status-card__value">{{ card.value || '-' }}</div>
          <div class="status-card__desc">{{ card.description || '-' }}</div>
        </article>
      </div>
      <el-empty v-else description="暂无状态数据" />
      <el-alert
        v-if="errorMessage"
        class="status-error"
        type="warning"
        :title="errorMessage"
        show-icon
        :closable="false"
      />
    </section>

    <el-card shadow="hover" class="info-card">
      <template #header>
        <span>系统信息</span>
      </template>
      <ul class="info-list" v-if="dashboard.system.nodeVersion">
        <li><span class="label">Node 版本</span><span class="value">{{ dashboard.system.nodeVersion }}</span></li>
        <li><span class="label">运行环境</span><span class="value">{{ dashboard.system.env }}</span></li>
        <li><span class="label">操作系统</span><span class="value">{{ platformLabel(dashboard.system.platform) }}</span></li>
        <li><span class="label">服务运行时长</span><span class="value">{{ formatUptime(dashboard.system.uptime) }}</span></li>
      </ul>
      <el-empty v-else description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';
import { fetchDashboardStats } from '../api/dashboard';

const loading = ref(false);
const errorMessage = ref('');
const dashboard = reactive({
  cards: [],
  system: { nodeVersion: '', env: '', platform: '', uptime: 0 }
});

function platformLabel(p) {
  const map = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' };
  return map[p] || p || '-';
}

function formatUptime(seconds) {
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '-';

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  return `${Math.max(minutes, 0)}分钟`;
}

async function loadDashboard() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const data = await fetchDashboardStats();
    // 状态卡片由后端基于真实运行环境生成，前端只做展示，避免把业务监控口径写散。
    dashboard.cards = Array.isArray(data?.cards) ? data.cards : [];
    if (data?.system) {
      Object.assign(dashboard.system, data.system);
    }
  } catch (err) {
    dashboard.cards = [];
    errorMessage.value = err.message || '首页状态加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<style scoped>
.home {
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.status-panel {
  padding: 20px;
  background: var(--app-bg-card);
  border: 1px solid var(--app-border);
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
}
.status-card {
  min-height: 116px;
  padding: 18px 20px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.03);
  box-sizing: border-box;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.status-card:hover {
  transform: translateY(-1px);
}
.status-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9aa4b2;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0;
}
.status-card__info {
  color: #a8b2c1;
  cursor: help;
}
.status-card__value {
  margin-top: 12px;
  color: #00a36c;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 800;
}
.status-card--warning .status-card__value {
  color: #d97706;
}
.status-card--danger .status-card__value {
  color: #dc2626;
}
.status-card__desc {
  margin-top: 12px;
  color: #7b8494;
  font-size: 14px;
  line-height: 1.45;
  word-break: break-word;
}
.status-error {
  margin-top: 12px;
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
html.dark .status-card {
  background: #111827;
  border-color: rgba(255, 255, 255, 0.06);
}
html.dark .status-card__header {
  color: #8b949e;
}
html.dark .status-card__desc {
  color: #9ca3af;
}
html.dark .info-list .value {
  color: var(--app-text-primary);
}
@media (max-width: 768px) {
  .status-panel {
    padding: 14px;
    border-radius: 14px;
  }
  .status-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .status-card {
    min-height: 104px;
    padding: 16px;
  }
}
</style>
