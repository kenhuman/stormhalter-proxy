import { Packet, PacketCommand } from '../packet';
import { sendMessage } from '../sendMessage';
import { PacketTransformer } from '.';

const parser: PacketTransformer = (packets, _rinfo): Packet[] => {
    const msgPackets = packets.filter((packet) => packet?.type === 0x44);
    for (const packet of msgPackets) {
        if (packet?.data) {
            const dataType = packet.data.readUint8();
            const packetTypeName = Object.entries(PacketCommand).find(
                ([_, v]) => v === dataType,
            )![0];
            sendMessage(
                'outgoingPacket',
                JSON.stringify({
                    key: packet.counter,
                    type: packetTypeName,
                    data: packet.data,
                }),
            );
        }
    }
    return packets;
};

export default parser;
