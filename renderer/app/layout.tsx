import '@/styles/globals.css';

import { Metadata } from 'next';
import React from 'react';
import AppWrapper from './AppWrapper';

export const metadata: Metadata = {
    title: 'Stormhalter Packet Proxy',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" data-theme="dark">
            <body className="px-5 py-2 bg-base-200 h-screen">
                <AppWrapper>{children}</AppWrapper>
            </body>
        </html>
    );
}
