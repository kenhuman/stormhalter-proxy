import dgram from 'node:dgram';
import { Packet } from '../packet';

import ServerChangeState from './ServerChangeState';
import ServerLocalizedCommunicationMessage from './ServerLocalizedCommunicationMessage';
import PacketMonitor from './PacketMonitor';
import ServerCommunicationMessage from './ServerCommunicationMessage';
import ServerEntityUpdate from './ServerEntityUpdate';
import ServerEntityDeparting from './ServerEntityDeparting';
import ServerContainerContent from './ServerContainerContent';

export type PacketParser = (packets: Packet[], rinfo: dgram.RemoteInfo) => void;

const parsers = [
    ServerChangeState,
    ServerLocalizedCommunicationMessage,
    PacketMonitor,
    ServerCommunicationMessage,
    ServerEntityUpdate,
    ServerEntityDeparting,
    ServerContainerContent,
];

export default parsers;
