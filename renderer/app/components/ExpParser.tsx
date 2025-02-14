'use client';

import { useApp } from '@/contexts/AppContext';
import moment from 'moment';
import { useState, useEffect, useRef } from 'react';

export default function ExpParser() {
    const { gameState, charName } = useApp();

    const [expParserData, setExpParserData] = useState(null);
    const [sessionTimer, setSessionTimer] = useState('');
    const sessionTimerIntervalRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        const handleExpParser = (_event, args) => {
            const expParserObj = JSON.parse(args);
            setExpParserData(expParserObj);
            if (expParserObj?.sessionStartTime) {
                if (!sessionTimerIntervalRef.current) {
                    const id = setInterval(() => {
                        const startTime = moment(
                            expParserObj.sessionStartTime,
                        ).utc();
                        setSessionTimer(
                            moment
                                .utc(moment.utc().diff(startTime))
                                .format('H:mm:ss'),
                        );
                    }, 1000);
                    sessionTimerIntervalRef.current = id;
                }
            } else {
                setSessionTimer('');
                clearInterval(sessionTimerIntervalRef.current);
                sessionTimerIntervalRef.current = null;
            }
        };
        window.electron.receive('expParser', handleExpParser);

        return () => {
            window.electron.removeAllListeners('expParser');
        };
    }, []);

    useEffect(() => {
        if (!gameState) {
            if (sessionTimerIntervalRef) {
                setSessionTimer('');
                clearInterval(sessionTimerIntervalRef.current);
                sessionTimerIntervalRef.current = null;
            }
            setExpParserData(null);
        }
    }, [gameState]);

    return (
        <div className="flex h-[440px] w-auto items-center justify-center">
            {gameState && charName && (
                <>
                    <h1 className="text-3xl bold w-80">
                        Playing as {charName}.
                    </h1>
                </>
            )}
            <div className="stats stats-vertical shadow center w-80">
                <div className="stat bg-primary-content">
                    <div className="stat-title">Session Duration</div>
                    <div className="stat-value">
                        {sessionTimer || '00:00:00'}
                    </div>
                </div>
                <div className="stat bg-primary-content">
                    <div className="stat-title">Experience per Hour</div>
                    <div className="stat-value">
                        {expParserData?.expPerHours?.toLocaleString('en-US') ||
                            '0'}
                    </div>
                </div>
                <div className="stat bg-primary-content">
                    <div className="stat-title">Total Experience</div>
                    <div className="stat-value">
                        {expParserData?.sessionTotalExperience?.toLocaleString(
                            'en-US',
                        ) || '0'}
                    </div>
                </div>
            </div>
        </div>
    );
}
