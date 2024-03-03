import { PacketCommand } from '../packet';
import { debug } from '../../sendMessage';
import { PacketParser } from '.';
import { inventory, parseItem } from './ServerContainerContent';

const parser: PacketParser = (packets, _rinfo): void => {
    try {
        const msgPackets = packets.filter((packet) => packet?.type === 0x44);
        for (const packet of msgPackets) {
            if (packet?.data) {
                const dataType = packet.data.readUint8();
                if (dataType === PacketCommand.ServerContainerUpdate) {
                    const type = packet.data.readUInt8(3);
                    const item = parseItem(
                        Buffer.from(packet.data.slice(4)),
                        0,
                    );
                    const container = inventory.containers.get(type);
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
