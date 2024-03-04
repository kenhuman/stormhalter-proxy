import { PacketCommand, getDataFromFragments } from '../packet';
import { debug } from '../../sendMessage';
import { PacketParser } from '.';
import { inventory } from './ServerContainerContent';

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
                if (dataType === PacketCommand.ServerContainerClear) {
                    const type = data.readUInt8(2);
                    const slot = data.readUInt8(3);
                    const container = inventory.containers.get(type);
                    if (container) {
                        container.items = container.items.filter(
                            (item) => item.slot !== slot,
                        );
                    }
                }
            }
        }
    } catch (err) {
        debug(`ServerContainerClear: ${err}`);
        throw err;
    }
};

export default parser;
