'use client';

import {
  ActionIcon, AppShell, Avatar, Badge, Box, Burger, Button, Group, Indicator, Kbd, Menu, NavLink, Paper,
  Progress, ScrollArea, Stack, Text, Tooltip, UnstyledButton,
} from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { Spotlight, spotlight, type SpotlightActionData } from '@mantine/spotlight';
import {
  IconBell, IconBuildingStore, IconCreditCard, IconFileInvoice, IconHelpCircle, IconLayoutDashboard,
  IconLogout, IconRefresh, IconSearch, IconSparkles, IconUserCircle, IconArrowsExchange, IconBolt,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { initials } from '@/lib/format';
import { useStore } from '@/lib/store';
import { CompanySwitcher } from './CompanySwitcher';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export const NAV = [
  { href: '/app', label: 'Tổng quan', icon: IconLayoutDashboard },
  { href: '/app/invoices', label: 'Hoá đơn', icon: IconFileInvoice },
  { href: '/app/companies', label: 'Doanh nghiệp · MST', icon: IconBuildingStore },
  { href: '/app/sync', label: 'Trung tâm đồng bộ', icon: IconArrowsExchange },
  { href: '/app/billing', label: 'Gói & thanh toán', icon: IconCreditCard },
  { href: '/app/account', label: 'Tài khoản của tôi', icon: IconUserCircle },
];

const norm = (p: string) => (p.length > 1 ? p.replace(/\/$/, '') : p);

function PlanWidget() {
  const { plan } = useStore();
  const end = new Date(plan.expiresAt).getTime();
  const start = new Date(plan.startedAt).getTime();
  const now = new Date('2026-11-03').getTime();
  const left = Math.max(0, Math.ceil((end - now) / 86400000));
  const pct = Math.min(100, ((now - start) / (end - start)) * 100);
  return (
    <Paper p="md" radius="lg" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,.08), rgba(245,158,11,.08))', border: '1px solid rgba(37,99,235,.2)' }}>
      <Group justify="space-between" mb={6}>
        <Badge color="volt" variant="light" leftSection={<IconSparkles size={12} />}>
          {plan.id === 'plus' ? 'Cloud+' : plan.id === 'pro' ? 'Pro' : 'Starter'}
        </Badge>
        <Text fz="xs" c="dimmed">còn {left} ngày</Text>
      </Group>
      <Progress value={pct} color="volt" size="sm" radius="xl" mb="sm" />
      <Button component={Link} href="/app/billing" fullWidth size="xs" className="volt-btn" leftSection={<IconBolt size={14} />}>
        Gia hạn · tiết kiệm 65%
      </Button>
    </Paper>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = norm(usePathname() || '/app');
  const router = useRouter();
  const { user, syncNow, syncing, invoices, companies, setActiveId } = useStore();

  useHotkeys([['mod+J', () => syncNow()]]);

  const actions: SpotlightActionData[] = [
    ...NAV.map((n) => ({
      id: n.href,
      label: n.label,
      description: 'Đi tới trang',
      group: 'Điều hướng',
      leftSection: <n.icon size={20} />,
      onClick: () => router.push(n.href),
    })),
    { id: 'sync', label: 'Đồng bộ ngay', description: 'Tải hoá đơn mới từ cổng thuế (⌘J)', group: 'Thao tác', leftSection: <IconRefresh size={20} />, onClick: syncNow },
    ...companies.map((c) => ({
      id: 'co-' + c.id,
      label: c.shortName,
      description: `Chuyển sang MST ${c.taxCode}`,
      group: 'Doanh nghiệp',
      leftSection: <Avatar size={22} color={c.color} radius="xl">{initials(c.shortName)}</Avatar>,
      onClick: () => setActiveId(c.id),
    })),
    ...invoices.slice(0, 40).map((i) => ({
      id: i.id,
      label: `${i.symbol} · ${i.number}`,
      description: i.partnerName,
      group: 'Hoá đơn gần đây',
      leftSection: <IconFileInvoice size={20} />,
      onClick: () => router.push(`/app/invoices?q=${i.number}`),
    })),
  ];

  return (
    <AppShell
      header={{ height: 72 }}
      navbar={{ width: 272, breakpoint: 'md', collapsed: { mobile: !opened } }}
      padding={{ base: 'md', md: 'xl' }}
    >
      <AppShell.Header className="glass" withBorder>
        <Group h="100%" px={{ base: 'md', md: 'xl' }} justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
            <Box hiddenFrom="md"><Link href="/app" style={{ color: 'inherit', textDecoration: 'none' }}><Logo size={26} /></Link></Box>
            <Box visibleFrom="sm"><CompanySwitcher /></Box>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <UnstyledButton onClick={() => spotlight.open()} visibleFrom="lg" className="glass" style={{ border: '1px solid', borderRadius: 999, padding: '8px 14px', width: 280 }}>
              <Group gap={8} wrap="nowrap">
                <IconSearch size={16} opacity={0.6} />
                <Text fz="sm" c="dimmed" style={{ flex: 1 }}>Tìm hoá đơn, MST, lệnh…</Text>
                <Kbd size="xs">⌘ K</Kbd>
              </Group>
            </UnstyledButton>
            <ActionIcon hiddenFrom="lg" variant="default" size="lg" radius="xl" onClick={() => spotlight.open()} aria-label="Tìm kiếm">
              <IconSearch size={18} />
            </ActionIcon>
            <Tooltip label="Đồng bộ ngay (⌘J)">
              <Indicator label="3" size={16} color="red" offset={4} disabled={syncing}>
                <ActionIcon variant="light" size="lg" radius="xl" onClick={syncNow} aria-label="Đồng bộ">
                  <IconRefresh size={18} className={syncing ? 'spin' : undefined} />
                </ActionIcon>
              </Indicator>
            </Tooltip>
            <ActionIcon variant="default" size="lg" radius="xl" aria-label="Thông báo" visibleFrom="xs">
              <IconBell size={18} />
            </ActionIcon>
            <ThemeToggle />
            <Menu position="bottom-end" width={240} shadow="xl">
              <Menu.Target>
                <Avatar component="button" radius="xl" color="iris" variant="filled" style={{ border: 'none', cursor: 'pointer' }}>
                  {initials(user.name)}
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Box px="sm" py={6}>
                  <Text fw={700} fz="sm">{user.name}</Text>
                  <Text fz="xs" c="dimmed">{user.email}</Text>
                </Box>
                <Menu.Divider />
                <Menu.Item component={Link} href="/app/account" leftSection={<IconUserCircle size={16} />}>Tài khoản</Menu.Item>
                <Menu.Item component={Link} href="/app/billing" leftSection={<IconCreditCard size={16} />}>Gói & thanh toán</Menu.Item>
                <Menu.Item leftSection={<IconHelpCircle size={16} />}>Trung tâm trợ giúp</Menu.Item>
                <Menu.Divider />
                <Menu.Item component={Link} href="/" color="red" leftSection={<IconLogout size={16} />}>Đăng xuất</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" className="glass">
        <AppShell.Section visibleFrom="md" mb="lg" px={6}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}><Logo /></Link>
        </AppShell.Section>
        <AppShell.Section hiddenFrom="sm" mb="md"><CompanySwitcher compact /></AppShell.Section>
        <AppShell.Section grow component={ScrollArea}>
          <Text fz={11} fw={700} c="dimmed" tt="uppercase" lts={1.2} px={12} mb={6}>Không gian làm việc</Text>
          <Stack gap={4}>
            {NAV.map((n) => {
              const activeNav = n.href === '/app' ? pathname === '/app' : pathname.startsWith(n.href);
              return (
                <NavLink
                  key={n.href}
                  component={Link}
                  href={n.href}
                  label={n.label}
                  onClick={close}
                  leftSection={<n.icon size={19} stroke={1.7} />}
                  active={activeNav}
                  variant="subtle"
                  className="nav-link"
                  style={{ borderRadius: 12 }}
                  fw={600}
                  rightSection={n.href === '/app/invoices' ? <Badge size="xs" color="volt" variant="light" >{invoices.length}</Badge> : null}
                />
              );
            })}
          </Stack>
        </AppShell.Section>
        <AppShell.Section mt="md"><PlanWidget /></AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box maw={1360} mx="auto">{children}</Box>
      </AppShell.Main>

      <Spotlight
        actions={actions}
        nothingFound="Không tìm thấy kết quả"
        highlightQuery
        limit={12}
        shortcut={['mod + K', '/']}
        searchProps={{ leftSection: <IconSearch size={18} />, placeholder: 'Tìm hoá đơn, doanh nghiệp, trang…' }}
        radius="lg"
      />
    </AppShell>
  );
}

export function PageHeader({ title, subtitle, right, eyebrow }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <Group justify="space-between" align="flex-end" mb="xl" gap="md">
      <Box>
        {eyebrow && <Text fz="xs" fw={700} tt="uppercase" lts={1.5} c="iris.7" mb={4}>{eyebrow}</Text>}
        <Text component="h1" fz={{ base: 26, md: 34 }} fw={800} lts={-0.5} lh={1.1} m={0}>{title}</Text>
        {subtitle && <Text c="dimmed" mt={6} maw={680}>{subtitle}</Text>}
      </Box>
      {right}
    </Group>
  );
}
