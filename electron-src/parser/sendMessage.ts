import { app } from 'electron';
import { getMainWindow } from '../appMainWindow';

export const log = (message: string) => {
    sendMessage('log', message);
};

export const sendMessage = (channel: string, message: string): void => {
    getMainWindow().webContents.send(channel, message);
};

export const debug = (message: string) => {
    if (!app.isPackaged) {
        console.log(message);
    }
    sendMessage('debug', message);
};
