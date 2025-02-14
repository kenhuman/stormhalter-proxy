import {
    Packet,
    PacketCommand,
    getDataFromFragments,
    sendPacket,
} from '../packet';
import { debug } from '../../sendMessage';
import { PacketParser } from '.';

const packetQueue: Packet[][] = [];

let roundWaiting = false;
let sendTriggered = false;

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
                if (dataType === PacketCommand.ServerRoundUpdate) {
                    roundWaiting = !!!(data.readUInt8(2) & 0x1);
                    sendTriggered = false;
                    if (!roundWaiting) {
                        const packetsToSend = packetQueue.shift();
                        if (packetsToSend) {
                            sendPacket(packetsToSend);
                        }
                    }
                }
            }
        }
    } catch (err) {
        debug(`ServerRoundUpdate: ${err}`);
        throw err;
    }
};

export const addToQueue = (packets: Packet[]): void => {
    if (!roundWaiting && !sendTriggered) {
        sendTriggered = true;
        sendPacket(packets);
    } else {
        packetQueue.push(packets);
    }
};

export const isRoundWaiting = (): boolean => roundWaiting;

export default parser;
