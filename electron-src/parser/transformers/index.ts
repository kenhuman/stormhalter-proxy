import dgram from 'node:dgram';
import { Packet } from '../packet';
import PacketMonitor from './PacketMonitor';

export type PacketTransformer = (
    packets: Packet[],
    rinfo: dgram.RemoteInfo,
) => Packet[];

const transformers = [PacketMonitor];

export default transformers;
