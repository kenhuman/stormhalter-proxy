import Store from 'electron-store';

type StoreType = {
    overlay: {
        isActive: boolean;
    };
};

export const store = new Store<StoreType>({
    defaults: {
        overlay: {
            isActive: true,
        },
    },
});
