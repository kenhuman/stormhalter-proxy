import { Int8, Int16 } from "types";

export interface Packet {
    type: Int8;
    counter: Int16;
    fragment: boolean;
    size: Int16;
    unknown1: boolean;
    unknown2: boolean;
    unknown3: boolean;
    data?: Buffer;
}

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
    ServerMessageBox = 160,
    ClientExitRequest = 199,
    ServerChangeState,
    ServerPlaySound,
    ServerGumpShow = 210,
    ClientGumpResponse,
    ClientGumpClose,
    ServerGumpClose
}

export enum ServerState {
    Unknown = 1,
    Conference,
    InGame
}

export const parseHeader = (header: Buffer): Packet => {
    if(header.length !== 5) {
        console.log('unknown header', header);
        return null;
    }
    const result: Packet = {
        type:       header.readUInt8(0),
        counter:    header.readUInt16LE(1) >> 1,
        fragment:   !!(header.readUInt16LE(1) & 0x1),
        size:       header.readUInt16LE(3) >> 3,
        unknown1:   !!(header.readUInt16LE(3) & 0x1),
        unknown2:   !!(header.readUInt16LE(3) >> 1 & 0x1),
        unknown3:   !!(header.readUInt16LE(3) >> 2 & 0x1)                
    }
    return result;
}

export const createHeader = (packet: Packet): Buffer => {
    const header = Buffer.alloc(PACKET_HEADER_SIZE);
    header.writeUInt8(packet.type, 0);
    header.writeUInt16LE(packet.counter << 1 | +packet.fragment, 1);
    header.writeUInt16LE(packet.size << 3 | +packet.unknown1 | +packet.unknown2 << 1 | +packet.unknown2 << 2, 3);
    return header;
}

export const splitPackets = (packet: Buffer): Packet[] => {
    const packetBuffer = Buffer.from(packet);
    const packets: Packet[] = [];
    let offset = 0;
    while(offset < packetBuffer.length) {
        const header = packetBuffer.subarray(offset, offset + PACKET_HEADER_SIZE);
        offset += PACKET_HEADER_SIZE;
        const basePacket = parseHeader(header);
        if(!basePacket) {
            console.error('could not read this packet:', packetBuffer);
            return packets;
        }
        const data = packetBuffer.subarray(offset, offset + basePacket.size + (basePacket.unknown1 ? 1 : 0));
        offset += basePacket.size + (basePacket.unknown1 ? 1 : 0);
        basePacket.data = data;
        packets.push(basePacket);
    }
    return packets;
}

export const combinePackets = (packets: Packet[]): Buffer => {
    const buffers: Buffer[] = [];
    for(const packet of packets) {
        const header = createHeader(packet);
        buffers.push(Buffer.concat([header, packet.data]));
    }
    return Buffer.concat(buffers);
}