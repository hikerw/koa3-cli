<template>
  <div>
    <el-card shadow="hover">
      <div class="toolbar">
        <el-select v-model="filters.module" placeholder="模块" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="登录" value="auth" />
          <el-option label="用户" value="system_user" />
          <el-option label="角色" value="role" />
          <el-option label="权限" value="permission" />
          <el-option label="菜单" value="menu" />
        </el-select>
        <el-select v-model="filters.action" placeholder="操作" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="登录成功" value="login_success" />
          <el-option label="登录失败" value="login_fail" />
          <el-option label="新增" value="create" />
          <el-option label="更新" value="update" />
          <el-option label="删除" value="delete" />
        </el-select>
        <el-input v-model="filters.keyword" placeholder="操作人/详情" clearable style="width: 180px" @keyup.enter="loadData" />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
        <el-button type="primary" plain @click="loadData">查询</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100">
          <template #default="{ row }">
            {{ moduleLabel(row.module) }}
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            {{ actionLabel(row.action) }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="130" show-overflow-tooltip />
      </el-table>
      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="(p) => { pagination.page = p; loadData(); }"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchLogs } from '../../api/system/log';

const loading = ref(false);
const filters = reactive({ keyword: '', module: '', action: '' });
const dateRange = ref([]);
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const tableData = ref([]);

const moduleLabels = {
  auth: '登录',
  system_user: '用户',
  role: '角色',
  permission: '权限',
  menu: '菜单'
};
const actionLabels = {
  login_success: '登录成功',
  login_fail: '登录失败',
  create: '新增',
  update: '更新',
  delete: '删除'
};

function moduleLabel(v) {
  return moduleLabels[v] || v || '-';
}
function actionLabel(v) {
  return actionLabels[v] || v || '-';
}
function formatTime(v) {
  if (!v) return '-';
  const d = new Date(v);
  return d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'medium' });
}

async function loadData() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword?.trim() || '',
      module: filters.module || '',
      action: filters.action || ''
    };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    const res = await fetchLogs(params);
    tableData.value = res?.list ?? [];
    pagination.total = res?.total ?? 0;
  } catch (err) {
    ElMessage.error(err.message || '加载失败');
    tableData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

watch(dateRange, () => {
  pagination.page = 1;
  loadData();
}, { deep: true });

onMounted(loadData);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 0;
}
</style>
