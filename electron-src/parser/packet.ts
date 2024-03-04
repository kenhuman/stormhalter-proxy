import { Int8, Int16 } from './types';
import { debug } from '../sendMessage';
import { getProxy } from '..';
import { getAddress, getCoreClr, readMemory, writeMemory } from '../memory';
import memory from 'memoryjs';
import { writeFile } from 'fs/promises';

interface FragmentInfo {
    group: number;
    totalBits: number;
    chunkByteSize: number;
    chunkNumber: number;
}
interface IPacket {
    type: Int8;
    counter: Int16;
    fragment: boolean;
    sizeInBits: number;
    size: Int16;
    data?: Buffer;
    fragmentInfo?: FragmentInfo;
}

export type Packet = IPacket | null;

const PACKET_HEADER_SIZE = 0x5;

export enum PacketCommand {
    ClientLoginRequest = 1,
    ServerLoginAccept,
    ServerLoginReject,
    ClientLogoutRequest,
    ClientCreationRequest = 11,
    ServerCreationRequestAccept,
    ServerCreationRequestReject,
    ClientCreationCancel,
    ClientCreationFinish,
    ServerConferenceState = 21,
    ServerConferenceCharacter,
    ClientCharacterSelect,
    ClientPlayRequest = 31,
    ClientMovementRequest = 40,
    ClientWorldInteractRequest,
    ClientEntityInteractRequest,
    ClientItemInteractRequest,
    ServerClientUpdate = 50,
    ServerWorldUpdate = 61,
    ServerEntityClear = 65,
    ServerEntityDeparting,
    ServerEntityMoving,
    ServerEntityUpdate,
    ServerMobileUpdate = 70,
    ServerTargetRequest = 80,
    ClientTargetResponse,
    ServerTargetCancel,
    ClientTargetCancel = 82,
    ServerContainerContent = 90,
    ServerContainerUpdate,
    ServerContainerOpen,
    ServerContainerClose,
    ServerContainerClear,
    ClientContainerClose,
    ClientLiftRequest,
    ClientLiftCancel,
    ServerLiftReject,
    ClientDropRequest,
    ClientConsumeRequest,
    ServerRoundUpdate = 120,
    ServerSpellContent = 130,
    ServerSpellLearned,
    ServerSpellInscribed,
    ServerSpellWarm,
    ClientSpellInscribe = 135,
    ClientSpellWarm,
    ClientSpellCancel,
    ClientSpellCast,
    ServerSpellStatus = 140,
    ClientAsciiMessage = 150,
    ServerAsciiMessage,
    ServerLocalizedAsciiMessage,
    ServerSpeechMessage,
    ServerLocalizedSpeechMessage,
    ServerLocalizedMantraMessage,
    ServerCommunicationMessage,
    ServerLocalizedCommunicationMessage,
    ServerMessageBox = 160,
    ClientExitRequest = 199,
    ServerChangeState,
    ServerPlaySound,
    ServerLocalizedGumpShow = 209,
    ServerGumpShow,
    ClientGumpResponse,
    ClientGumpClose,
    ServerGumpClose,
    ServerGumpUpdateProperty,
    ServerGumpUpdateLayout,
}

export enum ServerState {
    Unknown = 1,
    Conference,
    InGame,
}

export const fragmentedPackets: Map<number, Map<number, Packet>> = new Map<
    number,
    Map<number, Packet>
>();

export const parseHeader = (header: Buffer): Packet => {
    if (header.length !== 5) {
        debug(`unknown header: ${header}`);
        return null;
    }
    const type = header.readUint8(0);
    let low = header.readUint8(1);
    let high = header.readUint8(2);
    const fragment = (low & 1) === 1;
    const counter = (low >> 1) | (high << 7);
    const size = header.readUint16LE(3);
    const result: Packet = {
        type,
        counter,
        fragment,
        sizeInBits: size,
        size: Math.floor((size + 7) / 8),
    };
    return result;
};

export const createHeader = (packet: Packet): Buffer => {
    const header = Buffer.alloc(PACKET_HEADER_SIZE);
    if (!packet) {
        return header;
    }
    header.writeUInt8(packet.type, 0);
    header.writeUInt16LE((packet.counter << 1) | +packet.fragment, 1);
    header.writeUInt16LE(packet.sizeInBits, 3);
    return header;
};

const parseFragmentData = (
    fragment: Buffer,
): { dataOffset: number; fragmentInfo: FragmentInfo } => {
    const getNextValue = () => {
        let num1 = 0;
        let num2 = 0;
        let result = -1;

        while (true) {
            let num3 = fragment[ptr++];
            num1 |= (num3 & 0x7f) << (num2 & 0x1f);
            num2 += 7;
            if ((num3 & 0x80) == 0) {
                result = num1;
                break;
            }
        }

        return result;
    };
    let ptr = 0;
    let group = getNextValue();
    let totalBits = getNextValue();
    let chunkByteSize = getNextValue();
    let chunkNumber = getNextValue();

    return {
        dataOffset: ptr,
        fragmentInfo: {
            group,
            totalBits,
            chunkByteSize,
            chunkNumber,
        },
    };
};

export const getDataFromFragments = (packet: Packet) => {
    if (!packet) {
        return;
    }
    let data = packet.data!;
    if (packet.fragment && packet.fragmentInfo) {
        if (packet.fragmentInfo.chunkNumber !== 0) {
            return;
        }
        const packets = fragmentedPackets.get(packet.fragmentInfo.group);
        if (packets) {
            for (const [_chunkNumber, packet] of packets) {
                if (packet?.data) {
                    data = Buffer.concat([data, packet.data]);
                }
            }
        }
    }
    return data;
};

let packetCount = 0;
export const splitPackets = (packet: Buffer): Packet[] => {
    const packetBuffer = Buffer.from(packet);
    const packets: Packet[] = [];
    let offset = 0;
    while (offset < packetBuffer.length) {
        const header = packetBuffer.subarray(
            offset,
            offset + PACKET_HEADER_SIZE,
        );
        offset += PACKET_HEADER_SIZE;
        const basePacket = parseHeader(header);
        if (!basePacket) {
            console.error('could not read this packet:', packetBuffer);
            return packets;
        }
        let data = packetBuffer.subarray(offset, offset + basePacket.size);
        offset += basePacket.size;

        if (basePacket.fragment) {
            const { dataOffset, fragmentInfo } = parseFragmentData(data);
            data = data.subarray(dataOffset);
            basePacket.fragmentInfo = fragmentInfo;
        }
        basePacket.data = data;
        packets.push(basePacket);
        packetCount++;
        if (false) {
            let s = '';
            for (const c of header) {
                s += c.toString(16).padStart(2, '0') + ' ';
            }
            s += '\n';
            let count = 0;
            for (const c of data) {
                s += c.toString(16).padStart(2, '0') + ' ';
                count++;
                if (count % 16 === 0) {
                    s += '\n';
                }
            }
            writeFile(
                `${process.cwd()}/output/${packetCount}-${basePacket?.counter}-${basePacket?.type.toString(16).padStart(2, '0')}`,
                s,
            );
        }
    }
    return packets;
};

export const combinePackets = (packets: Packet[]): Buffer => {
    const buffers: Buffer[] = [];
    for (const packet of packets) {
        const header = createHeader(packet);
        if (packet?.data) {
            buffers.push(Buffer.concat([header, packet.data]));
        }
    }
    return Buffer.concat(buffers);
};

export const sendPacket = (packets: Packet[]): void => {
    if (!packets) {
        return;
    }
    const baseAddress = getCoreClr().modBaseAddr;
    const networkBase = getAddress(
        baseAddress,
        [0x004a2620, 0x0, 0x1e0, 0xf8, 0x20, 0x20, 0x228],
    );
    let nextCount = readMemory(networkBase, 0x38, memory.INT) - 1;
    for (const packet of packets) {
        if (packet) {
            nextCount++;
            packet.counter = nextCount;
        }
    }
    writeMemory(networkBase, 0x30, nextCount + 1, memory.INT);
    writeMemory(networkBase, 0x38, nextCount + 1, memory.INT);
    const message = combinePackets(packets);
    const udpProxy = getProxy().getUdpProxy();
    udpProxy.send(
        udpProxy.client,
        message,
        udpProxy.remoteAddress,
        udpProxy.remotePort,
    );
};
