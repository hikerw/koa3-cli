import { createRouter, createWebHistory } from 'vue-router';

// 页面组件使用路由级懒加载，避免后台管理端所有页面在首屏一次性打进主包。
const Login = () => import('./views/Login.vue');
const Layout = () => import('./views/Layout.vue');
const Home = () => import('./views/Home.vue');
const SystemUsers = () => import('./views/system/SystemUsers.vue');
const SystemRoles = () => import('./views/system/SystemRoles.vue');
const SystemPermissions = () => import('./views/system/SystemPermissions.vue');
const SystemMenus = () => import('./views/system/SystemMenus.vue');
const SystemLogs = () => import('./views/system/SystemLogs.vue');
const SystemMaterials = () => import('./views/system/SystemMaterials.vue');
const SystemStorage = () => import('./views/system/SystemStorage.vue');

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { public: true } },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', name: 'Home', component: Home },
      { path: 'system/users', name: 'SystemUsers', component: SystemUsers },
      { path: 'system/roles', name: 'SystemRoles', component: SystemRoles },
      { path: 'system/permissions', name: 'SystemPermissions', component: SystemPermissions },
      { path: 'system/menus', name: 'SystemMenus', component: SystemMenus },
      { path: 'system/logs', name: 'SystemLogs', component: SystemLogs },
      { path: 'system/storage', name: 'SystemStorage', component: SystemStorage },
      { path: 'materials', name: 'Materials', component: SystemMaterials }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from) => {
  const token = localStorage.getItem('token');
  if (to.meta.public) {
    if (token && to.path === '/login') return '/';
    return;
  }
  if (!token) return '/login';
});

export default router;
