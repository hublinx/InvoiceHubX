'use client';

import {
  ActionIcon, AppShell, Avatar, Badge, Box, Burger, Button, Group, Indicator, Kbd, Menu, NavLink, Paper,
  Progress, ScrollArea, Stack, Text, Tooltip, UnstyledButton,
} from '@mantine/core';
import { useDisclosure, useHotkeys, useLocalStorage } from '@mantine/hooks';
import { Center, Loader } from '@mantine/core';
import { Spotlight, spotlight, type SpotlightActionData } from '@mantine/spotlight';
import {
  IconArrowsExchange, IconBell, IconBolt, IconBuildingStore, IconCalculator, IconCreditCard, IconFileInvoice,
  IconHelpCircle, IconLayoutDashboard, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconLogout,
  IconRefresh, IconSearch, IconSparkles, IconUserCircle, IconFileCode, IconZoomCheck,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { initials } from '@/lib/format';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { CompanySwitcher } from './CompanySwitcher';
import { Logo, LogoMark } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export const NAV_GROUPS = [
  {
    label: 'Nghiệp vụ',
    items: [
      { href: '/app', label: 'Tổng quan', icon: IconLayoutDashboard },
      { href: '/app/invoices', label: 'Hoá đơn', icon: IconFileInvoice },
      { href: '/app/xml-reader', label: 'Đọc hoá đơn XML', icon: IconFileCode },
      { href: '/app/lookup', label: 'Tra cứu MST', icon: IconZoomCheck },
      { href: '/app/tools', label: 'Công cụ kế toán', icon: IconCalculator },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      { href: '/app/companies', label: 'Doanh nghiệp · MST', icon: IconBuildingStore },
      { href: '/app/sync', label: 'Trung tâm đồng bộ', icon: IconArrowsExchange },
    ],
  },
  {
    label: 'Tài khoản',
    items: [
      { href: '/app/billing', label: 'Gói & thanh toán', icon: IconCreditCard },
      { href: '/app/account', label: 'Tài khoản của tôi', icon: IconUserCircle },
    ],
  },
];
export const NAV = NAV_GROUPS.flatMap((g) => g.items);

const NAV_W = 264;
const NAV_W_MINI = 76;
const norm = (p: string) => (p.length > 1 ? p.replace(/\/$/, '') : p);

function usePlanInfo() {
  const { plan } = useStore();
  const end = new Date(plan.expiresAt).getTime();
  const start = new Date(plan.startedAt).getTime();
  const now = new Date('2026-11-03').getTime();
  return {
    name: plan.id === 'plus' ? 'Cloud+' : plan.id === 'pro' ? 'Pro' : 'Starter',
    left: Math.max(0, Math.ceil((end - now) / 86400000)),
    pct: Math.min(100, ((now - start) / (end - start)) * 100),
  };
}

function PlanWidget({ mini }: { mini: boolean }) {
  const { name, left, pct } = usePlanInfo();
  if (mini) {
    return (
      <Tooltip label={`Gói ${name} · còn ${left} ngày`} position="right">
        <ActionIcon component={Link} href="/app/billing" size={44} radius="md" variant="light" color="volt" mx="auto" aria-label="Gói dịch vụ">
          <IconSparkles size={20} />
        </ActionIcon>
      </Tooltip>
    );
  }
  return (
    <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-iris-light)' }}>
      <Group justify="space-between" mb={8}>
        <Badge color="volt" variant="light" leftSection={<IconSparkles size={12} />}>{name}</Badge>
        <Text fz="xs" c="dimmed">còn {left} ngày</Text>
      </Group>
      <Progress value={pct} color="iris" size="sm" radius="xl" mb="sm" />
      <Button component={Link} href="/app/billing" fullWidth size="xs" leftSection={<IconBolt size={14} />}>Gia hạn gói</Button>
    </Paper>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const [collapsed, setCollapsed] = useLocalStorage({ key: 'ihx-nav-collapsed', defaultValue: false });
  const pathname = norm(usePathname() || '/app');
  const router = useRouter();
  const { user, syncNow, syncing, invoices, companies, setActiveId } = useStore();
  const { ready, session, signOut } = useAuth();
  // Chưa đăng nhập → chuyển sang trang đăng nhập, giữ lại trang đang mở
  useEffect(() => {
    if (ready && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, session, pathname, router]);
  const logout = () => { signOut(); router.replace('/login'); };
  // Trên mobile, menu luôn hiển thị đầy đủ khi mở
  const mini = collapsed && !opened;

  useHotkeys([
    ['mod+J', () => syncNow()],
    ['mod+B', () => setCollapsed((c) => !c)],
  ]);

  const actions: SpotlightActionData[] = [
    ...NAV.map((n) => ({
      id: n.href, label: n.label, description: 'Đi tới trang', group: 'Điều hướng',
      leftSection: <n.icon size={20} />, onClick: () => router.push(n.href),
    })),
    { id: 'sync', label: 'Đồng bộ ngay', description: 'Tải hoá đơn mới từ cổng thuế (⌘J)', group: 'Thao tác', leftSection: <IconRefresh size={20} />, onClick: syncNow },
    ...companies.map((c) => ({
      id: 'co-' + c.id, label: c.shortName, description: `Chuyển sang MST ${c.taxCode}`, group: 'Doanh nghiệp',
      leftSection: <Avatar size={22} color={c.color} radius="xl">{initials(c.shortName)}</Avatar>,
      onClick: () => setActiveId(c.id),
    })),
    ...invoices.slice(0, 40).map((i) => ({
      id: i.id, label: `${i.symbol} · ${i.number}`, description: i.partnerName, group: 'Hoá đơn gần đây',
      leftSection: <IconFileInvoice size={20} />, onClick: () => router.push(`/app/invoices?q=${i.number}`),
    })),
  ];

  if (!ready || !session) {
    return <Center h="100vh"><Loader /></Center>;
  }

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: { base: NAV_W, md: collapsed ? NAV_W_MINI : NAV_W }, breakpoint: 'md', collapsed: { mobile: !opened } }}
      padding={{ base: 'md', md: 'lg', xl: 'xl' }}
      transitionDuration={200}
    >
      <AppShell.Header withBorder>
        <Group h="100%" px={{ base: 'md', md: 'lg' }} justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" aria-label="Mở menu" />
            <Tooltip label={collapsed ? 'Mở rộng menu (⌘B)' : 'Thu gọn menu (⌘B)'}>
              <ActionIcon visibleFrom="md" variant="subtle" color="gray" size="lg" onClick={() => setCollapsed((c) => !c)} aria-label="Thu gọn menu">
                {collapsed ? <IconLayoutSidebarLeftExpand size={20} /> : <IconLayoutSidebarLeftCollapse size={20} />}
              </ActionIcon>
            </Tooltip>
            <Box hiddenFrom="md"><Link href="/app" style={{ color: 'inherit', textDecoration: 'none' }}><Logo size={24} /></Link></Box>
            <Box visibleFrom="sm"><CompanySwitcher /></Box>
          </Group>
          <Group gap={8} wrap="nowrap">
            <UnstyledButton onClick={() => spotlight.open()} visibleFrom="lg" style={{ border: '1px solid var(--ihx-border)', borderRadius: 8, padding: '7px 12px', width: 260, background: 'var(--ihx-surface)' }}>
              <Group gap={8} wrap="nowrap">
                <IconSearch size={16} opacity={0.6} />
                <Text fz="sm" c="dimmed" style={{ flex: 1 }}>Tìm hoá đơn, MST, lệnh…</Text>
                <Kbd size="xs">⌘ K</Kbd>
              </Group>
            </UnstyledButton>
            <ActionIcon hiddenFrom="lg" variant="default" size="lg" onClick={() => spotlight.open()} aria-label="Tìm kiếm"><IconSearch size={18} /></ActionIcon>
            <Tooltip label="Đồng bộ ngay (⌘J)">
              <Indicator label="3" size={16} color="red" offset={4} disabled={syncing}>
                <ActionIcon variant="light" size="lg" onClick={syncNow} aria-label="Đồng bộ">
                  <IconRefresh size={18} className={syncing ? 'spin' : undefined} />
                </ActionIcon>
              </Indicator>
            </Tooltip>
            <ActionIcon variant="default" size="lg" aria-label="Thông báo" visibleFrom="xs"><IconBell size={18} /></ActionIcon>
            <ThemeToggle />
            <Menu position="bottom-end" width={240} shadow="md">
              <Menu.Target>
                <Avatar component="button" src={user.avatar} radius="xl" color="iris" variant="filled" style={{ border: 'none', cursor: 'pointer' }} aria-label="Tài khoản">{initials(user.name)}</Avatar>
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
                <Menu.Item onClick={logout} color="red" leftSection={<IconLogout size={16} />}>Đăng xuất</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={mini ? 'sm' : 'md'} style={{ transition: 'width 200ms ease, padding 200ms ease' }}>
        <AppShell.Section visibleFrom="md" mb="md" h={40} style={{ display: 'flex', alignItems: 'center', justifyContent: mini ? 'center' : 'flex-start' }} px={mini ? 0 : 8}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>{mini ? <LogoMark size={34} /> : <Logo size={28} />}</Link>
        </AppShell.Section>
        <AppShell.Section hiddenFrom="sm" mb="md"><CompanySwitcher compact /></AppShell.Section>

        <AppShell.Section grow component={ScrollArea} scrollbarSize={6}>
          <Stack gap="md">
            {NAV_GROUPS.map((g) => (
              <Box key={g.label}>
                {mini ? (
                  <Box h={1} mx="sm" mb={8} bg="var(--ihx-border)" />
                ) : (
                  <Text fz={11} fw={700} c="dimmed" tt="uppercase" lts={1} px={12} mb={6}>{g.label}</Text>
                )}
                <Stack gap={2}>
                  {g.items.map((n) => {
                    const isActive = n.href === '/app' ? pathname === '/app' : pathname.startsWith(n.href);
                    const badge = n.href === '/app/invoices' ? invoices.length : null;
                    const link = (
                      <NavLink
                        key={n.href}
                        component={Link}
                        href={n.href}
                        onClick={close}
                        label={mini ? null : n.label}
                        aria-label={n.label}
                        leftSection={<n.icon size={20} stroke={1.7} />}
                        rightSection={!mini && badge ? <Badge size="sm" variant="light" color="gray">{badge}</Badge> : null}
                        active={isActive}
                        variant="light"
                        className="nav-link"
                        h={42}
                        px={mini ? 0 : 12}
                        styles={{
                          root: { borderRadius: 8, justifyContent: mini ? 'center' : undefined },
                          section: mini ? { marginInlineEnd: 0 } : undefined,
                          label: { fontWeight: 600, fontSize: 14 },
                          body: mini ? { display: 'none' } : undefined,
                        }}
                      />
                    );
                    return mini ? <Tooltip key={n.href} label={n.label} position="right" withArrow>{link}</Tooltip> : link;
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section mt="md"><PlanWidget mini={mini} /></AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box maw={1400} mx="auto">{children}</Box>
      </AppShell.Main>

      <Spotlight
        actions={actions}
        nothingFound="Không tìm thấy kết quả"
        highlightQuery
        limit={12}
        shortcut={['mod + K', '/']}
        searchProps={{ leftSection: <IconSearch size={18} />, placeholder: 'Tìm hoá đơn, doanh nghiệp, trang…' }}
        radius="md"
      />
    </AppShell>
  );
}

/** Tiêu đề trang thống nhất cho mọi màn hình trong app */
export function PageHeader({ title, subtitle, right, eyebrow }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <Group justify="space-between" align="flex-end" mb="lg" gap="md">
      <Box style={{ minWidth: 0 }}>
        {eyebrow && <Text fz="xs" fw={700} tt="uppercase" lts={1.2} c="iris.7" mb={4}>{eyebrow}</Text>}
        <Text component="h1" fz={{ base: 22, md: 28 }} fw={800} lh={1.2} m={0}>{title}</Text>
        {subtitle && <Text c="dimmed" fz="sm" mt={4} maw={720}>{subtitle}</Text>}
      </Box>
      {right && <Group gap="sm">{right}</Group>}
    </Group>
  );
}

/** Card chuẩn: header (tiêu đề + mô tả + hành động) và nội dung, padding đều 20px */
export function SectionCard({ title, description, actions, children, noPadding, h }: {
  title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; noPadding?: boolean; h?: string | number;
}) {
  return (
    <Paper className="glass" withBorder radius="md" h={h} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {(title || actions) && (
        <Group justify="space-between" align="flex-start" px={20} pt={18} pb={noPadding ? 14 : 0} gap="sm" wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            {title && <Text component="div" fw={700} fz="md">{title}</Text>}
            {description && <Text component="div" fz="xs" c="dimmed" mt={2}>{description}</Text>}
          </Box>
          {actions && <Group gap="xs" wrap="nowrap">{actions}</Group>}
        </Group>
      )}
      <Box p={noPadding ? 0 : 20} pt={noPadding ? 0 : title || actions ? 14 : 20} style={{ flex: 1 }}>{children}</Box>
    </Paper>
  );
}
