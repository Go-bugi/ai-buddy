// main / preload / renderer 를 순서대로 프로덕션 빌드한다.
import { build } from 'vite';

const configs = ['vite.main.config.ts', 'vite.preload.config.ts', 'vite.renderer.config.ts'];

for (const configFile of configs) {
  await build({ configFile, mode: 'production' });
}
