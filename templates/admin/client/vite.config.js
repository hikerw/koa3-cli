import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    // Element Plus 完整组件库会形成独立 vendor 包，阈值按后台模板的实际依赖体量调整。
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        /**
         * 后台模板默认完整引入 Element Plus，公共依赖体积会集中到入口包。
         * 这里按依赖职责拆分 vendor chunk，配合路由懒加载降低首屏入口包体积。
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
