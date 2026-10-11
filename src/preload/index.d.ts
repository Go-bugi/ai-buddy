export interface Api {
  ping: () => void;
  getAppVersion: () => Promise<string>;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
}

declare global {
  interface Window {
    api: Api;
  }
}
