import { Packet } from './parser/packet';
import { inventory } from './parser/parsers/ServerContainerContent';
import { addToQueue } from './parser/parsers/ServerRoundUpdate';
import { debug } from './sendMessage';
import { ipcMain } from 'electron';
import { NodeLidgren } from '../bin/lidgren/publish/node-lidgren';
import { ServerCommunicationMessageEventBroker } from './parser/parsers/ServerCommunicationMessage';
import { ServerGumpShowEventBroker } from './parser/parsers/ServerGumpShow';

export const addIpcListeners = () => {
    ipcMain.on('requestGriffBoots', (_event, ...args) => {
        const entityId = args[0];
        debug(`Let's JK that ${entityId}`);

        const wearingGriffBoots = inventory.Body?.items[7].bitmapIndex === 302;
        if (!wearingGriffBoots) {
            return;
        }

        const packet: Packet = {
            type: 0x44,
            counter: 0,
            fragment: false,
            size: 0,
            sizeInBits: 0,
        };

        packet.data = Buffer.from([
            0x2b, 0x00, 0x00, 0x07, 0x00, 0x25, 0x8e, 0x01, 0x55, 0x01,
        ]);

        packet.sizeInBits = packet.data.length * 8;

        const packet2: Packet = {
            type: 0x44,
            counter: 0,
            fragment: false,
            size: 0,
            sizeInBits: 0,
        };

        const entityIdAsHexString: string = entityId
            .toString(16)
            .padStart(8, '0');

        packet2.data = Buffer.from([
            0x51,
            0x00,
            0x10,
            parseInt(entityIdAsHexString.substring(6, 7), 16),
            parseInt(entityIdAsHexString.substring(4, 5), 16),
            parseInt(entityIdAsHexString.substring(2, 3), 16),
            parseInt(entityIdAsHexString.substring(1, 2), 16),
            0x80,
            0x01,
            0x80,
            0x01,
        ]);

        packet2.sizeInBits = packet2.data.length * 8;

        addToQueue([packet]);
        addToQueue([packet2]);
    });

    ipcMain.on('drakeTrapSearch', (_event, ...args) => {
        const startId = args[0][0];
        debug(startId);

        const ServerCommunicationMessageHandler = (message: string) => {
            if (message === 'No object with that serial was found.') {
                debug('no object with serial');
                ServerCommunicationMessageEventBroker.off(
                    'onMessage',
                    ServerCommunicationMessageHandler,
                );
            }
        };

        const ServerGumpShowHandler = (message: any) => {
            ServerGumpShowEventBroker.off('onMessage', ServerGumpShowHandler);
            debug(JSON.stringify(message));
        };

        const sendPropsRequest = (id: number) => {
            const packetData = new NodeLidgren();
            packetData.writeInt16(0x96);
            packetData.writeBoolean(true);
            packetData.writeString(`props ${id}`);
            packetData.writeInt16(400);
            packetData.writeInt16(400);

            const propsPacket: Packet = {
                type: 0x44,
                counter: 0,
                fragment: false,
                size: 0,
                sizeInBits: 0,
            };

            propsPacket.data = Buffer.from(packetData.getData());
            propsPacket.sizeInBits = propsPacket.data.length * 8;

            packetData.destroy();

            ServerCommunicationMessageEventBroker.on(
                'onMessage',
                ServerCommunicationMessageHandler,
            );
            ServerGumpShowEventBroker.on('onMessage', ServerGumpShowHandler);

            addToQueue([propsPacket]);
        };

        sendPropsRequest(startId);
    });
};
