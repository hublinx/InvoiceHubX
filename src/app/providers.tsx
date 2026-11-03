'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import { theme } from '@/lib/theme';
import { StoreProvider } from '@/lib/store';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" />
      <StoreProvider>{children}</StoreProvider>
    </MantineProvider>
  );
}
