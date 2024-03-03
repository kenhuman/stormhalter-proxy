export interface ExpParserData {
    sessionStartTime: Date;
    expPerHours: number;
    sessionTotalExperience: number;
}

export interface Packet {
    key: number;
    id: number;
    packetType: string;
    data: {
        data: number[];
        type: string;
    };
    type: 'incoming' | 'outgoing';
    header: {
        type: number;
        counter: number;
        fragment: boolean;
        size: number;
        sizeInBits: number;
    };
}

export interface ServerEntityUpdate {
    entityId: number;
    locationX?: number;
    locationY?: number;
    messageType?: number;
    hostile?: boolean;
    name?: string;
    health?: number;
    departed?: boolean;
    engaged?: boolean;
}
