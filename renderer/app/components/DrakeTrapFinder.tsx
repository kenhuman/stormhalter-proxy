'use client';

import { useState } from 'react';

export default function ExpParser() {
    const [startId, setStartId] = useState('');
    const [buttonName, setButtonName] = useState('Go');

    const start = (): void => {
        if (buttonName === 'Go') {
            window.electron.send('drakeTrapSearch', startId);
            setButtonName('Stop');
        } else {
            window.electron.send('drakeTrapSearch', 0);
            setButtonName('Go');
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Starting Id"
                className="input input-borderd w-full max-w-xs"
                value={startId}
                onChange={(e) => {
                    setStartId(e.currentTarget.value);
                }}
            />
            <button className="btn btn-primary" onClick={start}>
                {buttonName}
            </button>
        </div>
    );
}
