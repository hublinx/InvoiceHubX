'use client';

import { Anchor, Box, Group, Paper, SegmentedControl, Text } from '@mantine/core';
import { IconArrowLeft, IconBuildingBank, IconLock, IconShieldCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { LogoMark } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const TRUST = [
  { icon: IconLock, t: 'Kết nối mã hoá SSL' },
  { icon: IconShieldCheck, t: 'Mật khẩu cổng thuế mã hoá AES-256' },
  { icon: IconBuildingBank, t: '12.000+ doanh nghiệp tin dùng' },
];

/**
 * Bố cục trang xác thực: thẻ trung tâm trên nền "giấy kẻ ô".
 * `tabs` = true hiển thị công tắc Đăng nhập / Đăng ký ở đầu thẻ.
 */
export function AuthLayout({ title, subtitle, children, footer, tabs = false }: {
  title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; tabs?: boolean;
}) {
  const pathname = (usePathname() || '').replace(/\/$/, '');
  const router = useRouter();
  const mode = pathname.endsWith('/register') ? 'register' : 'login';

  return (
    <Box mih="100vh" pos="relative" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Nền: giấy kẻ ô + vệt màu nhẹ */}
      <Box pos="absolute" inset={0} style={{ pointerEvents: 'none', background: 'radial-gradient(700px 380px at 15% 0%, rgba(37,99,235,.10), transparent 70%), radial-gradient(600px 360px at 100% 100%, rgba(245,158,11,.10), transparent 70%)' }} />
      <Box pos="absolute" inset={0} className="ledger-bg" style={{ pointerEvents: 'none' }} />

      {/* Thanh trên */}
      <Group justify="space-between" px={{ base: 'md', sm: 'xl' }} py="sm" pos="relative">
        <Anchor component={Link} href="/" c="dimmed" fz="sm" underline="never">
          <Group gap={6}><IconArrowLeft size={16} />Trang chủ</Group>
        </Anchor>
        <ThemeToggle />
      </Group>

      {/* Thẻ */}
      <Box pos="relative" my="auto" px={{ base: 'md', sm: 'xl' }} py="md">
        <Paper
          mx="auto" maw={440} radius="lg" withBorder
          p={{ base: 'lg', sm: 28 }}
          className="auth-card"
          style={{ background: 'var(--ihx-surface)', boxShadow: '0 1px 2px rgba(15,31,61,.04), 0 24px 48px -24px rgba(15,31,61,.25)' }}
        >
          <Group gap="sm" wrap="nowrap" mb="md">
            <LogoMark size={40} />
            <Box style={{ minWidth: 0 }}>
              <Text fz={18} fw={700} lh={1.25}>{title}</Text>
              {subtitle && <Text c="dimmed" fz="xs" mt={2}>{subtitle}</Text>}
            </Box>
          </Group>

          {tabs && (
            <SegmentedControl
              fullWidth radius="md" size="sm" mb="md"
              value={mode}
              onChange={(v) => router.push(v === 'register' ? '/register' : '/login')}
              data={[{ value: 'login', label: 'Đăng nhập' }, { value: 'register', label: 'Đăng ký' }]}
            />
          )}

          {children}
        </Paper>

        {footer && <Box mt="sm" ta="center">{footer}</Box>}

        <Group justify="center" gap="md" mt="md" maw={560} mx="auto">
          {TRUST.map((x) => (
            <Group key={x.t} gap={6} wrap="nowrap">
              <x.icon size={15} color="var(--mantine-color-teal-6)" />
              <Text fz="xs" c="dimmed">{x.t}</Text>
            </Group>
          ))}
        </Group>
      </Box>

      <Text fz="xs" c="dimmed" ta="center" pos="relative" style={{ paddingBottom: 'calc(var(--mantine-spacing-sm) + env(safe-area-inset-bottom, 0px))' }}>
        © 2026 InvoiceHubX · <Anchor fz="xs" c="dimmed">Điều khoản</Anchor> · <Anchor fz="xs" c="dimmed">Bảo mật</Anchor>
      </Text>
    </Box>
  );
}
