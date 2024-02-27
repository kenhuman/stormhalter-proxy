import activeWindow from 'active-win';
import { debug } from './parser/sendMessage';
import { globalShortcut } from 'electron';

const checkActiveWindow = async (): Promise<boolean> => {
    const win = await activeWindow();
    if (win?.title != 'Kesmai.Client') {
        return false;
    }
    return true;
};

const griffinBoots = async () => {
    const now = Date.now();
    if (!(await checkActiveWindow())) {
        return;
    }
    const diff = Date.now() - now;

    debug(`(${diff} ms) griffinBoots hotkey pressed.`);
};

export const registerGlobalShortcuts = () => {
    globalShortcut.register('Alt+X', griffinBoots);
};
