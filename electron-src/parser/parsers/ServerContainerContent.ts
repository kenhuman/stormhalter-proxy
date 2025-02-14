import { PacketCommand, getDataFromFragments } from '../packet';
import { debug } from '../../sendMessage';
import { PacketParser } from '.';

enum ContainerType {
    Body,
    Rings,
    Sack,
    Belt,
    Hands,
    Ground,
}

interface ContainerItem {
    slot: number;
    bitmapIndex: number;
    amount: number;
    labelIndex: number;
    color: number;
    quality: number;
}

interface Container {
    type: ContainerType;
    size: number;
    items: ContainerItem[];
}

class Inventory {
    public get Body() {
        return this.containers.get(ContainerType.Body);
    }
    public get Rings() {
        return this.containers.get(ContainerType.Rings);
    }
    public get Sack() {
        return this.containers.get(ContainerType.Sack);
    }
    public get Belt() {
        return this.containers.get(ContainerType.Belt);
    }
    public get Hands() {
        return this.containers.get(ContainerType.Hands);
    }
    public get Ground() {
        return this.containers.get(ContainerType.Ground);
    }

    public containers: Map<ContainerType, Container> = new Map<
        ContainerType,
        Container
    >();
}

export const inventory: Inventory = new Inventory();

let offsetModifier = 0;

export const parseItem = (item: Buffer, idx: number) => {
    let offset2 = idx % 8;
    const res: ContainerItem = {
        slot: item.readUInt16LE(0) >> offset2,
        bitmapIndex: item.readUInt16LE(2) >> offset2,
        amount: item.readUInt32LE(4) >> offset2,
        labelIndex: item.readUInt32LE(8) >> offset2,
        color: 0,
        quality: 0,
    };
    try {
        const color1 = item.readUInt32LE(12);
        const color2 = item.readUInt8(16);
        let color = color1 | color2;
        color >>= 4;
        res.color = color;
        let quality = item.readUInt8(17);
        if (item.length < 20) {
            quality >>= offset2;
            res.quality = quality;
        } else {
            const nextSlot = item.readUInt16LE(18);
            const nextSlotMask = Math.pow(2, offset2 + 1) - 1;
            if (quality & 0x1 || (nextSlot >> (offset2 + 1)) & nextSlotMask) {
                quality >>= offset2;
                offsetModifier += 1;
                res.quality = quality;
            }
        }
    } catch (err) {
        let packetAsHex = '';
        for (const i of item) {
            packetAsHex += `${i.toString(16).padStart(2, '0')} `;
        }
        debug(`Couldn't process packet: (${idx}) ${packetAsHex}`);
    } finally {
        return res;
    }
};

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
                if (dataType === PacketCommand.ServerContainerContent) {
                    const type = data.readUInt8(2);
                    const size = data.readUInt8(3);
                    const items = [];
                    if (size) {
                        for (let idx = 0; idx < size; idx++) {
                            let offsetModifier2 = Math.floor(idx / 8);
                            let offset = idx * 17;
                            const item = parseItem(
                                data.slice(
                                    5 +
                                        offset +
                                        offsetModifier +
                                        offsetModifier2,
                                    5 +
                                        offset +
                                        offsetModifier +
                                        offsetModifier2 +
                                        20,
                                ),
                                idx,
                            );
                            items.push(item);
                        }
                    }
                    inventory.containers.set(type, {
                        type,
                        size,
                        items,
                    });
                }
                offsetModifier = 0;
            }
        }
    } catch (err) {
        debug(`ServerContainerContent: ${err}`);
        throw err;
    }
};

export default parser;
