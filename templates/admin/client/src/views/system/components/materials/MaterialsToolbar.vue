<template>
  <div class="top-toolbar">
    <el-dropdown trigger="click" @command="$emit('upload-command', $event)">
      <el-button type="primary">
        <el-icon class="el-icon--left"><Upload /></el-icon>
        上传
        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="single">单文件上传</el-dropdown-item>
          <el-dropdown-item command="multi">多文件上传</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-button-group class="type-tabs">
      <el-button :type="typeTab === 'image' ? 'primary' : 'default'" @click="$emit('toggle-type', 'image')">图片</el-button>
      <el-button :type="typeTab === 'video' ? 'primary' : 'default'" @click="$emit('toggle-type', 'video')">视频</el-button>
      <el-button :type="typeTab === 'other' ? 'primary' : 'default'" @click="$emit('toggle-type', 'other')">其他</el-button>
    </el-button-group>

    <el-input
      :model-value="filters.name"
      class="search-input"
      placeholder="请输入名称搜索..."
      clearable
      @update:model-value="$emit('update-filter', 'name', $event)"
      @keyup.enter="$emit('search')"
    >
      <template #suffix>
        <el-icon class="search-ico" @click="$emit('search')"><Search /></el-icon>
      </template>
    </el-input>

    <el-input
      :model-value="filters.url"
      class="search-input"
      placeholder="请输入URL搜索..."
      clearable
      @update:model-value="$emit('update-filter', 'url', $event)"
      @keyup.enter="$emit('search')"
    >
      <template #suffix>
        <el-icon class="search-ico" @click="$emit('search')"><Search /></el-icon>
      </template>
    </el-input>
  </div>
</template>

<script setup>
import { ArrowDown, Search, Upload } from '@element-plus/icons-vue';

defineProps({
  typeTab: { type: String, default: '' },
  filters: {
    type: Object,
    default: () => ({ name: '', url: '' })
  }
});

defineEmits(['upload-command', 'toggle-type', 'search', 'update-filter']);
</script>

<style lang="scss" scoped>
.top-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.type-tabs {
  flex-shrink: 0;
}

.search-input {
  width: 200px;
}

.search-ico {
  cursor: pointer;
  color: var(--el-color-primary);
}
</style>
