import Electron from 'electron';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    interface Window {
        electron: {
            send: (channel: string, ...args: any[]) => void;
            receive: (
                channel: string,
                handler: (
                    event: Electron.IpcRendererEvent,
                    ...args: any[]
                ) => void,
            ) => void;
            removeAllListeners: (channel: string) => void;
        };
    }
}

export type User = {
    id: number;
    name: string;
};
