import {
    getForegroundWindowName,
    hasForegroundWindowChanged,
} from 'node-active-window';
import { globalShortcut } from 'electron';
import { Packet, sendPacket } from './parser/packet';
import { store } from './store';

let activeWindowIsKesmai = false;
let isActive = store.get('shortcuts.isActive');

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

    const packet: Packet = {
        type: 0x44,
        counter: 0,
        fragment: false,
        size: 0,
        sizeInBits: 0,
    };

    packet.data = Buffer.from([
        0x2b, 0x00, 0x00, 0x07, 0x00, 0x25, 0x8e, 0x01, 0x55, 0x01,
    ]);

    packet.size = packet.data.length;

    sendPacket(packet);
};

export const registerGlobalShortcuts = () => {
    if (!isActive) {
        return;
    }
    globalShortcut.register('Alt+X', griffinBoots);
};

export const unregisterGlobalShortcuts = () => {
    globalShortcut.unregisterAll();
};

export const setShortcutsActive = (active: boolean) => {
    isActive = active;
    if (isActive) {
        registerGlobalShortcuts();
    } else {
        unregisterGlobalShortcuts();
    }
};
