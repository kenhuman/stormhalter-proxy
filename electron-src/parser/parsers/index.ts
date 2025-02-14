import dgram from 'node:dgram';
import { Packet } from '../packet';

import ServerChangeState from './ServerChangeState';
import ServerLocalizedCommunicationMessage from './ServerLocalizedCommunicationMessage';
import PacketMonitor from './PacketMonitor';
import ServerCommunicationMessage from './ServerCommunicationMessage';
import ServerEntityUpdate from './ServerEntityUpdate';
import ServerEntityDeparting from './ServerEntityDeparting';
import ServerContainerContent from './ServerContainerContent';
import ServerContainerClear from './ServerContainerClear';
import ServerContainerUpdate from './ServerContainerUpdate';
import ServerRoundUpdate from './ServerRoundUpdate';
import ServerContainerOpen from './ServerContainerOpen';
import ServerGumpShow from './ServerGumpShow';

export type PacketParser = (packets: Packet[], rinfo: dgram.RemoteInfo) => void;

const parsers: PacketParser[] = [
    ServerChangeState,
    ServerLocalizedCommunicationMessage,
    PacketMonitor,
    ServerCommunicationMessage,
    ServerEntityUpdate,
    ServerEntityDeparting,
    ServerContainerContent,
    ServerContainerClear,
    ServerContainerUpdate,
    ServerRoundUpdate,
    ServerContainerOpen,
    ServerGumpShow,
];

export default parsers;
