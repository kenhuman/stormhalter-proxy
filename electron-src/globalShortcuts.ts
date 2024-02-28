import {
    getForegroundWindowName,
    hasForegroundWindowChanged,
} from 'node-active-window';
import { globalShortcut } from 'electron';
import { Packet } from './parser/packet';
import { getProxy } from '.';

let activeWindowIsKesmai = false;

const checkIfWindowChanged = (): boolean => {
    if (activeWindowIsKesmai) {
        const windowChanged = hasForegroundWindowChanged();
        if (!windowChanged) {
            return true;
        }
        return false;
    }
    return false;
};

const checkForegroundWindow = (): boolean => {
    const foregroundWindowName = getForegroundWindowName();
    if (foregroundWindowName != 'Kesmai.Client') {
        activeWindowIsKesmai = false;
        return false;
    }
    return true;
};

const checkActiveWindow = (): boolean => {
    if (checkIfWindowChanged()) {
        return true;
    } else {
        if (checkForegroundWindow()) {
            return true;
        }
    }
    activeWindowIsKesmai = false;
    return false;
};

const griffinBoots = async () => {
    if (!checkActiveWindow()) {
        return;
    }

    const proxy = getProxy();

    const packet: Packet = {
        type: 0x44,
        counter: proxy.getOutgoingCount(),
        fragment: false,
        size: 0,
        unknown1: false,
        unknown2: false,
        unknown3: false,
    };

    packet.data = Buffer.from([
        0x2b, 0x00, 0x00, 0x07, 0x00, 0x25, 0x8e, 0x01, 0x55, 0x01,
    ]);

    packet.size = packet.data.length;

    proxy.addToOutgoingQueue(packet);
};

export const registerGlobalShortcuts = () => {
    globalShortcut.register('Alt+X', griffinBoots);
};
