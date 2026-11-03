'use client';

import { Avatar, Badge, Box, Divider, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { IconCheck, IconChevronDown, IconPlus, IconSettings2 } from '@tabler/icons-react';
import Link from 'next/link';
import { initials } from '@/lib/format';
import { useStore } from '@/lib/store';

export const STATUS_DOT: Record<string, { color: string; label: string }> = {
  connected: { color: 'teal', label: 'Đang kết nối' },
  syncing: { color: 'iris', label: 'Đang đồng bộ' },
  error: { color: 'red', label: 'Lỗi đăng nhập' },
};

export function CompanySwitcher({ compact = false }: { compact?: boolean }) {
  const { companies, active, setActiveId } = useStore();
  return (
    <Menu width={360} position="bottom-start" radius="lg" shadow="xl" withinPortal>
      <Menu.Target>
        <UnstyledButton
          className="glass"
          style={{ border: '1px solid', borderRadius: 999, padding: '4px 12px 4px 4px', maxWidth: compact ? 220 : 340 }}
        >
          <Group gap={10} wrap="nowrap">
            <Avatar color={active.color} variant="filled" radius="xl" size={34}>
              {initials(active.shortName)}
            </Avatar>
            <Box style={{ minWidth: 0 }}>
              <Text fz="sm" fw={700} truncate>
                {active.shortName}
              </Text>
              <Text fz={11} c="dimmed" className="mono">
                MST {active.taxCode}
              </Text>
            </Box>
            <IconChevronDown size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown p={6}>
        <Menu.Label>Doanh nghiệp đang quản lý · {companies.length}</Menu.Label>
        {companies.map((c) => (
          <Menu.Item
            key={c.id}
            onClick={() => setActiveId(c.id)}
            py={8}
            leftSection={
              <Avatar color={c.color} variant={c.id === active.id ? 'filled' : 'light'} radius="xl" size={34}>
                {initials(c.shortName)}
              </Avatar>
            }
            rightSection={c.id === active.id ? <IconCheck size={16} color="var(--mantine-color-volt-5)" /> : null}
          >
            <Text fz="sm" fw={600} truncate maw={230}>
              {c.name}
            </Text>
            <Group gap={6}>
              <Text fz={11} c="dimmed" className="mono">
                {c.taxCode}
              </Text>
              <Badge size="xs" color={STATUS_DOT[c.status]!.color} variant="dot">
                {STATUS_DOT[c.status]!.label}
              </Badge>
            </Group>
          </Menu.Item>
        ))}
        <Divider my={6} />
        <Menu.Item component={Link} href="/app/companies?add=1" leftSection={<IconPlus size={16} />} c="iris.7" fw={600}>
          Thêm mã số thuế
        </Menu.Item>
        <Menu.Item component={Link} href="/app/companies" leftSection={<IconSettings2 size={16} />}>
          Quản lý doanh nghiệp
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
