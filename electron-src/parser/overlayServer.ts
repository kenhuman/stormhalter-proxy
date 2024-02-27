import * as net from 'node:net';
import { exec, spawn } from 'node:child_process';
import { debug } from './sendMessage';

interface OverlayServer {
    server?: net.Server;
    client?: net.Socket;
}

interface SendMessageOptions {
    key: string;
    x: number;
    y: number;
    red?: number;
    green?: number;
    blue?: number;
    alpha?: number;
    duration?: number;
    fontSize?: number;
    fontName?: string;
}

const connection: OverlayServer = {};

export const createOverlayServer = async (): Promise<void> => {
    const server = net.createServer((socket) => {
        debug('Overlay Provider connected...');
        connection.client = socket;
        connection.server = server;
    });

    server.listen('\\\\.\\pipe\\kesmaiOverlay');

    await checkForOverlayProcess();
};

export const sendOverlayData = async (data: string) => {
    if (!(await checkForOverlayProcess())) {
        debug('checkForOVerlayProcess failed.');
        return false;
    }
    if (data.length > 255) {
        throw new Error('Data will overflow.');
    }
    connection.client?.write(`${data}\0`);
    return true;
};

export const sendOverlayMessage = (
    message: string,
    options?: SendMessageOptions,
) => {
    options = options ?? {
        key: 'default',
        x: 0,
        y: 0,
    };

    if (
        options.red !== undefined &&
        options.green !== undefined &&
        options.blue !== undefined
    ) {
        if (options.alpha !== undefined) {
            if (options.duration) {
                if (options.fontSize !== undefined && options.fontName) {
                    sendOverlayData(
                        `messageRGBAFadeFont|${message}|${options.key}|${options.x}|${options.y}|${options.red}|${options.green}|${options.blue}|${options.alpha}|${options.duration}|${options.fontSize}|${options.fontName}`,
                    );
                } else {
                    sendOverlayData(
                        `messageRGBAFade|${message}|${options.key}|${options.x}|${options.y}|${options.red}|${options.green}|${options.blue}|${options.alpha}|${options.duration}`,
                    );
                }
            } else {
                sendOverlayData(
                    `messageRGBA|${message}|${options.key}|${options.x}|${options.y}|${options.red}|${options.green}|${options.blue}|${options.alpha}`,
                );
            }
        } else {
            sendOverlayData(
                `messageRGB|${message}|${options.key}|${options.x}|${options.y}|${options.red}|${options.green}|${options.blue}`,
            );
        }
    } else {
        sendOverlayData(
            `message|${message}|${options.key}|${options.x}|${options.y}`,
        );
    }
};

const checkForOverlayProcess = async (): Promise<boolean> => {
    const clientRunning = await isRunning('Kesmai.Client');
    const overlayRunning = await isRunning('KesmaiOverlay');
    if (!clientRunning) {
        return false;
    }

    if (!overlayRunning) {
        startProcess(`${process.cwd()}\\bin\\KesmaiOverlay.exe`);
    }
    return true;
};

const isRunning = (processName: string) =>
    new Promise<boolean>((resolve) => {
        exec('tasklist', (_err, stdout) => {
            resolve(
                stdout.toLowerCase().indexOf(processName.toLowerCase()) > -1,
            );
        });
    });

const startProcess = (processPath: string) => spawn(processPath);
