import { PacketParser } from '.';
import { PacketCommand } from '../packet';
import { debug } from '../sendMessage';

const parser: PacketParser = (packets, _rinfo): void => {
    try {
        const msgPackets = packets.filter((packet) => packet?.type === 0x44);
        for (const packet of msgPackets) {
            if (packet?.data) {
                const dataType = packet.data.readUint8();
                if (dataType === PacketCommand.ServerCommunicationMessage) {
                    let msgData = packet.data.subarray(7);
                    const message = [];
                    do {
                        const length = msgData.readUint8();
                        const msg = msgData.toString('utf-8', 1, 1 + length);
                        message.push(msg);
                        msgData = msgData.subarray(
                            1 + length,
                            1 + msgData.length + 1,
                        );
                    } while (msgData.length);
                    debug(`${message}`);
                }
            }
        }
    } catch(err) {
        debug(`ServerCommunicationMessage: ${err}`);
        throw err;
    }
};

export default parser;
