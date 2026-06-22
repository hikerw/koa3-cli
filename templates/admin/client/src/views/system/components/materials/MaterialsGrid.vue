<template>
  <input
    ref="multiInputRef"
    type="file"
    class="hidden-input"
    multiple
    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.rar,.txt"
    @change="$emit('multi-change', $event)"
  />

  <div class="grid-scroll" v-loading="loading">
    <div class="material-grid">
      <div class="mat-card mat-card--add" @click="$emit('create')">
        <el-icon :size="40"><Plus /></el-icon>
        <span>上传</span>
      </div>

      <div v-for="row in tableData" :key="row.id" class="mat-card">
        <el-checkbox
          class="card-check"
          :model-value="selectedSet.has(row.id)"
          @change="(v) => $emit('toggle-select', row.id, v)"
          @click.stop
        />
        <div
          class="mat-card__body"
          @click="$emit('preview', row)"
          @dblclick="$emit('edit-item', row)"
          title="单击预览文件，双击打开完整编辑"
        >
          <div class="mat-thumb-wrap">
            <div
              v-if="row.type === 'image' && displaySrc(row)"
              class="mat-image-shell"
              @dblclick.stop="$emit('edit-item', row)"
              title="单击预览文件，双击打开完整编辑"
            >
              <el-image :src="displaySrc(row)" fit="cover" class="mat-thumb" />
            </div>
            <div
              v-else-if="row.type === 'video' && row.url"
              class="mat-video-shell"
              @dblclick.stop="$emit('edit-item', row)"
              title="单击预览文件，双击打开完整编辑"
            >
              <video
                :key="row.id"
                :src="videoSrcForThumb(row)"
                class="mat-thumb mat-thumb--video"
                muted
                preload="metadata"
                playsinline
                :poster="videoPoster(row) || undefined"
              />
              <div class="video-play-overlay" aria-hidden="true">
                <el-icon :size="22"><VideoPlay /></el-icon>
              </div>
            </div>
            <div v-else class="mat-thumb mat-thumb--file">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <el-tooltip v-if="row.inUse" :content="usageTooltip(row)" placement="top" effect="dark">
              <el-tag class="mat-usage-badge" type="warning" size="small" effect="dark">
                使用中 {{ row.usageCount || 1 }}
              </el-tag>
            </el-tooltip>
          </div>
        </div>

        <div
          class="mat-card__footer-overlay"
          :title="cardTitle(row)"
          @click="$emit('preview', row)"
          @dblclick="$emit('edit-item', row)"
        >
          <div class="mat-name">{{ cardLabel(row) }}</div>
          <div class="mat-card__actions" @click.stop>
            <button type="button" class="act-link" @click="$emit('edit-item', row)">编辑</button>
            <button type="button" class="act-link" @click="$emit('copy-link', row)">链接</button>
            <button type="button" class="act-link" @click="$emit('quick-group', row)">分组</button>
            <el-tooltip v-if="row.inUse" :content="usageTooltip(row)" placement="top" effect="dark">
              <button type="button" class="act-link act-link--danger is-disabled">删除</button>
            </el-tooltip>
            <el-popconfirm
              v-else
              title="确定删除该素材？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="$emit('delete-item', row)"
            >
              <template #reference>
                <button type="button" class="act-link act-link--danger">删除</button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer class="bulk-footer">
    <el-checkbox :model-value="pageAllChecked" :indeterminate="pageIndeterminate" @change="$emit('toggle-page-all', $event)">
      全选
    </el-checkbox>
    <span class="sel-count">已选 {{ selectedIds.length }}/{{ tableData.length }} 项</span>
    <el-button :disabled="!selectedIds.length" @click="$emit('open-bulk-group')">保存到组</el-button>
    <el-button type="danger" plain :disabled="!selectedIds.length" @click="$emit('bulk-delete')">删除</el-button>
    <div class="footer-pagination">
      <span class="total-text">共 {{ pagination.total }} 条</span>
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="sizes, prev, pager, next, jumper"
        background
        @update:current-page="$emit('set-page', $event)"
        @update:page-size="$emit('set-page-size', $event)"
        @size-change="$emit('reload')"
        @current-change="$emit('reload')"
      />
    </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue';
import { Document, Plus, VideoPlay } from '@element-plus/icons-vue';

defineProps({
  loading: { type: Boolean, default: false },
  tableData: { type: Array, default: () => [] },
  selectedSet: { type: Object, required: true },
  selectedIds: { type: Array, default: () => [] },
  pageAllChecked: { type: Boolean, default: false },
  pageIndeterminate: { type: Boolean, default: false },
  pagination: { type: Object, required: true },
  displaySrc: { type: Function, required: true },
  videoPoster: { type: Function, required: true },
  videoSrcForThumb: { type: Function, required: true },
  cardTitle: { type: Function, required: true },
  cardLabel: { type: Function, required: true }
});

defineEmits([
  'multi-change',
  'create',
  'toggle-select',
  'preview',
  'edit-item',
  'copy-link',
  'quick-group',
  'delete-item',
  'toggle-page-all',
  'open-bulk-group',
  'bulk-delete',
  'set-page',
  'set-page-size',
  'reload'
]);

const multiInputRef = ref(null);
function openMultiPicker() {
  multiInputRef.value?.click();
}

function usageTooltip(row) {
  const refs = Array.isArray(row?.usageRefs) ? row.usageRefs : [];
  if (!refs.length) return '该素材正在被使用，不能删除';
  const text = refs
    .slice(0, 5)
    .map((item) => `${item.label || '业务引用'}：${item.title || '未命名'}`)
    .join('；');
  const total = Number(row.usageCount || refs.length);
  const more = total > 5 ? `；另有 ${total - 5} 处` : '';
  return `${text}${more}`;
}

defineExpose({ openMultiPicker });
</script>

<style lang="scss" scoped>
.hidden-input {
  display: none;
}

.grid-scroll {
  flex: 1;
  min-height: 280px;
  padding: 16px;
  overflow: auto;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(184px, 1fr));
  gap: 16px;
}

.mat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 8px;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  background: var(--el-fill-color-blank);
}

.mat-card:not(.mat-card--add):hover {
  background: #ebf5ff;
  border-color: #a0cfff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
}



.mat-card--add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: var(--el-text-color-secondary);
  border-style: dashed;
  gap: 8px;
  cursor: pointer;
}

.mat-card__body {
  cursor: pointer;
  flex: 0 0 auto;
}

.card-check {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
}

.mat-thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color);
}

.mat-image-shell {
  width: 100%;
  height: 100%;
}

.mat-image-shell :deep(.el-image) {
  width: 100%;
  height: 100%;
  display: block;
}

.mat-image-shell :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
}

.mat-thumb {
  width: 100%;
  height: 100%;
}

.mat-usage-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  max-width: calc(100% - 16px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.mat-video-shell {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-dark);
}

.mat-thumb--video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-play-overlay {
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.mat-thumb--file {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.mat-card__footer-overlay {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  padding: 6px 8px;
  border: 1px solid rgba(160, 207, 255, 0.35);
  border-radius: 6px;
  background: linear-gradient(
    180deg,
    rgba(235, 245, 255, 0.80) 0%,
    rgba(235, 245, 255, 0.88) 45%,
    rgba(235, 245, 255, 0.92) 100%
  );
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  overflow: hidden;
  transform: translateY(4px);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.mat-card:not(.mat-card--add):hover .mat-card__footer-overlay {
  transform: translateY(0);
  border-color: rgba(64, 158, 255, 0.45);
}


.mat-card__actions {
  margin-top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 6px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  overflow: hidden;
  max-height: 0;
  padding-top: 0;
  transform: translateY(6px);
  transition:
    opacity 0.15s ease,
    max-height 0.2s ease,
    transform 0.2s ease,
    visibility 0.15s ease;
}

.mat-card:not(.mat-card--add):hover .mat-card__actions {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  max-height: 56px;
  padding-top: 6px;
  transform: translateY(0);
}

.mat-name {
  font-size: 12px;
  margin: 0;
  padding: 0;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.act-link {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 8px;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  line-height: 1;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  border-radius: 7px;
  transition: background-color 0.15s ease, color 0.15s ease, filter 0.15s ease;
}

.act-link:hover {
  color: var(--el-color-primary);
  background-color: rgba(64, 158, 255, 0.12);
}

.act-link--primary {
  color: var(--el-color-primary);
  cursor: pointer;
  user-select: none;
  display: inline-block;
  white-space: nowrap;
  overflow: visible;
  flex: none;
  text-overflow: clip;
}

.act-link--primary:hover {
  filter: brightness(0.95);
  background-color: rgba(64, 158, 255, 0.12);
}

.act-link--danger:hover {
  color: var(--el-color-danger);
}

.act-link.is-disabled,
.act-link.is-disabled:hover {
  color: var(--el-text-color-placeholder);
  background: none;
  cursor: not-allowed;
}

.bulk-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-color-primary-light-9);
}

.sel-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.footer-pagination {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.total-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
html.dark .mat-card__footer-overlay {
  background: #161B22 !important;
  border-color: rgba(64, 158, 255, 0.25) !important;
}
html.dark .mat-card__footer-overlay .mat-name {
  color: #bdbcbc !important;
}
html.dark .mat-card__footer-overlay .act-link {
  color: rgba(255, 255, 255, 0.92) !important;
}

/* 深色：确保卡片 hover 边框也能变更（强制覆盖默认 hover） */
html.dark .mat-card:not(.mat-card--add):hover {
  background: rgba(64, 158, 255, 0.12) !important;
  border-color: #000 !important;
  box-shadow: none !important;
}


</style>
