import dgram from 'node:dgram';

import { debug, log } from './sendMessage';
import UdpProxy, { UdpProxyOptions } from './UdpProxy';
import { Packet, combinePackets, splitPackets } from './packet';
import parsers, { PacketParser } from './parsers';
import transformers, { PacketTransformer } from './transformers';

export default class Proxy {
    private proxy: UdpProxy;
    private options: UdpProxyOptions;

    private parsers: PacketParser[] = [];
    private transformers: PacketTransformer[] = [];

    private outgoingCount = 0;
    private incomingCount = 0;

    private outgoingQueue: Packet[] = [];

    constructor(options: UdpProxyOptions) {
        this.options = options;
        this.proxy = new UdpProxy(this.options);
        this.startProxy();
    }

    public startProxy = (): void => {
        this.proxy.on('listening', (_details) => {
            log('Listening ...');
        });
        this.proxy.on('error', (error) => {
            debug(JSON.stringify(error));
        });
        this.proxy.on('close', (_peer) => {
            log('closed');
        });

        this.addTransforms();
    };

    private addTransforms = (): void => {
        const incomingTransform = (
            msg: Buffer,
            rinfo: dgram.RemoteInfo,
        ): Buffer => {
            try {
                const packets = splitPackets(msg);
                for (const parser of this.parsers) {
                    parser(packets, rinfo);
                }
                const lastPacket = packets[packets.length - 1];
                if (lastPacket) {
                    this.incomingCount = lastPacket.counter;
                }
            } catch (error) {
                this.proxy.emit('error', error);
            } finally {
                return msg;
            }
        };

        const outgoingTransform = (
            msg: Buffer,
            rinfo: dgram.RemoteInfo,
        ): Buffer => {
            try {
                let packets = splitPackets(msg);
                for (const transformer of this.transformers) {
                    packets = transformer(packets, rinfo);
                }
                const lastPacket = packets[packets.length - 1];
                if (lastPacket) {
                    if (lastPacket.counter > this.outgoingCount) {
                        this.outgoingCount = lastPacket.counter;
                    }
                }
                msg = combinePackets([...packets, ...this.outgoingQueue]);
                this.outgoingQueue = [];
            } catch (error) {
                this.proxy.emit('error', error);
            } finally {
                return msg;
            }
        };

        this.parsers = parsers;
        this.transformers = transformers;

        this.proxy.addIncomingTransform(incomingTransform);
        this.proxy.addOutgoingTransform(outgoingTransform);
    };

    public getUdpProxy = (): UdpProxy => this.proxy;
    public getIncomingCount = (): number => this.incomingCount;
    public getOutgoingCount = (): number => this.outgoingCount;

    public addToOutgoingQueue = (packet: Packet): void => {
        this.outgoingQueue.push(packet);
    };
}
