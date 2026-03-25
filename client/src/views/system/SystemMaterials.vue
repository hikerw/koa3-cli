<template>
  <div class="material-page">
    <MaterialsSidebar
      :groups="groups"
      :sidebar-group="sidebarGroup"
      @add-group="openAddGroupDialog"
      @set-group="setSidebarGroup"
      @edit-group="openEditGroup"
      @remove-group="removeGroup"
    />

    <div class="material-main">
      <MaterialsToolbar
        :type-tab="typeTab"
        :filters="filters"
        @upload-command="onUploadCommand"
        @toggle-type="toggleTypeTab"
        @search="searchNow"
        @update-filter="onFilterUpdate"
      />

      <MaterialsGrid
        ref="materialsGridRef"
        :loading="loading"
        :table-data="tableData"
        :selected-set="selectedSet"
        :selected-ids="selectedIds"
        :page-all-checked="pageAllChecked"
        :page-indeterminate="pageIndeterminate"
        :pagination="pagination"
        :display-src="displaySrc"
        :video-poster="videoPoster"
        :video-src-for-thumb="videoSrcForThumb"
        :card-title="cardTitle"
        :card-label="cardLabel"
        @multi-change="onMultiChange"
        @create="openCreateFromGrid"
        @toggle-select="toggleSelect"
        @preview="onMatCardBodyClick"
        @edit-item="onMatCardBodyDblClick"
        @copy-link="cardCopyLink"
        @quick-group="openQuickGroup"
        @delete-item="cardDelete"
        @toggle-page-all="togglePageAll"
        @open-bulk-group="saveToGroupDialogVisible = true"
        @bulk-delete="confirmBulkDelete"
        @set-page="pagination.page = $event"
        @set-page-size="pagination.pageSize = $event"
        @reload="loadData"
      />
    </div>

    <!-- 素材编辑 / 上传 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="560px" destroy-on-close @closed="onDialogClosed">
      <el-form :model="form" label-width="96px">
        <el-form-item label="分组">
          <el-select v-model="form.groupId" placeholder="未分组" clearable style="width: 100%">
            <el-option label="未分组" value="" />
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.id" label="当前类型">
          <span>{{ typeLabel(form.type) }}</span>
        </el-form-item>
        <el-form-item v-if="form.id" label="当前文件">
          <el-link v-if="form.url" :href="resolveUrl(form.url)" target="_blank" type="primary">{{ form.url }}</el-link>
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            ref="uploadRef"
            drag
            :auto-upload="false"
            :limit="1"
            :on-change="onFileChange"
            :on-exceed="onExceed"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽到此处，或 <em>点击选择</em></div>
            <template #tip>
              <div class="el-upload__tip">支持秒传；多文件请用顶部「上传 → 多文件上传」。</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="留空则用文件名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加 / 编辑分组 -->
    <el-dialog v-model="groupDialogVisible" :title="groupForm.id ? '编辑分组' : '添加分组'" width="400px" destroy-on-close>
      <el-form @submit.prevent>
        <el-form-item label="名称">
          <el-input v-model="groupForm.name" placeholder="分组名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="groupForm.order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="groupSaving" @click="saveGroup">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量保存到组 -->
    <el-dialog v-model="saveToGroupDialogVisible" title="保存到组" width="400px" destroy-on-close>
      <el-select v-model="bulkTargetGroupId" placeholder="选择分组" clearable style="width: 100%">
        <el-option label="未分组" value="" />
        <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
      </el-select>
      <template #footer>
        <el-button @click="saveToGroupDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="bulkSaving" @click="runBulkSaveToGroup">确定</el-button>
      </template>
    </el-dialog>

    <!-- 卡片快捷：移动分组 -->
    <el-dialog v-model="quickGroupDialogVisible" title="移动到分组" width="400px" destroy-on-close @closed="onQuickGroupClosed">
      <el-select v-if="quickGroupRow" v-model="quickGroupPick" placeholder="选择分组" clearable style="width: 100%">
        <el-option label="未分组" value="" />
        <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
      </el-select>
      <template #footer>
        <el-button @click="quickGroupDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="quickGroupSaving" @click="saveQuickGroup">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览文件（链接菜单） -->
    <el-dialog
      v-model="filePreviewVisible"
      :title="previewRow?.name || '预览文件'"
      width="720px"
      class="file-preview-dlg"
      destroy-on-close
      @closed="onFilePreviewClosed"
    >
      <div v-if="previewRow" class="file-preview-body">
        <video
          v-if="slideshowIsVideo(previewRow)"
          :src="resolveUrl(previewRow.url)"
          controls
          playsinline
          preload="metadata"
          class="preview-video"
        />
        <img v-else-if="previewRow.type === 'image'" :src="resolveUrl(previewRow.url)" alt="" class="preview-img" />
        <audio v-else-if="previewRow.type === 'audio'" :src="resolveUrl(previewRow.url)" controls class="preview-audio" />
        <div v-else class="preview-fallback">
          <p class="preview-fallback__tip">当前类型无法在窗口内预览</p>
          <el-link :href="absoluteAssetUrl(previewRow.url)" target="_blank" type="primary">新窗口打开</el-link>
        </div>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import {
  fetchMaterials,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  instantMaterial,
  bulkDeleteMaterials,
  bulkSetMaterialsGroup
} from '../../api/system/materials';
import {
  fetchMaterialGroups,
  createMaterialGroup,
  updateMaterialGroup,
  deleteMaterialGroup
} from '../../api/system/materialGroups';
import { md5File } from '../../utils/fileMd5';
import MaterialsSidebar from './components/materials/MaterialsSidebar.vue';
import MaterialsToolbar from './components/materials/MaterialsToolbar.vue';
import MaterialsGrid from './components/materials/MaterialsGrid.vue';

const groups = ref([]);
const sidebarGroup = ref('all');
const typeTab = ref('');
const filters = reactive({ name: '', url: '' });
const pagination = reactive({ page: 1, pageSize: 50, total: 0 });
const loading = ref(false);
const tableData = ref([]);

const selectedIds = ref([]);
const selectedSet = computed(() => new Set(selectedIds.value));

const pageAllChecked = computed(
  () => tableData.value.length > 0 && tableData.value.every((r) => selectedIds.value.includes(r.id))
);
const pageIndeterminate = computed(() => {
  const n = tableData.value.filter((r) => selectedIds.value.includes(r.id)).length;
  return n > 0 && n < tableData.value.length;
});

function toggleSelect(id, checked) {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id];
  } else {
    selectedIds.value = selectedIds.value.filter((x) => x !== id);
  }
}

function togglePageAll(val) {
  if (val) {
    const ids = new Set(selectedIds.value);
    tableData.value.forEach((r) => ids.add(r.id));
    selectedIds.value = Array.from(ids);
  } else {
    const pageIds = new Set(tableData.value.map((r) => r.id));
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.has(id));
  }
}

const materialsGridRef = ref();

const dialogVisible = ref(false);
const dialogTitle = ref('');
const uploadRef = ref();
const pendingFile = ref(null);
const submitLoading = ref(false);
const form = reactive({
  id: null,
  name: '',
  type: 'other',
  url: '',
  groupId: ''
});

const groupDialogVisible = ref(false);
const groupSaving = ref(false);
const groupForm = reactive({ id: null, name: '', order: 0 });

const saveToGroupDialogVisible = ref(false);
const bulkTargetGroupId = ref('');
const bulkSaving = ref(false);

const quickGroupDialogVisible = ref(false);
const quickGroupRow = ref(null);
const quickGroupPick = ref('');
const quickGroupSaving = ref(false);

const filePreviewVisible = ref(false);
const previewRow = ref(null);

const typeLabelMap = {
  image: '图片',
  video: '视频',
  audio: '音频',
  file: '文件',
  other: '其他'
};

function typeLabel(v) {
  return typeLabelMap[v] || v || '—';
}

function resolveUrl(u) {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return u;
}

/** 幻灯片/预览：避免 type 误标为 image 时用 img 加载 mp4（会像静态图） */
const SLIDESHOW_VIDEO_URL_RE = /\.(mp4|webm|ogg|ogv|mov|m4v|mkv|avi)(\?|#|$)/i;

function slideshowIsVideo(item) {
  if (!item?.url) return false;
  if (item.type === 'video') return true;
  const mime = String(item.mimeType || '').toLowerCase();
  if (mime.startsWith('video/')) return true;
  return SLIDESHOW_VIDEO_URL_RE.test(String(item.url));
}

function displaySrc(row) {
  if (!row) return '';
  const t = (row.thumbnail || '').trim();
  if (t) return resolveUrl(t);
  if (row.type === 'image' && row.url) return resolveUrl(row.url);
  return '';
}

/** 视频封面：优先用已存 poster（thumbnail），否则由首帧显示 */
function videoPoster(row) {
  if (!row) return '';
  const t = (row.thumbnail || '').trim();
  return t ? resolveUrl(t) : '';
}

/** 附带 #t 便于部分浏览器尽快解码首帧作画面 */
function videoSrcForThumb(row) {
  const base = resolveUrl(row?.url || '');
  if (!base) return '';
  if (base.includes('#')) return base;
  return `${base}#t=0.001`;
}

/** 卡片底部展示：优先名称截断 ，否则MD5 截断 */
function cardLabel(row) {
  return row.name || row.fileHash || '';
}

function cardTitle(row) {
  if (!row) return '';
  const parts = [row.name, row.fileHash && `MD5: ${row.fileHash}`, row.url].filter(Boolean);
  return parts.join('\n');
}

function absoluteAssetUrl(u) {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  const origin = window.location.origin;
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${origin}${path}`;
}

function uploadTargetGroupId() {
  if (sidebarGroup.value !== 'all' && sidebarGroup.value !== 'none') return sidebarGroup.value;
  return null;
}

function setSidebarGroup(key) {
  sidebarGroup.value = key;
  pagination.page = 1;
  selectedIds.value = [];
  loadData();
}

function toggleTypeTab(t) {
  typeTab.value = typeTab.value === t ? '' : t;
  pagination.page = 1;
  selectedIds.value = [];
  loadData();
}

function searchNow() {
  pagination.page = 1;
  loadData();
}

function onFilterUpdate(key, value) {
  if (key === 'name' || key === 'url') filters[key] = value;
}

async function loadGroups() {
  try {
    groups.value = await fetchMaterialGroups();
  } catch {
    groups.value = [];
  }
}

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchMaterials({
      page: pagination.page,
      pageSize: pagination.pageSize,
      group: sidebarGroup.value,
      typeTab: typeTab.value,
      name: filters.name?.trim(),
      url: filters.url?.trim()
    });
    tableData.value = res?.list ?? [];
    pagination.total = res?.total ?? 0;
  } catch (err) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function onUploadCommand(cmd) {
  if (cmd === 'single') openCreateFromGrid();
  else if (cmd === 'multi') materialsGridRef.value?.openMultiPicker?.();
}

function openCreateFromGrid() {
  openCreate();
}

function openAddGroupDialog() {
  groupForm.id = null;
  groupForm.name = '';
  groupForm.order = 0;
  groupDialogVisible.value = true;
}

function openEditGroup(g) {
  groupForm.id = g.id;
  groupForm.name = g.name;
  groupForm.order = g.order ?? 0;
  groupDialogVisible.value = true;
}

async function saveGroup() {
  if (!groupForm.name?.trim()) {
    ElMessage.warning('请输入分组名称');
    return;
  }
  groupSaving.value = true;
  try {
    if (groupForm.id) {
      await updateMaterialGroup(groupForm.id, { name: groupForm.name, order: groupForm.order });
      ElMessage.success('保存成功');
    } else {
      await createMaterialGroup({ name: groupForm.name, order: groupForm.order });
      ElMessage.success('添加成功');
    }
    groupDialogVisible.value = false;
    await loadGroups();
  } catch (e) {
    ElMessage.error(e.message || '失败');
  } finally {
    groupSaving.value = false;
  }
}

async function removeGroup(g) {
  try {
    await deleteMaterialGroup(g.id);
    ElMessage.success('删除成功');
    if (sidebarGroup.value === g.id) setSidebarGroup('all');
    await loadGroups();
    loadData();
  } catch (e) {
    ElMessage.error(e.message || '删除失败');
  }
}

function clearUpload() {
  pendingFile.value = null;
  uploadRef.value?.clearFiles();
}

function onDialogClosed() {
  clearUpload();
}

function onFileChange(uploadFile) {
  const raw = uploadFile?.raw || null;
  pendingFile.value = raw;
  if (raw) form.name = raw.name ? String(raw.name) : '';
}

function onExceed() {
  ElMessage.warning('单文件上传请选一个文件');
}

function openCreate() {
  clearUpload();
  form.id = null;
  form.name = '';
  form.type = 'other';
  form.url = '';
  form.groupId = uploadTargetGroupId() || '';
  dialogTitle.value = '上传素材';
  dialogVisible.value = true;
}

function openEdit(row) {
  clearUpload();
  form.id = row.id;
  form.name = row.name || '';
  form.type = row.type || 'other';
  form.url = row.url || '';
  form.groupId = row.groupId || '';
  dialogTitle.value = '编辑素材';
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.id && !pendingFile.value) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }
  const gid = form.groupId || null;
  submitLoading.value = true;
  try {
    if (form.id) {
      if (pendingFile.value) {
        const file = pendingFile.value;
        const submitName = (form.name || '').trim() || (file.name || '').trim();
        const md5 = await md5File(file);
        try {
          await instantMaterial({
            md5,
            size: file.size,
            materialId: form.id,
            name: submitName,
            groupId: gid
          });
          ElMessage.success('秒传成功');
        } catch (err) {
          const msg = err.message || '';
          if (!/未找到|请完整上传|not\s*found/i.test(msg)) throw err;
          await uploadMaterial({
            file,
            materialId: form.id,
            name: submitName,
            groupId: gid
          });
          ElMessage.success('已上传');
        }
      } else {
        await updateMaterial(form.id, {
          name: form.name,
          groupId: gid
        });
        ElMessage.success('已保存');
      }
    } else {
      const file = pendingFile.value;
      const submitName = (form.name || '').trim() || (file.name || '').trim();
      const md5 = await md5File(file);
      try {
        await instantMaterial({
          md5,
          size: file.size,
          name: submitName,
          groupId: gid
        });
        ElMessage.success('秒传成功');
      } catch (err) {
        const msg = err.message || '';
        if (!/未找到|请完整上传|not\s*found/i.test(msg)) throw err;
        await uploadMaterial({
          file,
          name: submitName,
          groupId: gid
        });
        ElMessage.success('上传成功');
      }
    }
    dialogVisible.value = false;
    loadData();
  } catch (err) {
    ElMessage.error(err.message || '提交失败');
  } finally {
    submitLoading.value = false;
  }
}

async function onMultiChange(ev) {
  const files = Array.from(ev.target.files || []);
  ev.target.value = '';
  if (!files.length) return;
  const gid = uploadTargetGroupId();
  submitLoading.value = true;
  try {
    for (const file of files) {
      const md5 = await md5File(file);
      try {
        await instantMaterial({
          md5,
          size: file.size,
          name: file.name || '',
          groupId: gid
        });
      } catch (err) {
        const msg = err.message || '';
        if (!/未找到|请完整上传|not\s*found/i.test(msg)) throw err;
        await uploadMaterial({ file, name: file.name || '', groupId: gid });
      }
    }
    ElMessage.success(`已处理 ${files.length} 个文件`);
    loadData();
  } catch (err) {
    ElMessage.error(err.message || '批量上传失败');
  } finally {
    submitLoading.value = false;
  }
}

async function runBulkSaveToGroup() {
  bulkSaving.value = true;
  try {
    const gid = bulkTargetGroupId.value === '' ? null : bulkTargetGroupId.value;
    await bulkSetMaterialsGroup(selectedIds.value, gid);
    ElMessage.success('已保存到分组');
    saveToGroupDialogVisible.value = false;
    bulkTargetGroupId.value = '';
    selectedIds.value = [];
    loadData();
  } catch (e) {
    ElMessage.error(e.message || '失败');
  } finally {
    bulkSaving.value = false;
  }
}

async function confirmBulkDelete() {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条素材？`, '提示', { type: 'warning' });
    await bulkDeleteMaterials(selectedIds.value);
    ElMessage.success('删除成功');
    selectedIds.value = [];
    loadData();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '删除失败');
  }
}

function onQuickGroupClosed() {
  quickGroupRow.value = null;
}

function onFilePreviewClosed() {
  previewRow.value = null;
}

/** 单击预览 / 双击编辑：避免连点时误开预览 */
let matCardClickTimer = null;
function onMatCardBodyClick(row) {
  if (matCardClickTimer) clearTimeout(matCardClickTimer);
  matCardClickTimer = setTimeout(() => {
    matCardClickTimer = null;
    openFilePreview(row);
  }, 280);
}

function onMatCardBodyDblClick(row) {
  if (matCardClickTimer) {
    clearTimeout(matCardClickTimer);
    matCardClickTimer = null;
  }
  openEdit(row);
}

function openFilePreview(row) {
  previewRow.value = row;
  filePreviewVisible.value = true;
}

function cardCopyLink(row) {
  const url = absoluteAssetUrl(row.url);
  if (!url) {
    ElMessage.warning('无可用链接');
    return;
  }
  navigator.clipboard.writeText(url).then(
    () => ElMessage.success('已复制'),
    () => ElMessage.error('复制失败，请手动复制')
  );
}

function openQuickGroup(row) {
  quickGroupRow.value = row;
  quickGroupPick.value = row.groupId || '';
  quickGroupDialogVisible.value = true;
}

async function saveQuickGroup() {
  if (!quickGroupRow.value) return;
  quickGroupSaving.value = true;
  try {
    const gid = quickGroupPick.value === '' ? null : quickGroupPick.value;
    await bulkSetMaterialsGroup([quickGroupRow.value.id], gid);
    ElMessage.success('已更新分组');
    quickGroupDialogVisible.value = false;
    loadData();
  } catch (e) {
    ElMessage.error(e.message || '失败');
  } finally {
    quickGroupSaving.value = false;
  }
}

async function cardDelete(row) {
  try {
    await deleteMaterial(row.id);
    selectedIds.value = selectedIds.value.filter((id) => id !== row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    ElMessage.error(e.message || '删除失败');
  }
}

onMounted(async () => {
  await loadGroups();
  loadData();
});
</script>

<style scoped>
.material-page {
  display: flex;
  gap: 16px;
  min-height: calc(100vh - 100px);
  margin: -8px 0 0;
}

.material-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--app-bg-card, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.file-preview-body {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-video {
  width: 100%;
  max-height: 70vh;
}

.preview-audio {
  width: 100%;
}

.preview-fallback {
  text-align: center;
  padding: 24px;
}

.preview-fallback__tip {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.upload-icon {
  font-size: 48px;
  color: var(--el-text-color-secondary);
}
</style>
