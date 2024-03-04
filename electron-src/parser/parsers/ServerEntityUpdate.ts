import { PacketCommand, getDataFromFragments } from '../packet';
import { debug, sendMessage } from '../../sendMessage';
import { PacketParser } from '.';

interface ServerEntityUpdate {
    entityId: number;
    locationX?: number;
    locationY?: number;
    messageType?: number;
    hostile?: boolean;
    name?: string;
    health?: number;
    departed?: boolean;
    engaged?: boolean;
}

export const mobList: Map<number, ServerEntityUpdate> = new Map<
    number,
    ServerEntityUpdate
>();

const parser: PacketParser = (packets, _rinfo): void => {
    const getNameLength = (offset: number, data: Buffer) => {
        if (!data) {
            return 0;
        }
        const nameLength = Math.floor(data.readUint8(offset) / 2);
        return nameLength;
    };

    const getName = (offset: number, data: Buffer) => {
        if (!data) {
            return '';
        }
        const nameLength = getNameLength(offset, data);
        let name: string = '';
        for (let i = 0; i < nameLength; i++) {
            name += String.fromCharCode(data.readUInt8(offset + 1 + i) / 2);
        }
        return name;
    };
    try {
        const msgPackets = packets.filter((packet) => packet?.type === 0x44);
        for (const packet of msgPackets) {
            if (packet?.data) {
                const data = getDataFromFragments(packet);
                if (!data) {
                    return;
                }
                const dataType = data.readUint8();
                if (dataType === PacketCommand.ServerEntityUpdate) {
                    const entityId = data.readUInt32LE(2);
                    const messageType = data.readUint16LE(6);

                    let result: ServerEntityUpdate = {
                        entityId,
                        messageType,
                        engaged: false,
                    };

                    if (mobList.has(entityId)) {
                        result = mobList.get(entityId)!;
                        result.messageType = messageType;
                    }

                    result.departed = false;

                    switch (messageType) {
                        case 0xffff:
                            result.locationX = data.readUint8(8);
                            result.locationY = data.readUint8(9);
                            result.name = getName(16, data);
                            const nameLength = getNameLength(16, data);
                            result.hostile =
                                data.readUInt8(16 + nameLength + 2) === 0x66;
                            break;
                        case 0xefff:
                            result.name = getName(14, data);
                            break;
                        case 0x1000:
                            result.locationX = data.readUint8(8);
                            result.locationY = data.readUint8(9);
                            break;
                        case 0x0100: //not sure what this is
                            break;
                        case 0x0008:
                            result.health = data.readUInt8(8);
                            result.engaged = true;
                            break;
                        default:
                            debug(
                                `Unknown ServerEntityUpdate type: ${messageType.toString(16).padStart(4, '0')} (${packet.counter})`,
                            );
                    }
                    mobList.set(result.entityId, result);
                    sendMessage(
                        'entityUpdate',
                        JSON.stringify([...mobList.values()]),
                    );
                }
            }
        }
    } catch (err) {
        debug(`ServerEntityUpdate: ${err}`);
        throw err;
    }
};

export default parser;
