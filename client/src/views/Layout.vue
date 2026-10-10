<template>
  <el-container class="app-layout">
    <el-aside class="aside" :width="asideWidth">
      <div class="logo" :class="{ 'logo--collapsed': isCollapse }">
        <span class="logo-text" v-show="!isCollapse">{{ appTitle }}</span>
        <span class="logo-text logo-text--short" v-show="isCollapse">{{ appTitleShort }}</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :default-openeds="defaultOpeneds"
        :collapse="isCollapse"
        :collapse-transition="true"
        class="aside-menu"
        router
      >
        <template v-if="menuTree.length">
          <template v-for="item in menuTree" :key="item.id">
            <el-sub-menu v-if="item.children && item.children.length" :index="'sub-' + item.id">
              <template #title>
                <el-icon><component :is="getIcon(item.icon)" /></el-icon>
                <span>{{ item.title }}</span>
              </template>
              <template v-for="child in item.children" :key="child.id">
                <el-sub-menu v-if="child.children && child.children.length" :index="'sub-' + child.id">
                  <template #title>
                    <el-icon><component :is="getIcon(child.icon)" /></el-icon>
                    <span>{{ child.title }}</span>
                  </template>
                  <el-menu-item v-for="c in child.children" :key="c.id" :index="c.path || '#'">
                    <el-icon><component :is="getIcon(c.icon)" /></el-icon>
                    <span>{{ c.title }}</span>
                  </el-menu-item>
                </el-sub-menu>
                <el-menu-item v-else :index="child.path || '#'">
                  <el-icon><component :is="getIcon(child.icon)" /></el-icon>
                  <span>{{ child.title }}</span>
                </el-menu-item>
              </template>
            </el-sub-menu>
            <el-menu-item v-else :index="item.path || '/'">
              <el-icon><component :is="getIcon(item.icon)" /></el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </template>
        </template>
        <template v-else>
          <el-menu-item index="menu-status" disabled>
            <span>{{ menuLoading ? '菜单加载中' : menuError ? '菜单加载失败' : '暂无可访问菜单' }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container class="main-wrap">
      <el-header class="header">
        <div class="header-left">
          <el-tooltip :content="isCollapse ? '展开菜单' : '折叠菜单'" placement="right">
            <el-button link class="collapse-btn" @click="toggleCollapse" :aria-label="isCollapse ? '展开' : '折叠'">
              <el-icon :size="20"><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
        <div class="header-actions">
          <el-tooltip :content="isDark ? '切换为浅色' : '切换为深色'" placement="bottom">
            <el-button link class="theme-toggle" @click="toggleTheme" :aria-label="isDark ? '浅色模式' : '深色模式'">
              <el-icon :size="20"><Sunny v-if="isDark" /><Moon v-else /></el-icon>
            </el-button>
          </el-tooltip>
          <span class="admin-name">{{ adminUsername }}</span>
          <el-button link @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import * as Icons from '@element-plus/icons-vue';
import { Document, Sunny, Moon, Fold, Expand } from '@element-plus/icons-vue';
import { fetchCurrentUserMenus } from '../api/system/menus';
import { useTheme } from '../composables/useTheme';
import { appTitle, appTitleShort } from '../config/app';

const COLLAPSE_KEY = 'aside_collapse';

const isCollapse = ref(localStorage.getItem(COLLAPSE_KEY) === '1');
const asideWidth = computed(() => (isCollapse.value ? '64px' : '220px'));

function toggleCollapse() {
  isCollapse.value = !isCollapse.value;
  localStorage.setItem(COLLAPSE_KEY, isCollapse.value ? '1' : '0');
}

const router = useRouter();
const menuTree = ref([]);
const menuLoading = ref(true);
const menuError = ref(false);

const activeMenu = computed(() => router.currentRoute.value.path);

const adminInfo = computed(() => {
  try {
    const raw = localStorage.getItem('admin');
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
});

const adminUsername = computed(() => adminInfo.value?.username ?? '');

function getIcon(name) {
  if (!name || typeof name !== 'string') return Document;
  const key = name.trim();
  if (!key) return Document;
  const icon = Icons[key] || Icons[key + 'Filled'] || Icons[key + 'Outlined'];
  return icon || Document;
}

function collectOpenedIds(tree, path, prefix = '') {
  const opened = [];
  for (const item of tree || []) {
    const subIndex = 'sub-' + item.id;
    if (item.children && item.children.length) {
      const hasActive = findPathInTree(item.children, path);
      if (hasActive) opened.push(subIndex);
      const nested = collectOpenedIds(item.children, path, subIndex);
      opened.push(...nested);
    }
  }
  return opened;
}

function findPathInTree(tree, path) {
  for (const item of tree || []) {
    if (item.path === path) return true;
    if (item.children && findPathInTree(item.children, path)) return true;
  }
  return false;
}

const defaultOpeneds = computed(() => collectOpenedIds(menuTree.value, activeMenu.value));

const { isDark, toggleTheme } = useTheme();

async function loadMenuTree() {
  menuLoading.value = true;
  menuError.value = false;
  try {
    const tree = await fetchCurrentUserMenus();
    menuTree.value = Array.isArray(tree) ? tree : [];
  } catch (_) {
    menuTree.value = [];
    menuError.value = true;
  } finally {
    menuLoading.value = false;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('admin');
  localStorage.removeItem('menu_cache');
  router.replace('/login');
  window.location.reload();
}

onMounted(loadMenuTree);
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}
.aside {
  background: var(--app-bg-card);
  border-right: 1px solid var(--el-border-color-lighter);
  transition: width 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: var(--app-text-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: color 0.2s ease;
  overflow: hidden;
  white-space: nowrap;
}
.logo-text--short {
  font-size: 14px;
}
.aside-menu.el-menu--collapse {
  width: 100%;
}
.aside-menu {
  border-right: none;
}
.collapse-btn {
  padding: 4px;
  color: var(--app-text-secondary);
}
.collapse-btn:hover {
  color: var(--el-color-primary);
}
.header-left {
  display: flex;
  align-items: center;
}
.main-wrap {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--app-bg-page);
  transition: background-color 0.2s ease;
}
.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--app-bg-card);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: background-color 0.2s ease;
}
html.dark .header {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.theme-toggle {
  padding: 4px;
  color: var(--app-text-secondary);
}
.theme-toggle:hover {
  color: var(--el-color-primary);
}
.admin-name {
  font-size: 14px;
  color: var(--app-text-secondary);
  transition: color 0.2s ease;
}
.main {
  padding: 20px;
  flex: 1;
}
</style>
