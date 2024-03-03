import { Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import { setOverlayActive } from './overlayServer';
import { store } from './store';

const template: Array<MenuItemConstructorOptions | MenuItem> = [
    {
        label: 'File',
        submenu: [{ role: 'quit' }],
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
        ],
    },
    {
        label: 'Settings',
        submenu: [
            {
                label: 'Enable Overlay',
                type: 'checkbox',
                checked: store.get('overlay.isActive'),
                click: (e) => {
                    store.set('overlay.isActive', e.checked);
                    setOverlayActive(e.checked);
                },
            },
            {
                label: 'Enable Shortcuts',
                type: 'checkbox',
                checked: store.get('shortcuts.isActive'),
                click: (e) => {
                    store.set('shortcuts.isactive', e.checked);
                },
            },
        ],
    },
];

export const menu = Menu.buildFromTemplate(template);
