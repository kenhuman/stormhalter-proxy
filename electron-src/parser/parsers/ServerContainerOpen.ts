import { PacketCommand, getDataFromFragments } from '../packet';
import { debug } from '../../sendMessage';
import { PacketParser } from '.';
import { inventory, parseItem } from './ServerContainerContent';

let offsetModifier = 0;

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
                if (dataType === PacketCommand.ServerContainerContent) {
                    const type = data.readUInt8(2) === 1 ? 5 : 5;
                    const size = data.readUInt8(5);
                    const items = [];
                    for (let idx = 0; idx < size; idx++) {
                        let offsetModifier2 = Math.floor(idx / 8);
                        let offset = idx * 17;
                        const item = parseItem(
                            data.slice(
                                5 + offset + offsetModifier + offsetModifier2,
                                5 +
                                    offset +
                                    offsetModifier +
                                    offsetModifier2 +
                                    20,
                            ),
                            idx,
                        );
                        items.push(item);
                    }
                    inventory.containers.set(type, {
                        type,
                        size,
                        items,
                    });
                }
                offsetModifier = 0;
            }
        }
    } catch (err) {
        debug(`ServerContainerContent: ${err}`);
        throw err;
    }
};

export default parser;
