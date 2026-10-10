import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Electron main 프로세스: Node(CJS)용으로 의존성까지 하나의 파일로 번들
export default defineConfig(({ mode }) => ({
  build: {
    ssr: true,
    outDir: 'out/main',
    emptyOutDir: true,
    target: 'node24',
    sourcemap: mode === 'development',
    minify: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/main/index.ts'),
      external: ['electron'],
      output: {
        format: 'cjs',
        entryFileNames: 'index.js',
      },
    },
  },
  ssr: {
    // node 내장 모듈과 electron 외에는 모두 번들 → 패키징 시 node_modules 불필요
    noExternal: true,
  },
}));
