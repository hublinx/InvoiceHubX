'use client';

import { BarChart } from '@mantine/charts';
import {
  Badge, Box, Button, Card, Chip, Grid, Group, Paper, Progress, Radio, SegmentedControl, Stack, Switch, Table, Text, ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconCloud, IconDeviceDesktop, IconRefresh, IconX, IconClock } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/AppFrame';
import { SYNC_LOG } from '@/lib/data';
import { timeVN } from '@/lib/format';
import { useStore } from '@/lib/store';

const HOURS = ['06:00', '08:00', '12:00', '17:00', '20:00', '23:00'];

export default function SyncPage() {
  const { companies, plan, syncNow, syncing } = useStore();
  const [progress, setProgress] = useState<Record<string, number>>({ c2: 46 });
  const [hours, setHours] = useState(['08:00', '20:00']);
  const [engine, setEngine] = useState(plan.id === 'plus' ? 'cloud' : 'desktop');
  const [scope, setScope] = useState('both');

  useEffect(() => {
    const t = setInterval(() => setProgress((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v >= 100 ? 12 : v + 3]))), 600);
    return () => clearInterval(t);
  }, []);

  const weekly = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => ({ day: d, 'Mới': [24, 31, 18, 40, 52, 12, 6][i]!, 'Cập nhật': [3, 5, 2, 6, 4, 1, 0][i]! }));

  return (
    <>
      <PageHeader
        eyebrow="Tự động hoá"
        title="Trung tâm đồng bộ"
        subtitle="Theo dõi tiến trình tải hoá đơn từ cổng của Tổng cục Thuế, đặt lịch và chọn nơi chạy đồng bộ."
        right={<Button size="md" className="volt-btn" onClick={syncNow} leftSection={<IconRefresh size={18} className={syncing ? 'spin' : undefined} />}>Đồng bộ tất cả</Button>}
      />
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card className="glass" p="lg" h="100%">
            <Text fw={800} fz="lg" mb="md">Trạng thái theo doanh nghiệp</Text>
            <Stack>
              {companies.map((c) => {
                const p = c.status === 'syncing' ? progress[c.id] ?? 30 : c.status === 'error' ? 100 : 100;
                return (
                  <Paper key={c.id} withBorder p="md" radius="lg">
                    <Group justify="space-between" mb={8}>
                      <Group gap="sm">
                        <ThemeIcon radius="xl" variant="light" color={c.status === 'error' ? 'red' : c.status === 'syncing' ? 'iris' : 'teal'}>
                          {c.status === 'error' ? <IconX size={16} /> : c.status === 'syncing' ? <IconRefresh size={16} className="spin" /> : <IconCheck size={16} />}
                        </ThemeIcon>
                        <Box><Text fw={700} fz="sm">{c.shortName}</Text><Text fz="xs" c="dimmed" className="mono">{c.taxCode}</Text></Box>
                      </Group>
                      <Text fz="xs" c="dimmed">{c.status === 'syncing' ? `${p}% · trang ${Math.ceil(p / 10)}/10` : c.status === 'error' ? 'Lỗi xác thực' : `Xong · ${timeVN(c.lastSync)}`}</Text>
                    </Group>
                    <Progress value={p} color={c.status === 'error' ? 'red' : c.status === 'syncing' ? 'iris' : 'teal'} animated={c.status === 'syncing'} striped={c.status === 'syncing'} radius="xl" />
                  </Paper>
                );
              })}
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Card className="glass" p="lg" h="100%">
            <Text fw={800} fz="lg">Hoá đơn tải về 7 ngày qua</Text>
            <Text fz="sm" c="dimmed" mb="md">Tất cả doanh nghiệp</Text>
            <BarChart h={240} data={weekly} dataKey="day" type="stacked" series={[{ name: 'Mới', color: 'iris.4' }, { name: 'Cập nhật', color: 'volt.6' }]} barProps={{ radius: [6, 6, 0, 0] }} gridAxis="none" />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Card className="glass" p="lg" h="100%">
            <Text fw={800} fz="lg" mb="md">Cấu hình đồng bộ</Text>
            <Text fz="sm" fw={600} mb={8}>Nơi chạy</Text>
            <Radio.Group value={engine} onChange={(v) => { if (v === 'cloud' && plan.id !== 'plus') { notifications.show({ color: 'yellow', title: 'Cần gói Cloud+', message: 'Đồng bộ trên Cloud chỉ có ở gói Cloud+.' }); return; } setEngine(v); }}>
              <Stack gap="xs">
                {[
                  { v: 'desktop', icon: IconDeviceDesktop, t: 'Ứng dụng máy tính', d: 'Cần mở máy & ứng dụng khi tới giờ' },
                  { v: 'cloud', icon: IconCloud, t: 'Cloud 24/7', d: 'Không cần treo máy · gói Cloud+' },
                ].map((o) => (
                  <Radio.Card key={o.v} value={o.v} p="md" radius="lg" withBorder>
                    <Group wrap="nowrap">
                      <Radio.Indicator />
                      <ThemeIcon variant="light" radius="md"><o.icon size={18} /></ThemeIcon>
                      <Box><Text fw={700} fz="sm">{o.t}</Text><Text fz="xs" c="dimmed">{o.d}</Text></Box>
                      {o.v === 'cloud' && plan.id !== 'plus' && <Badge ml="auto" color="volt" variant="filled" c="dark.9">Cloud+</Badge>}
                    </Group>
                  </Radio.Card>
                ))}
              </Stack>
            </Radio.Group>
            <Text fz="sm" fw={600} mt="lg" mb={8}><IconClock size={14} style={{ verticalAlign: -2 }} /> Khung giờ tự động</Text>
            <Chip.Group multiple value={hours} onChange={setHours}>
              <Group gap="xs">{HOURS.map((h) => <Chip key={h} value={h} variant="light" radius="md">{h}</Chip>)}</Group>
            </Chip.Group>
            <Text fz="sm" fw={600} mt="lg" mb={8}>Phạm vi</Text>
            <SegmentedControl fullWidth radius="xl" value={scope} onChange={setScope} data={[{ value: 'both', label: 'Vào + Ra' }, { value: 'in', label: 'Chỉ đầu vào' }, { value: 'out', label: 'Chỉ đầu ra' }]} />
            <Stack mt="lg" gap="sm">
              <Switch defaultChecked label="Tự tải bản gốc XML/PDF" />
              <Switch defaultChecked label="Kiểm tra MST rủi ro sau mỗi lần đồng bộ" />
              <Switch label="Gửi tóm tắt qua email lúc 21:00" />
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card className="glass" p={0} h="100%">
            <Text fw={800} fz="lg" p="lg" pb="sm">Nhật ký đồng bộ</Text>
            <Table.ScrollContainer minWidth={560}>
              <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
                <Table.Thead><Table.Tr><Table.Th>Thời gian</Table.Th><Table.Th>Doanh nghiệp</Table.Th><Table.Th>Kết quả</Table.Th><Table.Th ta="right">Thời lượng</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {SYNC_LOG.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td><Text fz="sm" className="tnum">{timeVN(s.at)}</Text></Table.Td>
                      <Table.Td><Text fz="sm" fw={600}>{s.company}</Text></Table.Td>
                      <Table.Td>
                        {s.status === 'ok' && <Badge color="teal" variant="light">+{s.added} mới · {s.updated} sửa</Badge>}
                        {s.status === 'running' && <Badge color="iris" variant="light">Đang chạy</Badge>}
                        {s.status === 'error' && <Badge color="red" variant="light">{s.message}</Badge>}
                      </Table.Td>
                      <Table.Td ta="right" className="tnum">{s.duration}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
        </Grid.Col>
      </Grid>
    </>
  );
}
