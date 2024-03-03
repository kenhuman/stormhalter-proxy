import { PacketParser } from '.';
import { sendOverlayMessage } from '../../overlayServer';
import { PacketCommand } from '../packet';
import { debug } from '../sendMessage';

type ParseFunction = (data: string) => void;

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
                    for (const pf of parseFunctions) {
                        pf(message.join(''));
                    }
                    debug(`${message}`);
                }
            }
        }
    } catch (err) {
        debug(`ServerCommunicationMessage: ${err}`);
        throw err;
    }
};

const parseFunctions: ParseFunction[] = [];

parseFunctions.push((data: string): void => {
    const regexp = /Your Griffin Boots begin to crackle with power/;
    const match = data.match(regexp);

    if (match) {
        sendOverlayMessage('Griffin Boots Ready!', {
            key: 'item-triggered',
            x: 600,
            y: 270,
            red: 255,
            green: 0,
            blue: 0,
            alpha: 255,
            duration: 2000,
            fontSize: 50,
            fontName: 'Arial',
        });
    }
});

export default parser;
