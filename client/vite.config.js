import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // 构建产物使用相对路径引用 JS/CSS，前端可部署在任意子目录（如 /admin/）而无需重新打包。
  // 开发服务器下 Vite 会把相对 base 当作 '/' 处理，不影响本地联调。
  base: './',
  build: {
    // Element Plus 完整组件库会形成独立 vendor 包，阈值按后台模板的实际依赖体量调整。
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        /**
         * 后台管理端页面已使用路由懒加载，公共依赖继续按职责拆包。
         * 这样入口包只保留启动代码，Vue、Element Plus、HTTP 等依赖可独立缓存。
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('element-plus') || id.includes('@element-plus')) return 'element-plus';
          if (id.includes('vue')) return 'vue-vendor';
          if (id.includes('axios')) return 'http-vendor';
          return 'vendor';
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
