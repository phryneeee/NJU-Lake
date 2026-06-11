import { defineConfig } from 'vite';

// base './' 以便日后直接放入 Capacitor webDir
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    host: true,
  },
});
