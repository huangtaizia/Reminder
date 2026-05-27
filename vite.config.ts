import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  // Important for Electron (file://) - avoid absolute /assets paths
  base: './',
  plugins: [
    // viteStaticCopy({
    //   targets: [
    //     {
    //       src: 'src/electron/popup.html',
    //       dest: 'electron'
    //     }
    //   ]
    // }),
    react()
  ],
  server: {
    strictPort: true,
    host: '127.0.0.1',
    // Windows: một số môi trường (Cursor, sync folder) không bắt được save file → HMR không chạy
    watch: {
      usePolling: process.platform === 'win32',
      interval: 300,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});

