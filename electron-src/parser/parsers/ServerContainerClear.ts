import { PacketCommand } from '../packet';
import { debug } from '../../sendMessage';
import { PacketParser } from '.';
import { inventory } from './ServerContainerContent';

const parser: PacketParser = (packets, _rinfo): void => {
    try {
        const msgPackets = packets.filter((packet) => packet?.type === 0x44);
        for (const packet of msgPackets) {
            if (packet?.data) {
                const dataType = packet.data.readUint8();
                if (dataType === PacketCommand.ServerContainerClear) {
                    const type = packet.data.readUInt8(2);
                    const slot = packet.data.readUInt8(3);
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
