<template>
  <Login v-if="!authed" />
  <el-container v-else class="layout">
    <el-header class="header">
      <div class="brand">Koa3 Admin</div>
      <div class="actions">
        <el-button type="primary" @click="openCreate">新增用户</el-button>
        <el-button link @click="logout">退出</el-button>
      </div>
    </el-header>
    <el-main>

      <el-card shadow="hover">
        <div class="toolbar">
          <el-input
            v-model="filters.keyword"
            placeholder="按姓名或邮箱搜索"
            clearable
            style="width: 260px"
            @clear="handleFilter"
            @keyup.enter="handleFilter"
          />
          <el-button type="primary" plain @click="handleFilter">查询</el-button>
          <el-button plain @click="resetFilter">重置</el-button>
        </div>
        <el-table :data="tableData" v-loading="loading" style="width: 100%">
          <el-table-column prop="name" label="姓名" min-width="140" />
          <el-table-column prop="email" label="邮箱" min-width="200" />
          <el-table-column prop="phone" label="电话" min-width="140" />
          <el-table-column label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
              <el-popconfirm
                title="确认删除该用户？"
                confirm-button-text="删除"
                cancel-button-text="取消"
                confirm-button-type="danger"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button type="danger" link>删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            background
            layout="prev, pager, next, jumper, ->, total"
            :current-page="pagination.page"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            @current-change="(p) => changePage(p)"
          />
        </div>
      </el-card>
    </el-main>
  </el-container>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="480px" destroy-on-close>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="电话" prop="phone">
        <el-input v-model="form.phone" placeholder="可选" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import Login from './views/Login.vue';
import { fetchUsers, createUser, updateUser, deleteUser } from './api/user';

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();

const filters = reactive({ keyword: '' });
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });
const tableData = ref([]);

const form = reactive({ id: null, name: '', email: '', phone: '' });

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
};

const authed = computed(() => !!localStorage.getItem('token'));

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('admin');
  window.location.reload();
}

function formatDate(val) {
  if (!val) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(val));
}

async function loadData() {
  loading.value = true;
  try {
    const { data } = await fetchUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword?.trim()
    });
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (err) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = null;
  form.name = '';
  form.email = '';
  form.phone = '';
}

function openCreate() {
  resetForm();
  dialogTitle.value = '新增用户';
  dialogVisible.value = true;
}

function openEdit(row) {
  form.id = row.id;
  form.name = row.name;
  form.email = row.email;
  form.phone = row.phone || '';
  dialogTitle.value = '编辑用户';
  dialogVisible.value = true;
}

function changePage(p) {
  pagination.page = Number(p) || 1;
  loadData();
}


function handleFilter() {
  pagination.page = 1;
  loadData();
}

function resetFilter() {
  filters.keyword = '';
  handleFilter();
}

function getPayload() {
  const payload = {
    name: form.name,
    email: form.email,
    phone: form.phone || ''
  };
  return payload;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate();
  submitLoading.value = true;
  try {
    const payload = getPayload();
    if (form.id) {
      await updateUser(form.id, payload);
      ElMessage.success('更新成功');
    } else {
      await createUser(payload);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await loadData();
  } catch (err) {
    ElMessage.error(err.message || '提交失败');
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete(row) {
  try {
    await deleteUser(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (err) {
    ElMessage.error(err.message || '删除失败');
  }
}

onMounted(() => {
  if (authed.value) {
    loadData();
  }
});
</script>


<style scoped>
.layout {
  min-height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.brand {
  font-weight: 700;
  font-size: 18px;
  color: #1f2933;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.el-main {
  padding: 20px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 0;
}
</style>
