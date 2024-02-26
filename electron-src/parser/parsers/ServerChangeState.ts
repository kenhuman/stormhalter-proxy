import { PacketCommand, ServerState } from '../packet';
import { sendMessage } from '../sendMessage';
import { PacketParser } from '.';
import { expParser } from './ServerLocalizedCommunicationMessage';

const parser: PacketParser = (packets, _rinfo): void => {
    const msgPackets = packets.filter((packet) => packet?.type === 0x44);
    for (const packet of msgPackets) {
        if (packet?.data) {
            const dataType = packet.data.readUint8();
            if (dataType === PacketCommand.ServerChangeState) {
                const state: ServerState = packet.data.readUint8(2);
                if (state === ServerState.InGame) {
                    expParser.resetData();
                    sendMessage('gameState', 'InGame');
                    const charNameLength = packet.data.readUint8(3);
                    let charName = '';
                    for (let i = 4; i < 4 + charNameLength; i++) {
                        charName += String.fromCharCode(
                            packet.data.readUint8(i),
                        );
                    }
                    sendMessage('charName', charName);
                } else {
                    sendMessage('gameState', 'Conference');
                }
            }
        }
    }
};

export default parser;
