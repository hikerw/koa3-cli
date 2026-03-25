import { createRouter, createWebHistory } from 'vue-router';
import Login from './views/Login.vue';
import Layout from './views/Layout.vue';
import Home from './views/Home.vue';
import SystemUsers from './views/system/SystemUsers.vue';
import SystemRoles from './views/system/SystemRoles.vue';
import SystemPermissions from './views/system/SystemPermissions.vue';
import SystemMenus from './views/system/SystemMenus.vue';
import SystemLogs from './views/system/SystemLogs.vue';
import SystemMaterials from './views/system/SystemMaterials.vue';

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
