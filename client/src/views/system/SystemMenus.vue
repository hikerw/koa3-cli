<template>
  <div>
    <el-card shadow="hover">
      <div class="toolbar">
        <el-input v-model="filters.keyword" placeholder="标题/路径" clearable style="width: 200px" @keyup.enter="loadData" />
        <el-button type="primary" plain @click="loadData">查询</el-button>
        <el-button type="primary" @click="openCreate(null)">新增菜单</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" row-key="id" style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="140" />
        <el-table-column prop="path" label="路径" min-width="160" />
        <el-table-column prop="icon" label="图标" width="100" />
        <el-table-column prop="order" label="排序" width="80" />
        <el-table-column prop="permissionCode" label="权限编码" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openCreate(row)">子菜单</el-button>
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
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="菜单标题" />
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="form.path" placeholder="如 /system/users" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-select
            v-model="form.icon"
            placeholder="选择图标（可搜索）"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option v-for="item in iconOptions" :key="item.value || '_none'" :label="item.label" :value="item.value">
              <span style="display: flex; align-items: center; gap: 8px;">
                <el-icon v-if="item.component"><component :is="item.component" /></el-icon>
                <span>{{ item.label }}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="上级菜单" prop="parentId" v-if="parentOptions.length">
          <el-select v-model="form.parentId" placeholder="无" clearable style="width: 100%">
            <el-option label="无" value="" />
            <el-option v-for="m in parentOptions" :key="m.id" :label="m.title || m.id" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="order">
          <el-input-number v-model="form.order" :min="0" />
        </el-form-item>
        <el-form-item label="权限编码" prop="permissionCode">
          <el-input v-model="form.permissionCode" placeholder="可选，用于控制显示" />
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
import * as Icons from '@element-plus/icons-vue';
import { fetchMenus, createMenu, updateMenu, deleteMenu } from '../../api/system/menus';

// 从 @element-plus/icons-vue 收集全部图标（排除 default 等非组件导出）
const iconOptions = computed(() => {
  const list = [{ value: '', label: '无', component: null }];
  const entries = Object.entries(Icons).filter(([key, val]) => {
    if (key === 'default') return false;
    if (typeof val === 'function') return true;
    return typeof val === 'object' && val !== null && (val.render || val?.__name || val?.name);
  });
  entries
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, comp]) => list.push({ value: key, label: key, component: comp }));
  return list;
});

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const filters = reactive({ keyword: '' });
const pagination = reactive({ page: 1, pageSize: 50, total: 0 });
const tableData = ref([]);
const parentOptions = ref([]);
const form = reactive({ id: null, title: '', path: '', icon: '', parentId: '', order: 0, permissionCode: '' });
const rules = [{ required: true, message: '请输入标题', trigger: 'blur' }];

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchMenus({ page: pagination.page, pageSize: pagination.pageSize, keyword: filters.keyword?.trim() });
    tableData.value = res?.list ?? [];
    pagination.total = res?.total ?? 0;
  } catch (err) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

async function loadParents() {
  try {
    const res = await fetchMenus({ pageSize: 500 });
    const list = res?.list ?? [];
    parentOptions.value = Array.isArray(list) ? list.filter((m) => m && (m.id != null && m.id !== '') && !m.parentId) : [];
  } catch (_) {
    parentOptions.value = [];
  }
}

function openCreate(parent) {
  form.id = null;
  form.title = '';
  form.path = '';
  form.icon = '';
  form.parentId = parent && parent.id ? parent.id : '';
  form.order = 0;
  form.permissionCode = '';
  dialogTitle.value = parent ? `新增子菜单（上级：${parent.title}）` : '新增菜单';
  dialogVisible.value = true;
}

function openEdit(row) {
  form.id = row.id;
  form.title = row.title;
  form.path = row.path || '';
  form.icon = row.icon || '';
  form.parentId = row.parentId || '';
  form.order = row.order ?? 0;
  form.permissionCode = row.permissionCode || '';
  dialogTitle.value = '编辑菜单';
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate().catch(() => {});
  submitLoading.value = true;
  try {
    const payload = { title: form.title, path: form.path, icon: form.icon, parentId: form.parentId || null, order: form.order, permissionCode: form.permissionCode };
    if (form.id) {
      await updateMenu(form.id, payload);
      ElMessage.success('更新成功');
    } else {
      await createMenu(payload);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadData();
    loadParents();
  } catch (err) {
    ElMessage.error(err.message || '提交失败');
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete(row) {
  try {
    await deleteMenu(row.id);
    ElMessage.success('删除成功');
    loadData();
    loadParents();
  } catch (err) {
    ElMessage.error(err.message || '删除失败');
  }
}

onMounted(() => {
  loadParents();
  loadData();
});
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.pagination { display: flex; justify-content: flex-end; padding: 12px 0 0; }
</style>
