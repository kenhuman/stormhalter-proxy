import Store from 'electron-store';

type StoreType = {
    overlay: {
        isActive: boolean;
    };
    shortcuts: {
        isActive: boolean;
    };
};

export const store = new Store<StoreType>({
    defaults: {
        overlay: {
            isActive: true,
        },
        shortcuts: {
            isActive: true,
        },
    },
});
