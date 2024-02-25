export interface ExpParserData {
    sessionStartTime: Date;
    expPerHours: number;
    sessionTotalExperience: number;
}

export interface Packet {
    key: number;
    id: number;
    packetType: string;
    data: Uint8Array;
    type: 'incoming' | 'outgoing';
}
