'use client';

import { AppProvider } from './contexts/AppContext';
import React from 'react';

interface Props {
    children: React.ReactNode;
}

export default function AppWraper(props: Props) {
    const { children } = props;
    return (
        <AppProvider>
            <div className="h-full">{children}</div>
        </AppProvider>
    );
}
