import { Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import { setOverlayActive } from './parser/overlayServer';
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
        ],
    },
];

export const menu = Menu.buildFromTemplate(template);
