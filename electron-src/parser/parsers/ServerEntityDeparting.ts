import { PacketCommand, getDataFromFragments } from '../packet';
import { debug, sendMessage } from '../../sendMessage';
import { PacketParser } from '.';
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
                const dataType = data.readUint16LE();
                if (dataType === PacketCommand.ServerEntityDeparting) {
                    const entityId = data.readUint32LE(2);
                    if (mobList.has(entityId)) {
                        const mob = mobList.get(entityId);
                        if (mob?.locationX === 3 && mob.locationY === 3) {
                            mobList.delete(entityId);
                        } else {
                            mobList.get(entityId)!.departed = true;
                        }
                    } else {
                        mobList.set(entityId, { entityId, departed: true });
                    }
                    sendMessage(
                        'entityUpdate',
                        JSON.stringify([...mobList.values()]),
                    );
                }
            }
        }
    } catch (err) {
        debug(`ServerEntityDeparting: ${err}`);
        throw err;
    }
};

export default parser;
