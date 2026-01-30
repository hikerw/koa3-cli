import { createRouter, createWebHistory } from 'vue-router';
import Login from './views/Login.vue';
import App from './App.vue';

const routes = [
  { path: '/login', component: Login },
  { path: '/', component: App }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
