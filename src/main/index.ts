import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';

const isDev = !app.isPackaged;

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // 외부 링크는 기본 브라우저로 열고, 새 Electron 창은 띄우지 않는다.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // 개발: F12로 DevTools 토글 / 프로덕션: 새로고침 단축키 차단
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    if (isDev && input.code === 'F12') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
      return;
    }

    const isReload = input.code === 'KeyR' && (input.control || input.meta);
    if (!isDev && isReload) {
      event.preventDefault();
    }
  });

  // 개발 모드에서는 Vite dev 서버(HMR), 그 외에는 빌드된 HTML을 로드한다.
  const devServerUrl = process.env['VITE_DEV_SERVER_URL'];
  if (isDev && devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  // Windows 알림/작업 표시줄 그룹핑용 ID (electron-builder.yml의 appId와 동일하게 유지)
  if (process.platform === 'win32') {
    app.setAppUserModelId(isDev ? process.execPath : 'com.aibuddy.app');
  }

  ipcMain.on('ping', () => console.log('pong'));
  ipcMain.handle('app:get-version', () => app.getVersion());

  createWindow();

  // macOS: 독 아이콘 클릭 시 열린 창이 없으면 새로 만든다.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// macOS를 제외하고 모든 창이 닫히면 앱을 종료한다.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
