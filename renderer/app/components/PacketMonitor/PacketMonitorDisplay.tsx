import { Packet } from '@/types';
import React, { useState } from 'react';

export default function PacketMontitorDisplay({ packet }: { packet: Packet }) {
    const [displayType, setDisplayType] = useState('hex');
    const onDisplayTypeChange = (e) => {
        setDisplayType(e.target.value);
    };
    const copy = () => {
        if (displayType === 'hex') {
            navigator.clipboard.writeText(
                contentArr
                    .map((e) => e.toString(16).padStart(2, '0'))
                    .join(' '),
            );
        } else {
            navigator.clipboard.writeText(
                contentArr.map((e) => e.toString(2).padStart(8, '0')).join(' '),
            );
        }
    };
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
                        <div className="pl-3">
                            <span className="me-1">
                                <span className="text-xs me-1">Hex</span>
                                <span>
                                    <input
                                        type="radio"
                                        name="displayType"
                                        value="hex"
                                        className="radio-primary radio-xs"
                                        checked={displayType === 'hex'}
                                        onChange={onDisplayTypeChange}
                                    />
                                </span>
                            </span>
                            <span className="me-1">
                                <span className="text-xs me-1">Binary</span>
                                <span>
                                    <input
                                        type="radio"
                                        name="displayType"
                                        value="binary"
                                        className="radio-primary radio-xs"
                                        checked={displayType === 'binary'}
                                        onChange={onDisplayTypeChange}
                                    />
                                </span>
                            </span>
                            <button
                                className="btn btn-primary btn-xs"
                                onClick={copy}
                            >
                                Copy
                            </button>
                        </div>
                    </>
                )}
            </div>
            <div className="flex flex-wrap px-3">
                {contentArr.map((val, idx) => {
                    if (displayType === 'hex') {
                        return (
                            <span
                                key={idx}
                                className="flex flex-col font-mono p-1"
                            >
                                <span
                                    className={
                                        idx % 2
                                            ? 'text-primary'
                                            : 'text-secondary'
                                    }
                                >
                                    {val.toString(16).padStart(2, '0')}
                                </span>
                                <span
                                    className={
                                        idx % 2
                                            ? 'text-primary'
                                            : 'text-secondary'
                                    }
                                >
                                    {String.fromCharCode(val).padStart(2, ' ')}
                                </span>
                            </span>
                        );
                    } else {
                        return (
                            <span
                                key={idx}
                                className="flex flex-col font-mono p-1"
                            >
                                <span
                                    className={
                                        idx % 2
                                            ? 'text-primary'
                                            : 'text-secondary'
                                    }
                                >
                                    {val.toString(2).padStart(8, '0')}
                                </span>
                            </span>
                        );
                    }
                })}
            </div>
        </>
    );
}
