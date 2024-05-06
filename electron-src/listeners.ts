import { Packet, sendPacket } from './parser/packet';
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

    let searching = false;
    ipcMain.on('drakeTrapSearch', (_event, ...args) => {
        const startId = args[0][0];
        if(startId === 0) {
            searching = false;
        } else {
            searching = true;
        }
        let currentId = startId;
        // debug(startId);

        const ServerCommunicationMessageHandler = (message: string) => {
            if (message === 'No object with that serial was found.') {
                debug('no object with serial');
                ServerCommunicationMessageEventBroker.off(
                    'onMessage',
                    ServerCommunicationMessageHandler,
                );
                ServerGumpShowEventBroker.off('onMessage', ServerGumpShowHandler);
            }
        };

        const ServerGumpShowHandler = (message: any, id: number) => {
            sendPropsClose(id);
            ServerGumpShowEventBroker.off('onMessage', ServerGumpShowHandler);

            const getValue = (key: string) => {
                const data =
                    message.Layout.Gump.Content.Canvas.Children.ScrollViewer
                        .Content.StackPanel.Children.StackPanel;
                const element = data.find(
                    (e: { Children: { TextBlock: [{ Text: string }] } }) =>
                        e.Children.TextBlock[0].Text === key,
                );
                return element?.Children.TextBlock[1].Text;
            };

            const body = getValue('Body');
            const location = getValue('Location');
            const health = getValue('Health');

            if (body === 497 && health === 5 && location.match(/\[3\]/g)) {
                debug('its a trap!');
            } else {
                currentId++;
                ServerCommunicationMessageEventBroker.off(
                    'onMessage',
                    ServerCommunicationMessageHandler,
                );
                setTimeout(() => {
                    sendPropsRequest(currentId);
                }, 50);
            }
        };

        const sendPropsRequest = (id: number) => {
            debug(`${id}`);
            if(!searching) {
                return;
            }
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

            sendPacket([propsPacket]);
        };

        const sendPropsClose = (id: number) => {
            const packetData = new NodeLidgren();
            packetData.writeInt16(0xd4);
            packetData.writeInt32(id);
            packetData.writeInt16(400);
            packetData.writeInt16(400);

            const packet: Packet = {
                type: 0x44,
                counter: 0,
                fragment: false,
                size: 0,
                sizeInBits: 0,
            };
        
            packet.data = Buffer.from(packetData.getData());
        
            packet.sizeInBits = packet.data.length * 8;
            packetData.destroy();
        
            sendPacket([packet]);
        }

        sendPropsRequest(startId);
    });
};
