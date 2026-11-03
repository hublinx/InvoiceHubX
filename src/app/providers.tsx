'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import { theme } from '@/lib/theme';
import { StoreProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <AuthProvider>
        <StoreProvider>{children}</StoreProvider>
      </AuthProvider>
    </MantineProvider>
  );
}
