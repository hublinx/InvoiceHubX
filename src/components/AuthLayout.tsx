'use client';

import { Anchor, Box, Group, Paper, SegmentedControl, Text, ThemeIcon } from '@mantine/core';
import { IconArrowLeft, IconBolt, IconCircleCheckFilled, IconLock, IconShieldCheck, IconTrendingUp } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { LogoMark } from './Logo';
import { ThemeToggle } from './ThemeToggle';

/** Thẻ trang trí trôi quanh khung đăng nhập (chỉ desktop) */
function Floaters() {
  return (
    <Box visibleFrom="md" pos="absolute" inset={0} style={{ pointerEvents: 'none' }} aria-hidden>
      {/* Hoá đơn đã cấp mã */}
      <Paper className="floater float-a glass-chip" style={{ top: '16%', left: 'calc(50% - 560px)' }} p="sm" radius="md" w={250}>
        <Group justify="space-between" mb={6}>
          <Text fz={11} c="dimmed" className="mono">C26TAA · 00012874</Text>
          <IconCircleCheckFilled size={16} color="var(--mantine-color-teal-6)" />
        </Group>
        <Text fz="sm" fw={600} lh={1.3}>Công ty CP Hàng không Sao Việt</Text>
        <Group justify="space-between" mt={8}>
          <Text fz={11} c="teal.7">Đã cấp mã CQT</Text>
          <Text fz="sm" fw={600} className="tnum">18.351.120 ₫</Text>
        </Group>
      </Paper>

      {/* Đồng bộ */}
      <Paper className="floater float-b" style={{ top: '22%', left: 'calc(50% + 300px)', background: '#f59e0b', color: '#1f1300' }} px="md" py={10} radius="xl" shadow="lg">
        <Group gap={8} wrap="nowrap"><IconBolt size={16} /><Text fz="sm" fw={600}>+18 hoá đơn mới · 42 giây</Text></Group>
      </Paper>

      {/* VAT */}
      <Paper className="floater float-c glass-chip" style={{ top: '58%', left: 'calc(50% + 320px)' }} p="sm" radius="md" w={220}>
        <Group justify="space-between">
          <Text fz={11} c="dimmed">Thuế GTGT tháng 10</Text>
          <Group gap={2} c="teal.7"><IconTrendingUp size={14} /><Text fz={11} inherit>12%</Text></Group>
        </Group>
        <Text fz="lg" fw={700} className="tnum" mt={2}>400.947.500 ₫</Text>
        <svg width="100%" height="34" viewBox="0 0 200 34" preserveAspectRatio="none" style={{ display: 'block', marginTop: 4 }}>
          <defs><linearGradient id="spk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity=".35" /><stop offset="1" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs>
          <path d="M0 26 L25 22 L50 24 L75 15 L100 18 L125 9 L150 13 L175 6 L200 8 L200 34 L0 34Z" fill="url(#spk)" />
          <path d="M0 26 L25 22 L50 24 L75 15 L100 18 L125 9 L150 13 L175 6 L200 8" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </Paper>

      {/* MST */}
      <Paper className="floater float-d glass-chip" style={{ top: '66%', left: 'calc(50% - 540px)' }} px="md" py={10} radius="xl">
        <Group gap={8} wrap="nowrap">
          <ThemeIcon size={22} radius="xl" color="teal" variant="light"><IconShieldCheck size={14} /></ThemeIcon>
          <Text fz="sm"><span className="mono">0100107518</span> · Đang hoạt động</Text>
        </Group>
      </Paper>
    </Box>
  );
}

/**
 * Bố cục trang xác thực: thẻ trung tâm, nền aurora chuyển động + giấy kẻ dòng.
 * `tabs` = true hiển thị công tắc Đăng nhập / Đăng ký ở đầu thẻ.
 */
export function AuthLayout({ title, subtitle, children, footer, tabs = false }: {
  title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; tabs?: boolean;
}) {
  const pathname = (usePathname() || '').replace(/\/$/, '');
  const router = useRouter();
  const mode = pathname.endsWith('/register') ? 'register' : 'login';

  return (
    <Box mih="100vh" pos="relative" className="auth-shell" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Nền */}
      <Box className="aurora" aria-hidden>
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
      </Box>
      <Box pos="absolute" inset={0} className="ledger-bg" style={{ pointerEvents: 'none' }} />
      <Floaters />

      {/* Thanh trên */}
      <Group justify="space-between" px={{ base: 'md', sm: 'xl' }} py="sm" pos="relative" style={{ zIndex: 2 }}>
        <Anchor component={Link} href="/" c="dimmed" fz="sm" underline="never">
          <Group gap={6}><IconArrowLeft size={16} />Trang chủ</Group>
        </Anchor>
        <ThemeToggle />
      </Group>

      {/* Khung */}
      <Box pos="relative" my="auto" px={{ base: 'md', sm: 'xl' }} py="md" style={{ zIndex: 2 }}>
        <Box className="glow-border" mx="auto" maw={420}>
          <Paper radius={17} p={{ base: 'lg', sm: 28 }} className="auth-card">
            <Group gap="sm" wrap="nowrap" mb="md">
              <Box className="logo-glow"><LogoMark size={42} /></Box>
              <Box style={{ minWidth: 0 }}>
                <Text fz={20} fw={700} lh={1.2} className="gradient-text">{title}</Text>
                {subtitle && <Text c="dimmed" fz="xs" mt={3}>{subtitle}</Text>}
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
        </Box>

        {footer && <Box mt="sm" ta="center">{footer}</Box>}

        <Text fz="xs" c="dimmed" ta="center" mt="md" maw={420} mx="auto">
          <IconLock size={13} color="var(--mantine-color-teal-6)" style={{ verticalAlign: -2, marginRight: 4 }} />
          Kết nối SSL · Mật khẩu cổng thuế mã hoá AES-256 · 12.000+ doanh nghiệp
        </Text>
      </Box>

      <Text fz="xs" c="dimmed" ta="center" pos="relative" style={{ zIndex: 2, paddingBottom: 'calc(var(--mantine-spacing-sm) + env(safe-area-inset-bottom, 0px))' }}>
        © 2026 InvoiceHubX · <Anchor fz="xs" c="dimmed">Điều khoản</Anchor> · <Anchor fz="xs" c="dimmed">Bảo mật</Anchor>
      </Text>
    </Box>
  );
}
