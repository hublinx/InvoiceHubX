'use client';

import { Box, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCloudDownload, IconShieldCheck, IconBuildingStore } from '@tabler/icons-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const POINTS = [
  { icon: IconCloudDownload, t: 'Tự động tải hoá đơn', d: 'Đầu vào, đầu ra từ cổng thuế theo lịch' },
  { icon: IconBuildingStore, t: 'Nhiều mã số thuế', d: 'Quản lý mọi doanh nghiệp trong một tài khoản' },
  { icon: IconShieldCheck, t: 'Cảnh báo rủi ro', d: 'Phát hiện MST ngừng hoạt động trước khi kê khai' },
];

export function AuthLayout({ title, subtitle, children, footer }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0} mih="100vh">
      {/* Cột thương hiệu */}
      <Box visibleFrom="md" p={48} style={{ background: 'linear-gradient(150deg, #0f1f3d 0%, #1e3a8a 60%, #1d4ed8 100%)', color: '#fff', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <Box className="grid-bg" pos="absolute" inset={0} style={{ opacity: 0.5, pointerEvents: 'none' }} />
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', position: 'relative' }}><Logo size={30} /></Link>
        <Box my="auto" maw={460} style={{ position: 'relative' }}>
          <Text fz={36} fw={800} lh={1.2}>Hoá đơn điện tử,<br />gọn gàng như sổ cái.</Text>
          <Text mt="md" opacity={0.8}>Nền tảng giúp kế toán gom, đối soát và kiểm tra hoá đơn cho nhiều doanh nghiệp.</Text>
          <Stack gap="lg" mt={40}>
            {POINTS.map((p) => (
              <Group key={p.t} gap="md" wrap="nowrap">
                <ThemeIcon size={40} radius="md" variant="white" color="iris"><p.icon size={20} /></ThemeIcon>
                <Box><Text fw={700}>{p.t}</Text><Text fz="sm" opacity={0.75}>{p.d}</Text></Box>
              </Group>
            ))}
          </Stack>
        </Box>
        <Text fz="xs" opacity={0.6} style={{ position: 'relative' }}>© 2026 InvoiceHubX</Text>
      </Box>

      {/* Cột biểu mẫu */}
      <Box style={{ display: 'flex', flexDirection: 'column' }} px={{ base: 'md', sm: 48 }} py={{ base: 'md', sm: 32 }}>
        <Group justify="space-between">
          <Box hiddenFrom="md"><Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}><Logo size={26} /></Link></Box>
          <Box visibleFrom="md" />
          <ThemeToggle />
        </Group>
        <Box my="auto" py="xl" w="100%" maw={420} mx="auto">
          <Text component="h1" fz={28} fw={800} m={0}>{title}</Text>
          {subtitle && <Text c="dimmed" mt={6} mb="xl">{subtitle}</Text>}
          <Paper p={0} bg="transparent">{children}</Paper>
          {footer && <Box mt="xl" ta="center">{footer}</Box>}
        </Box>
      </Box>
    </SimpleGrid>
  );
}
