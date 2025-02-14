import { PacketCommand, getDataFromFragments } from '../packet';
import { debug, sendMessage } from '../../sendMessage';
import { PacketParser } from '.';

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
                const packetTypeName =
                    Object.entries(PacketCommand).find(
                        ([_, v]) => v === dataType,
                    )?.[0] ?? dataType;
                sendMessage(
                    'incomingPacket',
                    JSON.stringify({
                        key: packet.counter,
                        type: packetTypeName,
                        data,
                        header: {
                            type: packet.type,
                            counter: packet.counter,
                            fragment: packet.fragment,
                            size: packet.size,
                            sizeInBits: packet.sizeInBits,
                        },
                    }),
                );
            }
        }
    } catch (err) {
        debug(`PacketMonitor: ${err}`);
        throw err;
    }
};

export default parser;
