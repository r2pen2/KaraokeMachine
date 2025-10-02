import '@mantine/core/styles.css';

import React from 'react';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { theme } from '../theme';
import { AuthProvider } from '../context/AuthContext';
import { QueueProvider } from '../context/QueueContext';
import AppFrame from '../components/AppFrame/AppFrame';
import { FilamentsProvider } from '../context/FilamentsContext';

export const metadata = {
  title: 'Mantine Next.js template',
  description: 'I am using Mantine with Next.js!',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <AuthProvider>
            <FilamentsProvider>
              <QueueProvider>
                <AppFrame>
                  {children}
                </AppFrame>
              </QueueProvider>
            </FilamentsProvider>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}