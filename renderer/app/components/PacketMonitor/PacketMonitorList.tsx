import { Packet } from '@/types';
import React, { Dispatch, useEffect, useState } from 'react';
import MultiSelectDropdown from '../MultiSelectDropdown';

export default function PacketMontitorList({
    packets,
    onSelect,
}: {
    packets: Packet[];
    onSelect: Dispatch<any>;
}) {
    const [packetNames, setPacketNames] = useState<Set<string>>(
        new Set<string>(),
    );
    const [displayedPackets, setDisplayedPackets] = useState([]);
    const [filteredPacketNames, setFilteredPacketNames] =
        useState<Set<string>>(null);

    const updateDisplayedPackets = () => {
        let newDisplayedPackets = [];
        const oldPackets = [...packets];
        if (filteredPacketNames?.size) {
            for (const packet of oldPackets) {
                if (filteredPacketNames?.has(packet.packetType)) {
                    newDisplayedPackets.push(packet);
                }
            }
        } else {
            newDisplayedPackets = [...packets];
        }
        setDisplayedPackets([...newDisplayedPackets]);
    };

    const handleFilterChange = (filteredPackets: string[]) => {
        const newFilter = new Set<string>(filteredPackets);
        setFilteredPacketNames(newFilter);
    };

    useEffect(() => {
        const pNames = packetNames;
        for (const packet of packets) {
            pNames.add(packet.packetType);
        }
        setPacketNames(new Set([...pNames].sort()));
        updateDisplayedPackets();
    }, [packets]);

    useEffect(() => {
        updateDisplayedPackets();
    }, [filteredPacketNames]);

    return (
        <>
            <MultiSelectDropdown
                title="filter"
                options={[...packetNames]}
                onChange={handleFilterChange}
            />
            {displayedPackets.map((packet) => {
                const fgColor =
                    packet.type === 'incoming'
                        ? 'text-primary'
                        : 'text-secondary';
                return (
                    <span
                        key={packet.id}
                        className={`hover:bg-base-300 cursor-pointer ${fgColor} max-h-5 font-mono whitespace-nowrap block`}
                        onClick={() => onSelect(packet.id)}
                    >
                        {`${packet.key}-${packet.packetType}`}
                    </span>
                );
            })}
        </>
    );
}
