import { PacketCommand, getDataFromFragments } from '../packet';
import { debug } from '../../sendMessage';
import { PacketParser } from '.';
import { inventory, parseItem } from './ServerContainerContent';

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
                if (dataType === PacketCommand.ServerContainerUpdate) {
                    const updateType = data.readUInt8(2);
                    const type = data.readUInt8(3);
                    const container = inventory.containers.get(type);
                    let item;
                    switch (updateType) {
                        case 0x3f:
                            item = parseItem(Buffer.from(data.slice(4)), 0);
                            break;
                        case 0x02:
                            const slot = data.readUint16LE(4);
                            item = container?.items.find(
                                (e) => e.slot === slot,
                            );
                            item!.amount = data.readUint32LE(6);
                            break;
                    }

                    if (container && item) {
                        container.items.push(item);
                    }
                }
            }
        }
    } catch (err) {
        debug(`ServerContainerUpdate: ${err}`);
        throw err;
    }
};

export default parser;
