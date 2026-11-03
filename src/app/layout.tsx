import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import './globals.css';

import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'InvoiceHubX — Trung tâm hoá đơn điện tử',
  description: 'Tự động gom, đối soát và phân tích hoá đơn điện tử cho mọi mã số thuế.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap"
        />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
