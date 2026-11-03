'use client';

import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoonStars, IconSun } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  return (
    <Tooltip label={scheme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}>
      <ActionIcon
        variant="default"
        size="lg"
        radius="xl"
        aria-label="Đổi giao diện"
        onClick={() => setColorScheme(scheme === 'dark' ? 'light' : 'dark')}
      >
        {scheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}
