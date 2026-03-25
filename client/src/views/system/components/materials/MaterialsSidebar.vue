<template>
  <aside class="material-aside">
    <el-button class="add-group-btn" plain @click="$emit('add-group')">
      <el-icon><Plus /></el-icon>
      添加分组
    </el-button>
    <ul class="group-list" role="list">
      <li :class="['group-item', { active: sidebarGroup === 'all' }]" @click="$emit('set-group', 'all')">全部</li>
      <li :class="['group-item', { active: sidebarGroup === 'none' }]" @click="$emit('set-group', 'none')">未分组</li>
      <li
        v-for="g in groups"
        :key="g.id"
        :class="['group-item', { active: sidebarGroup === g.id }]"
        @click="$emit('set-group', g.id)"
      >
        <span class="group-item__title">{{ g.name }}</span>
        <span class="group-item__actions" @click.stop>
          <el-button type="primary" link :icon="Edit" circle @click="$emit('edit-group', g)" />
          <el-popconfirm title="删除分组？旗下素材将退回「未分组」" @confirm="$emit('remove-group', g)">
            <template #reference>
              <el-button type="danger" link :icon="Delete" circle />
            </template>
          </el-popconfirm>
        </span>
      </li>
    </ul>
  </aside>
</template>

<script setup>
import { Delete, Edit, Plus } from '@element-plus/icons-vue';

defineProps({
  groups: { type: Array, default: () => [] },
  sidebarGroup: { type: String, default: 'all' }
});

defineEmits(['add-group', 'set-group', 'edit-group', 'remove-group']);
</script>

<style lang="scss" scoped>
.material-aside {
  width: 220px;
  flex-shrink: 0;
  background: var(--app-bg-card, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
}

.add-group-btn {
  width: 100%;
  margin-bottom: 12px;
  border-style: dashed;
}

.group-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 4px;
  gap: 6px;
}

.group-item:hover {
  background: var(--el-fill-color-light);
}

.group-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.group-item__title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-item__actions {
  display: flex;
  align-items: center;
  opacity: 0.75;
}
</style>
