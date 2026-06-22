<template>
  <div>
    <el-card shadow="hover">
      <div class="toolbar">
        <el-input v-model="filters.keyword" placeholder="名称/编码" clearable style="width: 200px" @keyup.enter="loadData" />
        <el-button type="primary" plain @click="loadData">查询</el-button>
        <el-button type="primary" @click="openCreate">新增权限</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" row-key="id" style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="code" label="编码" min-width="160" />
        <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
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

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="480px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="如 user:list" />
        </el-form-item>
        <el-form-item label="可访问菜单" prop="menuIds">
          <el-select v-model="form.menuIds" multiple placeholder="选择该权限可访问的菜单" style="width: 100%" filterable>
            <el-option v-for="m in menuOptions" :key="m.id" :label="m.title + (m.path ? ' ' + m.path : '')" :value="m.id" />
          </el-select>
          <div class="form-tip">勾选的菜单会随该权限赋给角色后对用户可见</div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" />
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
import { fetchPermissions, createPermission, updatePermission, deletePermission } from '../../api/system/permissions';
import { fetchMenus } from '../../api/system/menus';

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const filters = reactive({ keyword: '' });
const pagination = reactive({ page: 1, pageSize: 50, total: 0 });
const tableData = ref([]);
const menuOptions = ref([]);
const form = reactive({ id: null, name: '', code: '', description: '', menuIds: [] });
const rules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }], code: [{ required: true, message: '请输入编码', trigger: 'blur' }] };

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchPermissions({ page: pagination.page, pageSize: pagination.pageSize, keyword: filters.keyword?.trim() });
    tableData.value = res?.list ?? [];
    pagination.total = res?.total ?? 0;
  } catch (err) {
    ElMessage.error(err.message);
  } finally {
    loading.value = false;
  }
}

async function loadMenuOptions() {
  try {
    const res = await fetchMenus({ pageSize: 500 });
    menuOptions.value = Array.isArray(res?.list) ? res.list : [];
  } catch (_) {
    menuOptions.value = [];
  }
}

function openCreate() {
  form.id = null;
  form.name = '';
  form.code = '';
  form.description = '';
  form.menuIds = [];
  dialogTitle.value = '新增权限';
  dialogVisible.value = true;
}

function openEdit(row) {
  form.id = row.id;
  form.name = row.name;
  form.code = row.code;
  form.description = row.description || '';
  form.menuIds = Array.isArray(row.menuIds) ? [...row.menuIds] : [];
  dialogTitle.value = '编辑权限';
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  const ok = await formRef.value.validate().catch(() => false);
  if (!ok) return;
  submitLoading.value = true;
  try {
    const payload = {
      name: form.name,
      code: form.code,
      description: form.description,
      menuIds: form.menuIds || []
    };
    if (form.id) {
      await updatePermission(form.id, payload);
      ElMessage.success('更新成功');
    } else {
      await createPermission(payload);
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
    await deletePermission(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (err) {
    ElMessage.error(err.message);
  }
}

onMounted(() => {
  loadMenuOptions();
  loadData();
});
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.pagination { display: flex; justify-content: flex-end; padding: 12px 0 0; }
.form-tip { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
</style>
