import {
    getForegroundWindowName,
    hasForegroundWindowChanged,
} from 'node-active-window';
import { globalShortcut } from 'electron';
import { Packet } from './parser/packet';
import { store } from './store';
import { inventory } from './parser/parsers/ServerContainerContent';
import { addToQueue } from './parser/parsers/ServerRoundUpdate';

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

    const wearingGriffBoots = inventory.Body?.items[7].bitmapIndex === 302;
    if (!wearingGriffBoots) {
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

    packet.sizeInBits = packet.data.length * 8;

    addToQueue([packet]);
};

const zeroMove = () => {
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

    packet.data = Buffer.from([0x28, 0x00, 0x01, 0x05, 0x80, 0x00, 0x80, 0x00]);

    packet.sizeInBits = packet.data.length * 8;

    addToQueue([packet]);
};

const swapBoots = async () => {
    if (!checkActiveWindow()) {
        return;
    }

    const beltedBootIndex = inventory.Belt?.items.find(
        (e) => e.labelIndex === 6000012,
    )?.slot;
    if (!beltedBootIndex) {
        return;
    }

    let availableSlot = 0;
    for (let i = 1; i <= 4; i++) {
        if (!inventory.Belt?.items.find((e) => e.slot === i)) {
            availableSlot = i;
            break;
        }
    }
    if (!availableSlot) {
        return;
    }

    const pickCurrentBoots: Packet = {
        type: 0x44,
        counter: 0,
        fragment: false,
        size: 0,
        sizeInBits: 0,
    };

    pickCurrentBoots.data = Buffer.from([
        0x60, 0x00, 0x00, 0x07, 0x00, 0x01, 0x00, 0x00, 0x00, 0x80, 0x01, 0x80,
        0x01,
    ]);

    pickCurrentBoots.sizeInBits = pickCurrentBoots.data.length * 8;

    const dropBelt: Packet = {
        type: 0x44,
        counter: 0,
        fragment: false,
        size: 0,
        sizeInBits: 0,
    };

    dropBelt.data = Buffer.from([
        0x63,
        0x00,
        0x03,
        availableSlot,
        0x00,
        0x80,
        0x01,
        0x80,
        0x01,
    ]);

    dropBelt.sizeInBits = dropBelt.data.length * 8;

    const pickupBeltedBoots: Packet = {
        type: 0x44,
        counter: 0,
        fragment: false,
        size: 0,
        sizeInBits: 0,
    };

    pickupBeltedBoots.data = Buffer.from([
        0x60,
        0x00,
        0x03,
        beltedBootIndex,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x00,
        0x80,
        0x00,
        0x80,
        0x00,
    ]);

    pickupBeltedBoots.sizeInBits = pickupBeltedBoots.data.length * 8;

    const dropPortrait: Packet = {
        type: 0x44,
        counter: 0,
        fragment: false,
        size: 0,
        sizeInBits: 0,
    };

    dropPortrait.data = Buffer.from([
        0x63, 0x00, 0x00, 0x07, 0x00, 0x80, 0x01, 0x80, 0x01,
    ]);

    dropPortrait.sizeInBits = dropPortrait.data.length * 8;

    addToQueue([pickCurrentBoots, dropBelt]);
    addToQueue([pickupBeltedBoots, dropPortrait]);
};

export const registerGlobalShortcuts = () => {
    if (!isActive) {
        return;
    }
    globalShortcut.register('Alt+X', griffinBoots);
    globalShortcut.register('Alt+C', swapBoots);
    globalShortcut.register('Alt+V', zeroMove);
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
