'use client';

import { Packet } from '@/types';
import { useEffect, useRef, useState } from 'react';
import PacketMontitorDisplay from './PacketMonitorDisplay';
import PacketMontitorList from './PacketMonitorList';

export default function PacketMonitor() {
    const [displayedPacket, setDisplayedPacket] = useState(null);
    const [packets, setPackets] = useState<Packet[]>([]);
    const packetsRef = useRef<Packet[]>([]);
    const packetCount = useRef<number>(0);

    const handlePacket = (type: 'incoming' | 'outgoing', args: string) => {
        const packet = JSON.parse(args) as Packet;
        packetsRef.current.unshift({
            key: packet.key,
            id: packetCount.current,
            packetType: packet.type,
            data: packet.data,
            type,
            header: packet.header,
        });

        if (packetsRef.current.length > 1000) {
            packetsRef.current = packetsRef.current.slice(0, 1000);
        }

        packetCount.current += 1;
        setPackets([...packetsRef.current]);
    };

    useEffect(() => {
        const handleIncomingPacket = (_event, args) => {
            handlePacket('incoming', args);
        };
        window.electron.receive('incomingPacket', handleIncomingPacket);

        return () => {
            window.electron.removeAllListeners('incomingPacket');
        };
    }, [packetsRef]);

    useEffect(() => {
        const handleOutgoingPacket = (_event, args) => {
            handlePacket('outgoing', args);
        };
        window.electron.receive('outgoingPacket', handleOutgoingPacket);

        return () => {
            window.electron.removeAllListeners('outgoingPacket');
        };
    }, [packetsRef]);

    return (
        <div className="h-[440px] w-full flex flex-row">
            <div className="w-1/3 overflow-y-scroll bg-base-200">
                <PacketMontitorList
                    packets={packets}
                    onSelect={setDisplayedPacket}
                />
            </div>
            <div className="w-2/3 overflow-y-scroll bg-base-200">
                <PacketMontitorDisplay
                    packet={packets?.find(
                        (packet) => packet.id === displayedPacket,
                    )}
                />
            </div>
        </div>
    );
}
