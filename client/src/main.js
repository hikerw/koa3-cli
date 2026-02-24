import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
// Element Plus 官方暗黑模式：html 有 .dark 时生效
import 'element-plus/theme-chalk/dark/css-vars.css';
import { initTheme } from './composables/useTheme';
import './styles/base.css';
import './styles/dark.css';
import App from './App.vue';
import router from './router';

initTheme();

const app = createApp(App);
app.use(ElementPlus, { locale: zhCn });
app.use(router);
app.mount('#app');
