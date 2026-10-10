// 개발 서버
// - renderer: Vite dev 서버 (HMR)
// - preload: 변경 시 다시 빌드하고 renderer 새로고침
// - main: 변경 시 다시 빌드하고 Electron 재시작
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { build, createServer } from 'vite';

const require = createRequire(import.meta.url);
// electron 패키지는 실행 파일 경로를 export 한다 (바이너리가 없으면 이때 다운로드)
const electronPath = require('electron');

/** @type {import('node:child_process').ChildProcess | null} */
let electronProcess = null;
let isRestarting = false;

function startElectron(devServerUrl) {
  // --inspect: main 프로세스 디버거(9229), --remote-debugging-port: renderer 디버거(9222)
  electronProcess = spawn(electronPath, ['--inspect=9229', '--remote-debugging-port=9222', '.'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_DEV_SERVER_URL: devServerUrl },
  });

  electronProcess.on('exit', () => {
    // 사용자가 창을 닫아 종료한 경우에는 dev 서버도 함께 종료
    if (!isRestarting) shutdown();
  });
}

function restartElectron(devServerUrl) {
  if (!electronProcess) {
    startElectron(devServerUrl);
    return;
  }

  isRestarting = true;
  electronProcess.once('exit', () => {
    isRestarting = false;
    startElectron(devServerUrl);
  });
  electronProcess.kill();
}

/** watch 빌드를 시작하고, 빌드가 끝날 때마다 onBuilt 호출. 첫 빌드가 끝나면 resolve */
async function watchBuild(configFile, onBuilt) {
  const watcher = await build({
    configFile,
    mode: 'development',
    build: { watch: {} },
  });

  await new Promise((resolve) => {
    watcher.on('event', (event) => {
      if (event.code === 'BUNDLE_END') event.result.close();
      if (event.code === 'END') {
        onBuilt();
        resolve();
      }
    });
  });

  return watcher;
}

const rendererServer = await createServer({
  configFile: 'vite.renderer.config.ts',
  mode: 'development',
});
await rendererServer.listen();
rendererServer.printUrls();
const devServerUrl = rendererServer.resolvedUrls.local[0];

const preloadWatcher = await watchBuild('vite.preload.config.ts', () => {
  rendererServer.ws.send({ type: 'full-reload' });
});
const mainWatcher = await watchBuild('vite.main.config.ts', () => {
  restartElectron(devServerUrl);
});

let isShuttingDown = false;
async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  isRestarting = true;
  electronProcess?.kill();
  await Promise.all([mainWatcher.close(), preloadWatcher.close(), rendererServer.close()]);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
