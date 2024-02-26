import { PacketCommand } from '../../packet';
import { PacketParser } from '..';
import ExperienceParser from './ExpParser';
import { debug } from '../../sendMessage';

type ParseFunction = (data: string[]) => void;

export const expParser = new ExperienceParser();

const parser: PacketParser = (packets, _rinfo): void => {
    try {
        const msgPackets = packets.filter((packet) => packet?.type === 0x44);
        for (const packet of msgPackets) {
            if (packet?.data) {
                const dataType = packet.data.readUint8();
                if (
                    dataType === PacketCommand.ServerLocalizedCommunicationMessage
                ) {
                    const idx = packet.data.readUInt32LE(4);
                    const variableCount = packet.data.readUInt8(8);
                    const variables: string[] = [];
                    let offset = 8;
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
                    messageMap.get(idx)?.(variables);
                }
            }
        }
    } catch(err) {
        debug(`ServerLocalizedCommunicationMessage: ${err}`);
        throw err;
    }
};

const messageMap: Map<number, ParseFunction> = new Map<number, ParseFunction>();

messageMap.set(6300080, expParser.parseMessage);

export default parser;
