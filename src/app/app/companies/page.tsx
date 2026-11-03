'use client';

import {
  ActionIcon, Alert, Avatar, Badge, Box, Button, Card, Group, Loader, Menu, Modal, Paper, PasswordInput, SimpleGrid,
  Stack, Stepper, Switch, Text, TextInput, ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconBuildingSkyscraper, IconCheck, IconDots, IconKey, IconLock, IconPlus, IconRefresh, IconSearch, IconTrash, IconUser,
} from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { PageHeader } from '@/components/AppFrame';
import { STATUS_DOT } from '@/components/CompanySwitcher';
import { initials, timeVN } from '@/lib/format';
import { useStore } from '@/lib/store';

const LOOKUP: Record<string, string> = {
  '0101234567': 'Công ty Cổ phần Công nghệ Sao Mai',
  '0312345678': 'Công ty TNHH Xuất nhập khẩu Đông Á',
};

function AddCompanyModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { addCompany, companies } = useStore();
  const [step, setStep] = useState(0);
  const [mst, setMst] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState('');
  const [pw, setPw] = useState('');

  const reset = () => { setStep(0); setMst(''); setName(''); setUser(''); setPw(''); setBusy(false); };
  const close = () => { onClose(); setTimeout(reset, 250); };
  const validMst = /^\d{10}(-\d{3})?$/.test(mst);
  const dup = companies.some((c) => c.taxCode === mst);

  const lookup = () => {
    setBusy(true);
    setTimeout(() => {
      setName(LOOKUP[mst] ?? `Công ty TNHH Doanh nghiệp ${mst.slice(-4)}`);
      setUser(mst);
      setBusy(false);
      setStep(1);
    }, 900);
  };
  const connect = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); setStep(2); addCompany({ name, taxCode: mst }); }, 1300);
  };

  return (
    <Modal opened={opened} onClose={close} size="lg" title={<Text fw={800} fz="lg">Kết nối mã số thuế mới</Text>}>
      <Stepper active={step} size="sm" color="iris" mb="xl" mt="xs">
        <Stepper.Step label="Mã số thuế" icon={<IconSearch size={16} />} />
        <Stepper.Step label="Đăng nhập cổng thuế" icon={<IconKey size={16} />} />
        <Stepper.Step label="Hoàn tất" icon={<IconCheck size={16} />} />
      </Stepper>

      {step === 0 && (
        <Stack>
          <TextInput
            label="Mã số thuế doanh nghiệp"
            description="10 số, hoặc 13 số với chi nhánh (VD: 0101234567-001)"
            placeholder="0101234567"
            size="md"
            className="mono"
            value={mst}
            onChange={(e) => setMst(e.currentTarget.value.trim())}
            error={dup ? 'MST này đã có trong danh sách' : mst && !validMst ? 'MST không đúng định dạng' : null}
            leftSection={<IconBuildingSkyscraper size={18} />}
          />
          <Button onClick={lookup} disabled={!validMst || dup} loading={busy} size="md">Tra cứu thông tin</Button>
        </Stack>
      )}

      {step === 1 && (
        <Stack>
          <Paper withBorder p="md" radius="lg">
            <Group>
              <Avatar color="iris" radius="xl">{initials(name)}</Avatar>
              <Box><Text fw={700}>{name}</Text><Text fz="sm" c="dimmed" className="mono">MST {mst} · Đang hoạt động</Text></Box>
            </Group>
          </Paper>
          <TextInput label="Tên đăng nhập cổng hoá đơn điện tử" leftSection={<IconUser size={16} />} value={user} onChange={(e) => setUser(e.currentTarget.value)} />
          <PasswordInput label="Mật khẩu" leftSection={<IconLock size={16} />} value={pw} onChange={(e) => setPw(e.currentTarget.value)} placeholder="••••••••" />
          <Alert color="iris" variant="light" radius="lg" icon={<IconLock size={18} />}>Mật khẩu được mã hoá AES-256 và chỉ dùng để tải hoá đơn. Chúng tôi không thể xem.</Alert>
          <Group justify="space-between">
            <Button variant="default" onClick={() => setStep(0)}>Quay lại</Button>
            <Button onClick={connect} loading={busy} disabled={!user || pw.length < 4}>Kết nối</Button>
          </Group>
        </Stack>
      )}

      {step === 2 && (
        <Stack align="center" ta="center" py="md">
          <ThemeIcon size={72} radius="xl" color="volt" ><IconCheck size={40} /></ThemeIcon>
          <Text fw={800} fz="xl">Đã kết nối {name}</Text>
          <Text c="dimmed" maw={420}>Lần đồng bộ đầu tiên sẽ tải hoá đơn của 12 tháng gần nhất. Quá trình chạy nền, bạn có thể đóng cửa sổ này.</Text>
          <Group gap="xs"><Loader size="xs" type="dots" /><Text fz="sm" c="dimmed">Đang khởi tạo đồng bộ…</Text></Group>
          <Button onClick={close} mt="sm">Xong</Button>
        </Stack>
      )}
    </Modal>
  );
}

function CompaniesInner() {
  const params = useSearchParams();
  const { companies, activeId, setActiveId, updateCompany, removeCompany, syncNow } = useStore();
  const [opened, { open, close }] = useDisclosure(false);
  useEffect(() => { if (params.get('add') === '1') open(); }, [params, open]);

  return (
    <>
      <PageHeader
        eyebrow="Doanh nghiệp"
        title="Mã số thuế đang quản lý"
        subtitle="Kết nối không giới hạn MST với gói Pro. Mỗi MST được đồng bộ độc lập theo lịch riêng."
        right={<Button size="md" leftSection={<IconPlus size={18} />} onClick={open}>Thêm MST</Button>}
      />
      <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }}>
        {companies.map((c) => {
          const st = STATUS_DOT[c.status]!;
          const isActive = c.id === activeId;
          return (
            <Card key={c.id} className="glass lift" p="lg" style={isActive ? { borderColor: 'var(--mantine-color-iris-5)', boxShadow: '0 0 0 1px var(--mantine-color-iris-5)' } : undefined}>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group wrap="nowrap" style={{ minWidth: 0 }}>
                  <Avatar size={48} radius="lg" color={c.color} variant="filled">{initials(c.shortName)}</Avatar>
                  <Box style={{ minWidth: 0 }}>
                    <Text fw={800} truncate>{c.shortName}</Text>
                    <Text fz="xs" c="dimmed" className="mono">MST {c.taxCode}</Text>
                  </Box>
                </Group>
                <Menu position="bottom-end">
                  <Menu.Target><ActionIcon variant="subtle" color="gray"><IconDots size={18} /></ActionIcon></Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconKey size={14} />}>Cập nhật mật khẩu cổng thuế</Menu.Item>
                    <Menu.Item leftSection={<IconRefresh size={14} />} onClick={() => { setActiveId(c.id); syncNow(); }}>Đồng bộ ngay</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="red" leftSection={<IconTrash size={14} />} disabled={companies.length === 1}
                      onClick={() => { removeCompany(c.id); notifications.show({ color: 'red', title: 'Đã ngắt kết nối', message: c.shortName }); }}>
                      Ngắt kết nối
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
              <Text fz="sm" c="dimmed" mt="md" lineClamp={2} mih={42}>{c.name}</Text>
              <Group mt="md" gap="xs">
                <Badge color={st.color} variant="dot">{st.label}</Badge>
                <Badge color="gray" variant="light">{c.invoices.toLocaleString('vi-VN')} hoá đơn</Badge>
              </Group>
              {c.status === 'error' && (
                <Alert mt="md" color="red" variant="light" radius="md" p="xs" title="Đăng nhập thất bại">
                  <Text fz="xs">Mật khẩu cổng thuế đã thay đổi. Cập nhật để tiếp tục đồng bộ.</Text>
                </Alert>
              )}
              <Group justify="space-between" mt="lg" pt="md" style={{ borderTop: '1px solid var(--ihx-border)' }}>
                <Box>
                  <Text fz={11} c="dimmed">Đồng bộ lần cuối</Text>
                  <Text fz="sm" fw={600}>{timeVN(c.lastSync)}</Text>
                </Box>
                <Switch label="Tự động" checked={c.autoSync} onChange={(e) => updateCompany(c.id, { autoSync: e.currentTarget.checked })} color="volt" styles={{ thumb: { background: '#0a0b12' } }} />
              </Group>
              <Button fullWidth mt="md" variant={isActive ? 'filled' : 'light'} onClick={() => setActiveId(c.id)} disabled={isActive}>
                {isActive ? 'Đang làm việc' : 'Chuyển sang MST này'}
              </Button>
            </Card>
          );
        })}
        <Card p="lg" onClick={open} style={{ borderStyle: 'dashed', cursor: 'pointer', background: 'transparent' }} className="lift">
          <Stack align="center" justify="center" h="100%" mih={260} gap="sm">
            <ThemeIcon size={56} radius="xl" variant="light"><IconPlus size={28} /></ThemeIcon>
            <Text fw={800}>Thêm doanh nghiệp</Text>
            <Text fz="sm" c="dimmed" ta="center" maw={240}>Chỉ cần MST và tài khoản cổng hoá đơn điện tử</Text>
          </Stack>
        </Card>
      </SimpleGrid>
      <AddCompanyModal opened={opened} onClose={close} />
    </>
  );
}

export default function CompaniesPage() {
  return <Suspense><CompaniesInner /></Suspense>;
}
