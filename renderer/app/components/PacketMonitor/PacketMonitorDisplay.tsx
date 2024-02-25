import React from 'react';

export default function PacketMontitorDisplay({
    content,
}: {
    content: Uint8Array;
}) {
    const contentArr: number[] = [];
    content?.forEach((val) => contentArr.push(val));
    return (
        <div className="flex flex-wrap px-2">
            {contentArr.map((val, idx) => (
                <span key={idx} className="flex flex-col font-mono p-1">
                    <span
                        className={idx % 2 ? 'text-primary' : 'text-secondary'}
                    >
                        {val.toString(16).padStart(2, '0')}
                    </span>
                    <span
                        className={idx % 2 ? 'text-primary' : 'text-secondary'}
                    >
                        {String.fromCharCode(val).padStart(2, ' ')}
                    </span>
                </span>
            ))}
        </div>
    );
}
