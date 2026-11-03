'use client';

import { AreaChart, DonutChart, Sparkline } from '@mantine/charts';
import {
  Alert, Avatar, Badge, Box, Button, Card, Grid, Group, Progress, RingProgress, SegmentedControl, SimpleGrid,
  Stack, Text, ThemeIcon, Timeline,
} from '@mantine/core';
import {
  IconAlertTriangle, IconArrowDownLeft, IconArrowUpRight, IconCheck, IconDownload, IconFileInvoice,
  IconReceiptTax, IconRefresh, IconShieldExclamation, IconSparkles, IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/AppFrame';
import { monthlySeries, STATUS_META, SYNC_LOG } from '@/lib/data';
import { compact, dateVN, initials, timeVN, vnd } from '@/lib/format';
import { useStore } from '@/lib/store';

function Kpi({ label, value, delta, icon: Icon, color, spark }: { label: string; value: string; delta: number; icon: typeof IconFileInvoice; color: string; spark: number[] }) {
  const up = delta >= 0;
  return (
    <Card className="glass lift" p="lg">
      <Group justify="space-between" align="flex-start">
        <ThemeIcon size={42} radius="md" variant="light" color={color}><Icon size={22} /></ThemeIcon>
        <Badge color={up ? 'teal' : 'red'} leftSection={up ? <IconArrowUpRight size={12} /> : <IconArrowDownLeft size={12} />}>
          {Math.abs(delta)}%
        </Badge>
      </Group>
      <Text c="dimmed" fz="sm" mt="md">{label}</Text>
      <Text fz={26} fw={500} lts={-0.5} className="tnum">{value}</Text>
      <Sparkline h={40} mt={6} data={spark} curveType="natural" color={color} fillOpacity={0.4} strokeWidth={2} />
    </Card>
  );
}

export default function Dashboard() {
  const { invoices, active, syncNow, syncing, user } = useStore();
  const [range, setRange] = useState('10');

  const stats = useMemo(() => {
    const live = invoices.filter((i) => i.status !== 'cancelled');
    const ins = live.filter((i) => i.direction === 'in');
    const outs = live.filter((i) => i.direction === 'out');
    const sum = (a: typeof live, k: 'total' | 'vat') => a.reduce((s, i) => s + i[k], 0);
    const byStatus = Object.entries(STATUS_META).map(([k, m]) => ({
      name: m.label,
      value: invoices.filter((i) => i.status === k).length,
      color: `${m.color}.5`,
    }));
    const suppliers = new Map<string, number>();
    ins.forEach((i) => suppliers.set(i.partnerName, (suppliers.get(i.partnerName) ?? 0) + i.total));
    const top = [...suppliers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      inTotal: sum(ins, 'total'), outTotal: sum(outs, 'total'), vatIn: sum(ins, 'vat'), vatOut: sum(outs, 'vat'),
      risky: invoices.filter((i) => i.risk !== 'none'), byStatus, top, missing: invoices.filter((i) => !i.hasOriginal).length,
    };
  }, [invoices]);

  const series = useMemo(() => monthlySeries(invoices).slice(-Number(range)), [invoices, range]);
  const spark = (k: 'Đầu vào' | 'Đầu ra') => series.map((s) => s[k]);
  const topMax = stats.top[0]?.[1] ?? 1;
  const vatNet = stats.vatOut - stats.vatIn;

  return (
    <>
      <PageHeader
        eyebrow={`Chào buổi sáng, ${user.name.split(' ').pop()} 👋`}
        title={<>Bức tranh hoá đơn của <span className="gradient-text">{active.shortName}</span></>}
        subtitle={`MST ${active.taxCode} · Lần đồng bộ cuối ${timeVN(active.lastSync)}`}
        right={
          <Group>
            <Button variant="default" leftSection={<IconDownload size={16} />} component={Link} href="/app/invoices">Xuất báo cáo</Button>
            <Button className="volt-btn" leftSection={<IconRefresh size={16} className={syncing ? 'spin' : undefined} />} onClick={syncNow} loading={false}>
              {syncing ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
            </Button>
          </Group>
        }
      />

      {stats.risky.some((r) => r.risk === 'high') && (
        <Alert
          mb="lg" radius="lg" color="orange" variant="light" icon={<IconShieldExclamation />}
          title={`${stats.risky.filter((r) => r.risk === 'high').length} hoá đơn đầu vào từ nhà cung cấp có rủi ro cao`}
        >
          Một số MST bán hàng đang trong danh sách cảnh báo / ngừng hoạt động. Kiểm tra trước khi kê khai khấu trừ thuế.{' '}
          <Text component={Link} href="/app/invoices?risk=1" c="orange.8" fw={500} fz="sm">Xem ngay →</Text>
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md" mb="md">
        <Kpi label="Tổng tiền đầu vào" value={compact(stats.inTotal)} delta={12} icon={IconArrowDownLeft} color="iris" spark={spark('Đầu vào')} />
        <Kpi label="Tổng tiền đầu ra" value={compact(stats.outTotal)} delta={8} icon={IconArrowUpRight} color="teal" spark={spark('Đầu ra')} />
        <Kpi label="VAT được khấu trừ" value={compact(stats.vatIn)} delta={-3} icon={IconReceiptTax} color="yellow" spark={spark('Đầu vào').map((v) => v * 0.09)} />
        <Kpi label="Hoá đơn trong kỳ" value={String(invoices.length)} delta={21} icon={IconFileInvoice} color="cyan" spark={series.map((s) => s['Đầu vào'] + s['Đầu ra'])} />
      </SimpleGrid>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card className="glass" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Box>
                <Text fw={500} fz="lg">Dòng tiền hoá đơn</Text>
                <Text fz="sm" c="dimmed">Triệu đồng · không tính hoá đơn đã huỷ</Text>
              </Box>
              <SegmentedControl size="xs" radius="xl" value={range} onChange={setRange} data={[{ label: '3T', value: '3' }, { label: '6T', value: '6' }, { label: '10T', value: '10' }]} />
            </Group>
            <AreaChart
              h={300}
              data={series}
              dataKey="month"
              curveType="monotone"
              withGradient
              fillOpacity={0.35}
              gridAxis="y"
              strokeDasharray="4 6"
              valueFormatter={(v) => `${new Intl.NumberFormat('vi-VN').format(v)} tr`}
              series={[{ name: 'Đầu vào', color: 'iris.4' }, { name: 'Đầu ra', color: 'volt.6' }]}
              withLegend
              legendProps={{ verticalAlign: 'top', height: 40 }}
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card className="glass" p="lg" h="100%">
            <Text fw={500} fz="lg">Trạng thái hoá đơn</Text>
            <Text fz="sm" c="dimmed" mb="md">{invoices.length} hoá đơn đã đồng bộ</Text>
            <Group justify="center">
              <DonutChart data={stats.byStatus} size={180} thickness={22} paddingAngle={3} chartLabel={`${Math.round((stats.byStatus[0]!.value / invoices.length) * 100)}% hợp lệ`} />
            </Group>
            <Stack gap={8} mt="lg">
              {stats.byStatus.map((s) => (
                <Group key={s.name} justify="space-between">
                  <Group gap={8}><Box w={10} h={10} style={{ borderRadius: 3, background: `var(--mantine-color-${s.color.replace('.', '-')})` }} /><Text fz="sm">{s.name}</Text></Group>
                  <Text fz="sm" fw={500} className="tnum">{s.value}</Text>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Card className="glass" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Text fw={500} fz="lg">Thuế GTGT tạm tính</Text>
              <Badge color={vatNet > 0 ? 'orange' : 'teal'}>{vatNet > 0 ? 'Phải nộp' : 'Còn khấu trừ'}</Badge>
            </Group>
            <Group align="center" wrap="nowrap">
              <RingProgress
                size={130} thickness={14} roundCaps
                sections={[
                  { value: (stats.vatOut / (stats.vatIn + stats.vatOut)) * 100, color: 'volt.6' },
                  { value: (stats.vatIn / (stats.vatIn + stats.vatOut)) * 100, color: 'iris.4' },
                ]}
                label={<Text ta="center" fz="xs" c="dimmed">Chênh lệch<br /><Text span fw={500} fz="sm" c="var(--mantine-color-text)">{compact(Math.abs(vatNet))}</Text></Text>}
              />
              <Stack gap="sm" style={{ flex: 1 }}>
                <Box><Text fz="xs" c="dimmed">VAT đầu ra</Text><Text fw={500} className="tnum">{vnd(stats.vatOut)}</Text></Box>
                <Box><Text fz="xs" c="dimmed">VAT đầu vào</Text><Text fw={500} className="tnum">{vnd(stats.vatIn)}</Text></Box>
              </Stack>
            </Group>
            <Text fz="xs" c="dimmed" mt="md">Số liệu tham khảo, chưa thay thế tờ khai 01/GTGT.</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Card className="glass" p="lg" h="100%">
            <Text fw={500} fz="lg" mb="md">Nhà cung cấp lớn nhất</Text>
            <Stack gap="md">
              {stats.top.map(([name, total], idx) => (
                <Box key={name}>
                  <Group justify="space-between" wrap="nowrap" mb={4}>
                    <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                      <Avatar size={26} radius="md" color={['iris', 'teal', 'grape', 'cyan', 'yellow'][idx]}>{initials(name)}</Avatar>
                      <Text fz="sm" truncate>{name.replace(/^Công ty (CP|TNHH|Cổ phần)\s*/i, '')}</Text>
                    </Group>
                    <Text fz="sm" fw={500} className="tnum">{compact(total)}</Text>
                  </Group>
                  <Progress value={(total / topMax) * 100} size={6} radius="xl" color={['iris', 'teal', 'grape', 'cyan', 'yellow'][idx]} />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card className="glass" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Text fw={500} fz="lg">Hoạt động đồng bộ</Text>
              <Button component={Link} href="/app/sync" variant="subtle" size="compact-sm">Tất cả</Button>
            </Group>
            <Timeline bulletSize={26} lineWidth={2} active={10}>
              {SYNC_LOG.slice(0, 4).map((s) => (
                <Timeline.Item
                  key={s.id}
                  color={s.status === 'ok' ? 'teal' : s.status === 'error' ? 'red' : 'iris'}
                  bullet={s.status === 'ok' ? <IconCheck size={14} /> : s.status === 'error' ? <IconX size={14} /> : <IconRefresh size={14} className="spin" />}
                  title={<Text fz="sm" fw={500}>{s.company}</Text>}
                >
                  <Text fz="xs" c="dimmed">
                    {s.status === 'error' ? s.message : s.status === 'running' ? 'Đang tải hoá đơn…' : `+${s.added} mới · ${s.updated} cập nhật · ${s.duration}`}
                  </Text>
                  <Text fz={11} c="dimmed" mt={2}>{timeVN(s.at)}</Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card p="lg" style={{ background: 'linear-gradient(120deg, #1e3a8a 0%, #1d4ed8 50%, #172554 100%)', border: 0 }}>
            <Group justify="space-between" gap="lg">
              <Group gap="lg" wrap="nowrap">
                <ThemeIcon size={56} radius="xl" color="volt"  variant="filled"><IconSparkles size={28} /></ThemeIcon>
                <Box>
                  <Text fw={500} fz="xl" c="white">Còn {stats.missing} hoá đơn chưa tải bản gốc (XML/PDF)</Text>
                  <Text c="rgba(255,255,255,.75)" fz="sm">Tải hàng loạt một lần, lưu trữ 10 năm trên Cloud theo quy định Thông tư 78. Cập nhật {dateVN(new Date().toISOString())}.</Text>
                </Box>
              </Group>
              <Button size="md" variant="white" component={Link} href="/app/invoices" leftSection={<IconDownload size={18} />}>Tải hàng loạt</Button>
            </Group>
          </Card>
        </Grid.Col>

        {stats.risky.length > 0 && (
          <Grid.Col span={12}>
            <Card className="glass" p="lg">
              <Group mb="md" gap="xs"><IconAlertTriangle size={20} color="var(--mantine-color-orange-5)" /><Text fw={500} fz="lg">Cảnh báo rủi ro gần đây</Text></Group>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {stats.risky.slice(0, 6).map((r) => (
                  <Card key={r.id} p="md" radius="md" withBorder>
                    <Group justify="space-between" mb={4}>
                      <Text fz="xs" className="mono" c="dimmed">{r.symbol} · {r.number}</Text>
                      <Badge color={r.risk === 'high' ? 'red' : 'yellow'}>{r.risk === 'high' ? 'Rủi ro cao' : 'Cần xem'}</Badge>
                    </Group>
                    <Text fz="sm" fw={500} lineClamp={2} lh={1.4}>{r.partnerName}</Text>
                    <Group justify="space-between" mt={6}>
                      <Text fz="xs" c="dimmed">{dateVN(r.issuedAt)}</Text>
                      <Text fz="sm" fw={500} className="tnum">{vnd(r.total)}</Text>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
            </Card>
          </Grid.Col>
        )}
      </Grid>
    </>
  );
}
