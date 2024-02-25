import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    send: (channel: string, ...args: any[]): void => {
        ipcRenderer.send(channel, args);
    },
    receive: (
        channel: string,
        handler: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
    ): void => {
        ipcRenderer.on(channel, handler);
    },
    removeAllListeners: (channel: string): void => {
        ipcRenderer.removeAllListeners(channel);
    },
});
