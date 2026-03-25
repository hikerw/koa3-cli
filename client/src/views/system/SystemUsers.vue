<template>
  <div>
    <el-card shadow="hover">
      <div class="toolbar">
        <el-input
          v-model="filters.keyword"
          placeholder="用户名"
          clearable
          style="width: 200px"
          @keyup.enter="loadData"
        />
        <el-button type="primary" plain @click="loadData">查询</el-button>
        <el-button plain @click="filters.keyword = ''; loadData()">重置</el-button>
        <el-button type="primary" @click="openCreate">新增用户</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column label="角色" min-width="200">
          <template #default="{ row }">
            {{ roleNames(row.roleIds) }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
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
          @current-change="(p) => { pagination.page = p; loadData(); }"
        />
      </div>
    </el-card>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="480px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!form.id">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword" v-if="form.id">
          <el-input v-model="form.newPassword" type="password" placeholder="不修改请留空" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="form.roleIds" multiple placeholder="选择角色" style="width: 100%">
            <el-option
              v-for="r in rolesWithId"
              :key="r.id"
              :label="r.name || r.id"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchSystemUsers, createSystemUser, updateSystemUser, deleteSystemUser } from '../../api/system/users';
import { fetchRolesAll } from '../../api/system/roles';

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const filters = reactive({ keyword: '' });
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });
const tableData = ref([]);
const roleList = ref([]);
const rolesWithId = computed(() => {
  const list = roleList.value;
  if (!Array.isArray(list)) return [];
  return list.filter((r) => r && (r.id != null && r.id !== ''));
});
const form = reactive({ id: null, username: '', password: '', newPassword: '', roleIds: [] });
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

function roleNames(roleIds) {
  if (!roleIds || !roleIds.length) return '-';
  const list = roleList.value;
  if (!Array.isArray(list)) return roleIds.join('、');
  return roleIds.map((id) => list.find((r) => r && r.id === id)?.name || id).filter(Boolean).join('、') || '-';
}

function formatDate(val) {
  if (!val) return '-';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(val));
}

async function loadRoles() {
  try {
    const data = await fetchRolesAll();
    roleList.value = Array.isArray(data) ? data : [];
  } catch (_) {
    roleList.value = [];
  }
}

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchSystemUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword?.trim()
    });
    tableData.value = res?.list ?? [];
    pagination.total = res?.total ?? 0;
  } catch (err) {
    ElMessage.error(err.message);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.id = null;
  form.username = '';
  form.password = '';
  form.newPassword = '';
  form.roleIds = [];
  dialogTitle.value = '新增用户';
  dialogVisible.value = true;
}

function openEdit(row) {
  form.id = row.id;
  form.username = row.username;
  form.password = '';
  form.newPassword = '';
  form.roleIds = Array.isArray(row.roleIds) ? row.roleIds.filter((id) => id != null && id !== '') : [];
  dialogTitle.value = '编辑用户';
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  const ok = await formRef.value.validate().catch(() => false);
  if (!ok) return;
  submitLoading.value = true;
  try {
    if (form.id) {
      await updateSystemUser(form.id, {
        username: form.username,
        password: form.newPassword || undefined,
        roleIds: form.roleIds
      });
      ElMessage.success('更新成功');
    } else {
      await createSystemUser({ username: form.username, password: form.password, roleIds: form.roleIds });
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch (err) {
    ElMessage.error(err.message);
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete(row) {
  try {
    await deleteSystemUser(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (err) {
    ElMessage.error(err.message);
  }
}

onMounted(() => {
  loadRoles();
  loadData();
});
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.pagination { display: flex; justify-content: flex-end; padding: 12px 0 0; }
</style>
