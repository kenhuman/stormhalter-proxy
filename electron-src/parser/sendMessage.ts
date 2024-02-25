import isDev from 'electron-is-dev';
import { getMainWindow } from '../appMainWindow';

export const log = (message: string) => {
    sendMessage('log', message);
};

export const sendMessage = (channel: string, message: string): void => {
    getMainWindow().webContents.send(channel, message);
};

export const debug = (message: string) => {
    if (isDev) {
        console.log(message);
        sendMessage('debug', message);
    }
};
