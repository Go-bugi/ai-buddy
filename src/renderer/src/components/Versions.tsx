import { useEffect, useState } from 'react';

function Versions(): React.JSX.Element {
  const [versions] = useState(window.api.versions);
  const [appVersion, setAppVersion] = useState<string>();

  useEffect(() => {
    void window.api.getAppVersion().then(setAppVersion);
  }, []);

  return (
    <ul className="versions">
      {appVersion && <li className="app-version">AI Buddy v{appVersion}</li>}
      <li className="electron-version">Electron v{versions.electron}</li>
      <li className="chrome-version">Chromium v{versions.chrome}</li>
      <li className="node-version">Node v{versions.node}</li>
    </ul>
  );
}

export default Versions;
