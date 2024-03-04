import { PacketCommand, ServerState, getDataFromFragments } from '../packet';
import { debug, sendMessage } from '../../sendMessage';
import { PacketParser } from '.';
import { expParser } from './ServerLocalizedCommunicationMessage';
import { mobList } from './ServerEntityUpdate';

const parser: PacketParser = (packets, _rinfo): void => {
    try {
        const msgPackets = packets.filter((packet) => packet?.type === 0x44);
        for (const packet of msgPackets) {
            if (packet?.data) {
                const data = getDataFromFragments(packet);
                if (!data) {
                    return;
                }
                const dataType = data.readUint8();
                if (dataType === PacketCommand.ServerChangeState) {
                    const state: ServerState = data.readUint8(2);
                    if (state === ServerState.InGame) {
                        expParser.resetData();
                        mobList.clear();
                        sendMessage('gameState', 'InGame');
                        const charNameLength = data.readUint8(3);
                        let charName = '';
                        for (let i = 4; i < 4 + charNameLength; i++) {
                            charName += String.fromCharCode(data.readUint8(i));
                        }
                        sendMessage('charName', charName);
                    } else {
                        sendMessage('gameState', 'Conference');
                    }
                }
            }
        }
    } catch (err) {
        debug(`ServerChangeState: ${err}`);
        throw err;
    }
};

export default parser;
