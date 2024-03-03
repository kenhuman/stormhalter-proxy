import { Packet } from '@/types';
import React from 'react';

export default function PacketMontitorDisplay({ packet }: { packet: Packet }) {
    const contentArr: number[] = [];
    packet?.data?.data.forEach((val) => contentArr.push(val));
    return (
        <>
            <div>
                {packet && (
                    <>
                        <div className="text-center">{packet?.packetType}</div>
                        <div className="pl-3">
                            <span className="me-1">
                                <span className="text-xs me-1">Type</span>
                                <span>
                                    {packet?.header.type
                                        .toString(16)
                                        .padStart(2, '0')}
                                </span>
                            </span>
                            <span className="me-1">
                                <span className="text-xs me-1">Counter</span>
                                <span>{packet?.header.counter}</span>
                            </span>
                            <span className="me-1">
                                <span className="text-xs me-1">Size</span>
                                <span>
                                    {packet?.header.size
                                        .toString(16)
                                        .padStart(2, '0')}
                                </span>
                            </span>
                            <span className="me-1">
                                <span className="text-xs me-1">
                                    Size (Bits)
                                </span>
                                <span>
                                    {packet?.header.sizeInBits
                                        .toString(16)
                                        .padStart(2, '0')}
                                </span>
                            </span>
                            <span className="me-1">
                                <span className="text-xs me-1">Fragment</span>
                                <span>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-xs"
                                        checked={packet?.header.fragment}
                                        readOnly
                                    />
                                </span>
                            </span>
                        </div>
                    </>
                )}
            </div>
            <div className="flex flex-wrap px-3">
                {contentArr.map((val, idx) => (
                    <span key={idx} className="flex flex-col font-mono p-1">
                        <span
                            className={
                                idx % 2 ? 'text-primary' : 'text-secondary'
                            }
                        >
                            {val.toString(16).padStart(2, '0')}
                        </span>
                        <span
                            className={
                                idx % 2 ? 'text-primary' : 'text-secondary'
                            }
                        >
                            {String.fromCharCode(val).padStart(2, ' ')}
                        </span>
                    </span>
                ))}
            </div>
        </>
    );
}
