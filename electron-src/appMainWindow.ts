import { BrowserWindow } from "electron";
import { join } from "node:path";

let mainWindow: BrowserWindow;

export const createMainWindow = (height?: number, width?: number): BrowserWindow => {
    mainWindow = new BrowserWindow({
        width,
        height,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: join(__dirname, 'preload.js'),
        },
    });
    return mainWindow;
}

export const getMainWindow = (): BrowserWindow => mainWindow;