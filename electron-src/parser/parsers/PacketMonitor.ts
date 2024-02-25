import { PacketCommand } from '../packet';
import { sendMessage } from '../sendMessage';
import { PacketParser } from '.';

const parser: PacketParser = (packets, _rinfo): void => {
    const msgPackets = packets.filter((packet) => packet?.type === 0x44);
    for (const packet of msgPackets) {
        if (packet?.data) {
            const dataType = packet.data.readUint8();
            const packetTypeName = Object.entries(PacketCommand).find(
                ([_, v]) => v === dataType,
            )![0];
            sendMessage(
                'incomingPacket',
                JSON.stringify({
                    key: packet.counter,
                    type: packetTypeName,
                    data: packet.data,
                }),
            );
        }
    }
};

export default parser;
