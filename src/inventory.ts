import { Int8, Int16, Int32 } from "./types.js";
import { Packet } from "./packet.js";

enum ContainerType {
    Body,
    Rings,
    Sack,
    Belt,
    Hands,
    Ground
}

interface ContainerItem {
    slot: Int16;
    bitmapIndex: Int16
    amount: Int32;
    labelIndex: Int32;
    unknown1: Int32;
    unknown2: Int8;
}

interface Container {
    type: ContainerType;
    size: Int8;
    items: ContainerItem[];
}

const CONTAINER_ITEM_SIZE = 17;

export default class Inventory {
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

    private containers: Map<ContainerType, Container> = new Map<ContainerType, Container>();

    public handleServerContainerContent = (packet: Packet): void => {
        const container: Container = {
            type: packet.data.readUInt8(1),
            size: packet.data.readUInt8(2),
            items: []
        }
        for(let itemIdx = 0; itemIdx < container.size; itemIdx++) {
            const offset = itemIdx * CONTAINER_ITEM_SIZE;
            const item = this.parseContainerItem(Buffer.from(packet.data.slice(4 + offset, 4 + offset + CONTAINER_ITEM_SIZE)));
            container.items.push(item)
        }
        this.containers.set(container.type, container);
        console.log(`${ContainerType[container.type]} created with ${container.size} items`);
    }

    public handleServerContainerClear = (packet: Packet): void => {
        const containerType: ContainerType = packet.data.readUInt8(1);
        const slot = packet.data.readUInt8(2);
        const container = this.containers.get(containerType);
        if(container) {
            container.items = this.containers.get(containerType).items.filter(item => item.slot !== slot);
            // console.log(`Removed item in slot ${slot} from container ${ContainerType[containerType]}`);
        } else {
            // console.log(`Unknown container type ${containerType}`);
        }
    }

    public handleServerContainerUpdate = (packet: Packet): void => {
        const containerType: ContainerType = packet.data.readUInt8(2);
        const item = this.parseContainerItem(Buffer.from(packet.data.slice(3, 3 + CONTAINER_ITEM_SIZE)));
        const container = this.containers.get(containerType);
        if(container && item) {
            this.containers.get(containerType).items.push(item);
            // console.log(`Added item in slot ${item.slot} to container ${ContainerType[containerType]}`);
            // console.log(item);
        } else {
            // console.log(`Unknown container type ${containerType}`);
        }
    }

    private parseContainerItem = (buf: Buffer): ContainerItem => {
        try {
            return {
                slot: buf.readUInt16LE(0),
                bitmapIndex: buf.readUInt16LE(2),
                amount: buf.readUInt32LE(4),
                labelIndex: buf.readUInt32LE(8),
                unknown1: buf.readUInt32LE(12),
                unknown2: buf.readUInt8(16)
            }
        } catch(err) {
            // console.log(`Couldn't process packet: ${JSON.stringify(buf)}`);
        }
    }
}