import { contextBridge, ipcRenderer } from 'electron';
import type { Api } from './index.d';

// renderer에 노출할 API. ipcRenderer를 통째로 노출하지 않고 필요한 채널만 감싼다.
const api: Api = {
  ping: () => ipcRenderer.send('ping'),
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
};

contextBridge.exposeInMainWorld('api', api);
