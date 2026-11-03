'use client';

import { Group, Text } from '@mantine/core';
import { useId } from 'react';

export function LogoMark({ size = 32 }: { size?: number }) {
  const gid = 'ihx-g' + useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="11" fill={`url(#${gid})`} />
      <path d="M12 12h12l4 4v12H12z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M16 20h8M16 24h5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="30" cy="30" r="6" fill="#f59e0b" stroke="#0a0b12" strokeWidth="2" />
      <path d="M27.6 30l1.7 1.7 3-3.2" stroke="#0a0b12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Group gap={10} wrap="nowrap">
      <LogoMark size={size} />
      <Text fw={800} fz={size * 0.6} lts={-0.5}>
        InvoiceHub<span className="gradient-text">X</span>
      </Text>
    </Group>
  );
}
