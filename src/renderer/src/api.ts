import { getTauriVersion, getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';

// Rust 쪽과 통신하는 함수는 여기에만 둔다. 컴포넌트에서 invoke를 직접 부르지 않는다.
// 명령 이름과 인자는 src-tauri/src/lib.rs의 #[tauri::command]와 맞춘다.
export const api = {
  ping: (): Promise<void> => invoke('ping'),
  getAppVersion: (): Promise<string> => getVersion(),
  getTauriVersion: (): Promise<string> => getTauriVersion(),
};
