'use client';

import {
  Avatar, Badge, Box, Button, Card, Group, PasswordInput, Popover, Progress, SimpleGrid, Stack, Switch, Tabs, Text,
  TextInput, ThemeIcon, Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBell, IconCheck, IconDeviceDesktop, IconDeviceMobile, IconLock, IconMail, IconPhone, IconShieldLock, IconTrash, IconUser, IconX, IconApps,
} from '@tabler/icons-react';
import { useState } from 'react';
import { PageHeader } from '@/components/AppFrame';
import { DEVICES } from '@/lib/data';
import { dateVN, initials } from '@/lib/format';
import { useStore } from '@/lib/store';

const RULES = [
  { re: /.{8,}/, label: 'Tối thiểu 8 ký tự' },
  { re: /[A-Z]/, label: 'Có chữ in hoa' },
  { re: /[0-9]/, label: 'Có chữ số' },
  { re: /[^A-Za-z0-9]/, label: 'Có ký tự đặc biệt' },
];

function PasswordCard() {
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pop, setPop] = useState(false);
  const score = RULES.filter((r) => r.re.test(pw)).length;
  const color = score < 2 ? 'red' : score < 4 ? 'yellow' : 'teal';
  const ok = cur && score === 4 && pw === pw2;
  return (
    <Card className="glass" p="xl">
      <Text fw={800} fz="lg">Đổi mật khẩu</Text>
      <Text fz="sm" c="dimmed" mb="lg">Mật khẩu mạnh giúp bảo vệ dữ liệu hoá đơn của mọi doanh nghiệp bạn quản lý.</Text>
      <Stack maw={480}>
        <PasswordInput label="Mật khẩu hiện tại" leftSection={<IconLock size={16} />} value={cur} onChange={(e) => setCur(e.currentTarget.value)} />
        <Popover opened={pop} position="bottom-start" width="target" transitionProps={{ transition: 'pop' }}>
          <Popover.Target>
            <div onFocusCapture={() => setPop(true)} onBlurCapture={() => setPop(false)}>
              <PasswordInput label="Mật khẩu mới" leftSection={<IconShieldLock size={16} />} value={pw} onChange={(e) => setPw(e.currentTarget.value)} />
            </div>
          </Popover.Target>
          <Popover.Dropdown>
            <Progress color={color} value={(score / 4) * 100} size={6} mb="sm" radius="xl" />
            {RULES.map((r) => {
              const pass = r.re.test(pw);
              return <Group key={r.label} gap={6} c={pass ? 'teal' : 'red'} mt={4}>{pass ? <IconCheck size={14} /> : <IconX size={14} />}<Text fz="sm">{r.label}</Text></Group>;
            })}
          </Popover.Dropdown>
        </Popover>
        <PasswordInput label="Nhập lại mật khẩu mới" value={pw2} onChange={(e) => setPw2(e.currentTarget.value)} error={pw2 && pw !== pw2 ? 'Mật khẩu không khớp' : null} />
        <Group justify="flex-end"><Button disabled={!ok} onClick={() => { notifications.show({ color: 'teal', title: 'Đã đổi mật khẩu', message: 'Các thiết bị khác sẽ được yêu cầu đăng nhập lại.' }); setCur(''); setPw(''); setPw2(''); }}>Cập nhật mật khẩu</Button></Group>
      </Stack>
    </Card>
  );
}

export default function AccountPage() {
  const { user, setUser, plan } = useStore();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [devices, setDevices] = useState(DEVICES);
  const [twoFa, setTwoFa] = useState(false);
  const dirty = name !== user.name || phone !== user.phone;

  return (
    <>
      <PageHeader eyebrow="Cá nhân" title="Tài khoản của tôi" subtitle="Quản lý hồ sơ, bảo mật, thiết bị đăng nhập và cách bạn nhận thông báo." />

      <Card p={0} mb="lg" style={{ overflow: 'hidden' }} className="glass">
        <Box h={110} style={{ background: 'linear-gradient(110deg, #0f1f3d, #1e3a8a 50%, #3b82f6)' }} />
        <Group px="xl" pb="lg" mt={-44} justify="space-between" align="flex-end">
          <Group align="flex-end">
            <Avatar size={96} radius={28} color="iris" variant="filled" style={{ border: '4px solid var(--mantine-color-body)' }} fz={32}>{initials(user.name)}</Avatar>
            <Box pb={6}>
              <Group gap="xs"><Text fz={24} fw={800}>{user.name}</Text><Badge color="volt" variant="light" >{plan.id.toUpperCase()}</Badge></Group>
              <Text c="dimmed" fz="sm">Thành viên từ {dateVN(user.joinedAt)} · {user.email}</Text>
            </Box>
          </Group>
        </Group>
      </Card>

      <Tabs defaultValue="profile" variant="pills" radius="xl">
        <Tabs.List mb="lg">
          <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>Hồ sơ</Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<IconShieldLock size={16} />}>Bảo mật</Tabs.Tab>
          <Tabs.Tab value="devices" leftSection={<IconDeviceDesktop size={16} />}>Thiết bị · {devices.length}</Tabs.Tab>
          <Tabs.Tab value="notify" leftSection={<IconBell size={16} />}>Thông báo</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profile">
          <Card className="glass" p="xl">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <TextInput label="Họ và tên" leftSection={<IconUser size={16} />} value={name} onChange={(e) => setName(e.currentTarget.value)} />
              <TextInput label="Số điện thoại" leftSection={<IconPhone size={16} />} value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
              <TextInput
                label={<Group gap={6}>Email <Badge size="xs" color="teal" leftSection={<IconCheck size={10} />}>Đã xác thực</Badge></Group>}
                leftSection={<IconMail size={16} />}
                value={user.email}
                disabled
                description="Email dùng để đăng nhập và nhận mã OTP. Liên hệ hỗ trợ nếu cần đổi."
              />
            </SimpleGrid>
            <Group justify="flex-end" mt="xl">
              <Button variant="default" disabled={!dirty} onClick={() => { setName(user.name); setPhone(user.phone); }}>Huỷ</Button>
              <Button disabled={!dirty} onClick={() => { setUser({ ...user, name, phone }); notifications.show({ color: 'teal', title: 'Đã lưu', message: 'Hồ sơ đã được cập nhật.' }); }}>Lưu thay đổi</Button>
            </Group>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="security">
          <Stack gap="lg">
            <PasswordCard />
            <Card className="glass" p="xl">
              <Group justify="space-between">
                <Group>
                  <ThemeIcon size={44} radius="md" variant="light" color="volt"><IconShieldLock size={22} /></ThemeIcon>
                  <Box><Text fw={800}>Xác thực 2 lớp (2FA)</Text><Text fz="sm" c="dimmed">Yêu cầu mã OTP qua email khi đăng nhập trên thiết bị mới.</Text></Box>
                </Group>
                <Switch size="lg" checked={twoFa} onChange={(e) => setTwoFa(e.currentTarget.checked)} onLabel="BẬT" offLabel="TẮT" />
              </Group>
            </Card>
            <Card p="xl" style={{ borderColor: 'var(--mantine-color-red-8)' }} className="glass">
              <Text fw={800} c="red.5">Vùng nguy hiểm</Text>
              <Group justify="space-between" mt="sm">
                <Text fz="sm" c="dimmed" maw={520}>Xoá vĩnh viễn tài khoản và toàn bộ dữ liệu hoá đơn đã lưu trên Cloud. Không thể hoàn tác.</Text>
                <Button color="red" variant="light" leftSection={<IconTrash size={16} />}>Xoá tài khoản</Button>
              </Group>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="devices">
          <Card className="glass" p="xl">
            <Group justify="space-between" mb="md">
              <Box><Text fw={800} fz="lg">Thiết bị đang đăng nhập</Text><Text fz="sm" c="dimmed">Gói Pro cho phép tối đa 5 thiết bị cùng lúc.</Text></Box>
              <Button variant="light" color="red" disabled={devices.length <= 1} onClick={() => setDevices((d) => d.filter((x) => x.current))}>Đăng xuất tất cả thiết bị khác</Button>
            </Group>
            <Stack gap={0}>
              {devices.map((d, i) => {
                const Icon = d.kind === 'mobile' ? IconDeviceMobile : d.kind === 'app' ? IconApps : IconDeviceDesktop;
                return (
                  <Box key={d.id}>
                    {i > 0 && <Divider />}
                    <Group justify="space-between" py="md">
                      <Group>
                        <ThemeIcon size={44} radius="md" variant="light" color={d.current ? 'teal' : 'gray'}><Icon size={22} /></ThemeIcon>
                        <Box>
                          <Group gap={6}><Text fw={700}>{d.name}</Text>{d.current && <Badge color="teal" size="xs">Thiết bị này</Badge>}</Group>
                          <Text fz="sm" c="dimmed">{d.location} · {d.lastActive}</Text>
                        </Box>
                      </Group>
                      {!d.current && <Button variant="subtle" color="red" size="xs" onClick={() => setDevices((ds) => ds.filter((x) => x.id !== d.id))}>Đăng xuất</Button>}
                    </Group>
                  </Box>
                );
              })}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="notify">
          <Card className="glass" p="xl">
            <Stack gap="lg">
              {[
                ['Có hoá đơn đầu vào mới', 'Gửi tóm tắt mỗi lần đồng bộ có dữ liệu mới', true],
                ['MST đối tác rủi ro', 'Cảnh báo ngay khi phát hiện MST ngừng hoạt động', true],
                ['Đồng bộ thất bại', 'Khi sai mật khẩu cổng thuế hoặc cổng bảo trì', true],
                ['Sắp hết hạn gói', 'Nhắc trước 7 ngày và 1 ngày', true],
                ['Bản tin sản phẩm', 'Tính năng mới, mẹo kế toán, ưu đãi', false],
              ].map(([t, d, on]) => (
                <Group key={t as string} justify="space-between" wrap="nowrap">
                  <Box><Text fw={700}>{t}</Text><Text fz="sm" c="dimmed">{d}</Text></Box>
                  <Group gap="lg" wrap="nowrap"><Switch label="Email" defaultChecked={on as boolean} /><Switch label="Zalo" defaultChecked={false} /></Group>
                </Group>
              ))}
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
