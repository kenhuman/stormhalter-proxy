import { PacketCommand } from '../../packet';
import { PacketParser } from '..';
import ExperienceParser from './ExpParser';
import { debug } from '../../../sendMessage';
import { sendOverlayMessage } from '../../../overlayServer';
import { TypedEventEmitter } from '../TypedEventEmitter';

type ParseFunction = (data: string[]) => void;

export const expParser = new ExperienceParser();

type ServerLocalizedCommunicationMessageEventTypes = {
    onMessage: [type: number, args: string[]];
};

export const ServerLocalizedCommunicationMessageEventBroker =
    new TypedEventEmitter<ServerLocalizedCommunicationMessageEventTypes>();

const parser: PacketParser = (packets, _rinfo): void => {
    try {
        const msgPackets = packets.filter((packet) => packet?.type === 0x44);
        for (const packet of msgPackets) {
            if (packet?.data) {
                const dataType = packet.data.readUint16LE();
                if (
                    dataType ===
                    PacketCommand.ServerLocalizedCommunicationMessage
                ) {
                    let offset = 0;
                    const isBatch = packet.data.readUInt8(3);
                    if (isBatch) {
                        offset = 1;
                    }
                    // const multiplier = packet.data.readUInt8(4 + offset);
                    const idx = packet.data.readUInt32LE(5 + offset);
                    const variableCount = packet.data.readUInt8(9 + offset);
                    const variables: string[] = [];
                    offset = 9 + offset;
                    for (let i = 0; i < variableCount; i++) {
                        offset++;
                        const variableLength = packet.data.readUInt8(offset);
                        let buf = '';
                        for (let j = 1; j <= variableLength; j++) {
                            buf += String.fromCharCode(
                                packet.data.readUInt8(offset + j),
                            );
                        }
                        variables.push(buf);
                        offset += variableLength;
                    }
                    ServerLocalizedCommunicationMessageEventBroker.emit(
                        'onMessage',
                        idx,
                        variables,
                    );
                    messageMap.get(idx)?.(variables);
                }
            }
        }
    } catch (err) {
        debug(`ServerLocalizedCommunicationMessage: ${err}`);
        throw err;
    }
};

const messageMap: Map<number, ParseFunction> = new Map<number, ParseFunction>();

messageMap.set(6300080, expParser.parseMessage);
messageMap.set(6300302, () => {
    sendOverlayMessage('Poisoned!', {
        key: 'poisoned',
        x: 600,
        y: 200,
        red: 0,
        green: 255,
        blue: 0,
        alpha: 255,
        duration: 2000,
        fontSize: 50,
        fontName: 'Arial',
    });
});

const displayNeutralizeOverlay = () => {
    sendOverlayMessage('Neutralized!', {
        key: 'poisoned',
        x: 600,
        y: 200,
        red: 0,
        green: 0,
        blue: 255,
        alpha: 255,
        duration: 2000,
        fontSize: 50,
        fontName: 'Arial',
    });
};
messageMap.set(6300303, displayNeutralizeOverlay);
messageMap.set(6300304, displayNeutralizeOverlay);

const displayFumbledOverlay = () => {
    debug('Fumbled!');
    sendOverlayMessage('Fumbled!', {
        key: 'fumbled',
        x: 600,
        y: 265,
        red: 255,
        green: 0,
        blue: 0,
        alpha: 255,
        duration: 2000,
        fontSize: 50,
        fontName: 'Arial',
    });
};
messageMap.set(6300015, displayFumbledOverlay);
messageMap.set(6300016, displayFumbledOverlay);
messageMap.set(6300017, displayFumbledOverlay);
messageMap.set(6300018, displayFumbledOverlay);
export default parser;
