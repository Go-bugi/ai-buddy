import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Preload 스크립트: sandbox 모드에서 동작하도록 CJS 단일 파일로 번들
export default defineConfig(({ mode }) => ({
  build: {
    ssr: true,
    outDir: 'out/preload',
    emptyOutDir: true,
    target: 'node24',
    sourcemap: mode === 'development' ? 'inline' : false,
    minify: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/preload/index.ts'),
      external: ['electron'],
      output: {
        format: 'cjs',
        entryFileNames: 'index.js',
      },
    },
  },
  ssr: {
    noExternal: true,
  },
}));
