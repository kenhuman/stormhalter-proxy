import { app } from 'electron';
import isDev from 'electron-is-dev';
import prepareNext from 'electron-next';
import { createMainWindow } from './appMainWindow';
import { UdpProxyOptions } from './parser/UdpProxy';
import Proxy from './parser/Proxy';

const initProxy = (): Proxy => {
    const proxyOptions: UdpProxyOptions = {
        remoteAddress: '74.208.130.140',
        remotePort: 2593,
        localAddress: '0.0.0.0',
        localPort: 53535,
    };

    const proxy = new Proxy(proxyOptions);
    return proxy;
};

// Prepare the renderer once the app is ready
app.on('ready', async () => {
    await prepareNext('./renderer');

    const mainWindow = createMainWindow();
    mainWindow.webContents.openDevTools();

    const url = isDev
        ? 'http://localhost:8000/'
        : new URL(
              '../renderer/out/index.html',
              `https://${__dirname}`,
          ).toString();

    await mainWindow.loadURL(url);

    initProxy();
});

// Quit the app once all windows are closed
app.on('window-all-closed', app.quit);
