'use client';
import { Packet, ServerEntityUpdate } from '@/types';
import { useState, useRef, useEffect } from 'react';

export default function MobList() {
    const [mobs, setMobs] = useState<ServerEntityUpdate[]>([]);

    useEffect(() => {
        const handleEntityUpdate = (_event, args) => {
            const serverEntityMap = JSON.parse(args) as ServerEntityUpdate[];
            setMobs(serverEntityMap);
        };
        window.electron.receive('entityUpdate', handleEntityUpdate);

        return () => {
            window.electron.removeAllListeners('entityUpdate');
        };
    }, []);

    return (
        <div className="h-[440px] w-full flex flex-row">
            <div className="flex-1">
                <div className="overflow-y-scroll bg-base-200 h-1/2 m-1">
                    <div className="w-full text-center bg-base-300 p-1">
                        Hostile
                    </div>
                    {mobs
                        .filter((mob) => mob.hostile && !mob.departed)
                        .map((mob) => {
                            return (
                                <span
                                    key={mob.entityId}
                                    className={`hover:bg-base-300 cursor-pointer max-h-5 font-mono whitespace-nowrap block`}
                                >
                                    {`${mob.name} (${mob.entityId})`}{' '}
                                    {mob.locationX && mob.locationY
                                        ? `(X: ${mob.locationX} Y: ${mob.locationY})`
                                        : ''}
                                </span>
                            );
                        })}
                </div>
                <div className="overflow-y-scroll bg-base-200 h-1/2 m-1">
                    <div className="w-full text-center bg-base-300 p-1">
                        Non-Hostile
                    </div>
                    {mobs
                        .filter((mob) => !mob.hostile && !mob.departed)
                        .map((mob) => {
                            return (
                                <span
                                    key={mob.entityId}
                                    className={`hover:bg-base-300 cursor-pointer max-h-5 font-mono whitespace-nowrap block`}
                                >
                                    {`${mob.name} (${mob.entityId})`}{' '}
                                    {mob.locationX && mob.locationY
                                        ? `(X: ${mob.locationX} Y: ${mob.locationY})`
                                        : ''}
                                </span>
                            );
                        })}
                </div>
            </div>
            <div className="flex-1">
                <div className="overflow-y-scroll bg-base-200 h-full m-1">
                    <div className="w-full text-center bg-base-300 p-1">
                        Departed
                    </div>
                    {mobs
                        .filter((mob) => mob.departed && mob.hostile)
                        .map((mob) => {
                            return (
                                <span
                                    key={mob.entityId}
                                    className={`hover:bg-base-300 cursor-pointer max-h-5 font-mono whitespace-nowrap block`}
                                >
                                    {`${mob.name} (${mob.entityId})`}{' '}
                                    {mob.locationX && mob.locationY
                                        ? `(X: ${mob.locationX} Y: ${mob.locationY})`
                                        : ''}
                                </span>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
