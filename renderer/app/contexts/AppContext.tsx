import { ExpParserData, Packet } from '@/types';
import moment from 'moment';
import {
    FunctionComponent,
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

interface AppContextProps {
    gameState: boolean;
    charName: string;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

interface AppProviderProps {
    children: React.ReactNode;
}

interface AppProvider extends FunctionComponent<AppProviderProps> {}

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [gameState, setGameState] = useState(false);
    const [charName, setCharName] = useState('');

    useEffect(() => {
        const handleMessage = (_event, args) => {
            console.log(args);
        };
        window.electron.receive('message', handleMessage);

        return () => {
            window.electron.removeAllListeners('message');
        };
    }, []);

    useEffect(() => {
        const handleLog = (_event, args) => {
            console.log(args);
        };
        window.electron.receive('log', handleLog);

        return () => {
            window.electron.removeAllListeners('log');
        };
    }, []);

    useEffect(() => {
        const handleGameState = (_event, args) => {
            setGameState(args === 'InGame');
        };
        window.electron.receive('gameState', handleGameState);

        return () => {
            window.electron.removeAllListeners('gameState');
        };
    }, []);

    useEffect(() => {
        const handleCharName = (_event, args) => {
            setCharName(args);
        };
        window.electron.receive('charName', handleCharName);

        return () => {
            window.electron.removeAllListeners('charName');
        };
    }, []);

    return (
        <AppContext.Provider
            value={{
                gameState,
                charName,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp(): AppContextProps {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('usApp must be used within AppProvider.');
    }
    return context;
}
