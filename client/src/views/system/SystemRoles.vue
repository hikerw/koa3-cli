<template>
  <div>
    <el-card shadow="hover">
      <div class="toolbar">
        <el-input
          v-model="filters.keyword"
          placeholder="角色名称/编码"
          clearable
          style="width: 200px"
          @keyup.enter="loadData"
        />
        <el-button type="primary" plain @click="loadData">查询</el-button>
        <el-button type="primary" @click="openCreate">新增角色</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="角色名称" min-width="120" />
        <el-table-column prop="code" label="编码" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="创建时间" min-width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确认删除？" confirm-button-text="删除" cancel-button-text="取消" confirm-button-type="danger" @confirm="handleDelete(row)">
              <template #reference><el-button type="danger" link>删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
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

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="560px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="如 ADMIN" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="可选" :rows="2" />
        </el-form-item>
        <el-form-item label="权限" prop="permissionIds">
          <el-select v-model="form.permissionIds" multiple filterable placeholder="选择权限" style="width: 100%">
            <el-option v-for="p in permissionFlat" :key="p.id" :label="`${p.name} (${p.code})`" :value="p.id" />
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
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchRoles, createRole, updateRole, deleteRole } from '../../api/system/roles';
import { fetchPermissionTree } from '../../api/system/permissions';

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const filters = reactive({ keyword: '' });
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });
const tableData = ref([]);
const permissionFlat = ref([]);
const form = reactive({ id: null, name: '', code: '', description: '', permissionIds: [] });
const rules = { name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }], code: [{ required: true, message: '请输入编码', trigger: 'blur' }] };

function formatDate(val) {
  if (!val) return '-';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(val));
}

async function loadPermissions() {
  try {
    const tree = await fetchPermissionTree();
    const flat = [];
    function walk(arr) {
      arr.forEach((p) => { flat.push(p); if (p.children?.length) walk(p.children); });
    }
    walk(tree || []);
    permissionFlat.value = flat;
  } catch (_) {}
}

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchRoles({ page: pagination.page, pageSize: pagination.pageSize, keyword: filters.keyword?.trim() });
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
  form.name = '';
  form.code = '';
  form.description = '';
  form.permissionIds = [];
  dialogTitle.value = '新增角色';
  dialogVisible.value = true;
}

function openEdit(row) {
  form.id = row.id;
  form.name = row.name;
  form.code = row.code;
  form.description = row.description || '';
  form.permissionIds = Array.isArray(row.permissionIds) ? [...row.permissionIds] : [];
  dialogTitle.value = '编辑角色';
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  const ok = await formRef.value.validate().catch(() => false);
  if (!ok) return;
  submitLoading.value = true;
  try {
    if (form.id) {
      await updateRole(form.id, { name: form.name, code: form.code, description: form.description, permissionIds: form.permissionIds });
      ElMessage.success('更新成功');
    } else {
      await createRole({ name: form.name, code: form.code, description: form.description, permissionIds: form.permissionIds });
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
    await deleteRole(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (err) {
    ElMessage.error(err.message);
  }
}

onMounted(() => {
  loadPermissions();
  loadData();
});
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.pagination { display: flex; justify-content: flex-end; padding: 12px 0 0; }
</style>
