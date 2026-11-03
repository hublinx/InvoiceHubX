'use client';

import {
  ActionIcon, Alert, Badge, Box, Button, CopyButton, Divider, Grid, Group, NumberInput, Paper, ScrollArea,
  SegmentedControl, Select, SimpleGrid, Stack, Table, Text, TextInput, ThemeIcon, Tooltip, UnstyledButton,
} from '@mantine/core';
import {
  IconAlertTriangle, IconCalendarDue, IconCheck, IconCopy, IconFileCheck, IconInfoCircle,
  IconLetterCase, IconReceiptTax, IconSearch, IconUserDollar,
} from '@tabler/icons-react';
import { useMemo, useState, type ReactNode } from 'react';
import { PageHeader, SectionCard } from '@/components/AppFrame';
import { calcPit, numberToWords, TAX_CONFIG, upcomingDeadlines, vatFromGross, vatFromNet } from '@/lib/accounting';
import { STATUS_META } from '@/lib/data';
import { dateVN, vnd } from '@/lib/format';
import { useStore } from '@/lib/store';

const money = { thousandSeparator: '.', decimalSeparator: ',', hideControls: true, allowNegative: false, suffix: ' ₫' } as const;

const TOOLS = [
  { id: 'vat', label: 'Tính thuế GTGT', desc: 'Tách / cộng VAT 0–10%', icon: IconReceiptTax },
  { id: 'words', label: 'Số tiền bằng chữ', desc: 'Đọc số ghi chứng từ', icon: IconLetterCase },
  { id: 'pit', label: 'Thuế TNCN từ lương', desc: 'Gross → Net, bảo hiểm', icon: IconUserDollar },
  { id: 'deadline', label: 'Lịch hạn nộp thuế', desc: 'Các mốc sắp tới', icon: IconCalendarDue },
  { id: 'review', label: 'Rà soát khấu trừ', desc: 'Hoá đơn đầu vào cần xem', icon: IconFileCheck },
] as const;
type ToolId = (typeof TOOLS)[number]['id'];

/** Một dòng kết quả: nhãn trái – giá trị phải, có nút sao chép */
function ResultRow({ label, value, raw, strong }: { label: ReactNode; value: string; raw?: string | number; strong?: boolean }) {
  return (
    <Group justify="space-between" wrap="nowrap" py={10} style={{ borderBottom: '1px dashed var(--ihx-border)' }}>
      <Text fz="sm" c={strong ? undefined : 'dimmed'} fw={strong ? 700 : 400}>{label}</Text>
      <Group gap={6} wrap="nowrap">
        <Text fz={strong ? 'lg' : 'sm'} fw={strong ? 800 : 600} className="tnum">{value}</Text>
        <CopyButton value={String(raw ?? value)}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Đã chép' : 'Sao chép'}>
              <ActionIcon size="sm" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy} aria-label="Sao chép">
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </Group>
  );
}

function WordsBox({ amount }: { amount: number }) {
  const w = numberToWords(amount);
  return (
    <Paper p="md" radius="md" bg="var(--mantine-color-iris-light)">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Box>
          <Text fz="xs" c="dimmed" fw={500} mb={2}>Bằng chữ</Text>
          <Text fw={500} fs="italic">{w}.</Text>
        </Box>
        <CopyButton value={w + '.'}>
          {({ copied, copy }) => <Button size="compact-xs" variant="light" onClick={copy}>{copied ? 'Đã chép' : 'Chép'}</Button>}
        </CopyButton>
      </Group>
    </Paper>
  );
}

function VatTool() {
  const [mode, setMode] = useState<'net' | 'gross'>('net');
  const [amount, setAmount] = useState<number>(10_000_000);
  const [rate, setRate] = useState('10');
  const r = mode === 'net' ? vatFromNet(amount, Number(rate)) : vatFromGross(amount, Number(rate));
  return (
    <SectionCard title="Tính thuế GTGT" description="Cộng thuế vào giá chưa thuế, hoặc tách thuế ra khỏi tổng thanh toán.">
      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Box>
              <Text fz="sm" fw={500} mb={6}>Số tiền nhập vào là</Text>
              <SegmentedControl fullWidth value={mode} onChange={(v) => setMode(v as 'net' | 'gross')} data={[{ value: 'net', label: 'Giá chưa thuế' }, { value: 'gross', label: 'Tổng đã gồm thuế' }]} />
            </Box>
            <NumberInput label="Số tiền" value={amount} onChange={(v) => setAmount(Number(v) || 0)} {...money} />
            <Box>
              <Text fz="sm" fw={500} mb={6}>Thuế suất</Text>
              <SegmentedControl fullWidth value={rate} onChange={setRate} data={['0', '5', '8', '10'].map((v) => ({ value: v, label: `${v}%` }))} />
            </Box>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Box>
              <ResultRow label="Giá chưa thuế" value={vnd(r.net)} raw={r.net} />
              <ResultRow label={`Tiền thuế GTGT (${rate}%)`} value={vnd(r.vat)} raw={r.vat} />
              <ResultRow label="Tổng thanh toán" value={vnd(r.gross)} raw={r.gross} strong />
            </Box>
            <WordsBox amount={r.gross} />
          </Stack>
        </Grid.Col>
      </Grid>
    </SectionCard>
  );
}

function WordsTool() {
  const [amount, setAmount] = useState<number>(1_250_015);
  return (
    <SectionCard title="Đọc số tiền bằng chữ" description="Dùng để ghi dòng “Số tiền viết bằng chữ” trên phiếu thu, phiếu chi, hoá đơn.">
      <Stack gap="md">
        <NumberInput label="Số tiền" value={amount} onChange={(v) => setAmount(Number(v) || 0)} {...money} />
        <WordsBox amount={amount} />
        <Group gap="xs">
          {[45_000, 1_000_000, 20_500_000, 123_456_789, 1_000_000_000].map((v) => (
            <Button key={v} size="compact-sm" variant="default" onClick={() => setAmount(v)}>{v.toLocaleString('vi-VN')}</Button>
          ))}
        </Group>
      </Stack>
    </SectionCard>
  );
}

function PitTool() {
  const [gross, setGross] = useState<number>(30_000_000);
  const [deps, setDeps] = useState<number>(1);
  const [insBase, setInsBase] = useState<number | ''>('');
  const [region, setRegion] = useState('I');
  const r = calcPit(gross, deps, insBase === '' ? undefined : insBase, region);
  const pct = (n: number) => `${(n * 100).toLocaleString('vi-VN')}%`;
  return (
    <SectionCard title="Thuế TNCN từ tiền lương" description="Tính lương thực nhận (Net) từ lương Gross cho nhân viên ký HĐLĐ từ 3 tháng.">
      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="md">
            <NumberInput label="Lương Gross / tháng" value={gross} onChange={(v) => setGross(Number(v) || 0)} {...money} />
            <SimpleGrid cols={2}>
              <NumberInput label="Người phụ thuộc" value={deps} onChange={(v) => setDeps(Number(v) || 0)} min={0} max={10} allowNegative={false} />
              <Select label="Vùng lương" value={region} onChange={(v) => setRegion(v ?? 'I')} data={['I', 'II', 'III', 'IV'].map((v) => ({ value: v, label: `Vùng ${v}` }))} allowDeselect={false} />
            </SimpleGrid>
            <NumberInput label="Lương đóng bảo hiểm" description="Bỏ trống nếu bằng lương Gross" placeholder="= Lương Gross" value={insBase} onChange={(v) => setInsBase(v === '' ? '' : Number(v))} {...money} />
            <Alert variant="light" color="gray" icon={<IconInfoCircle size={18} />} p="sm">
              <Text fz="xs">
                Giảm trừ bản thân {vnd(TAX_CONFIG.selfDeduction)}, người phụ thuộc {vnd(TAX_CONFIG.dependentDeduction)}/người.
                Bảo hiểm NLĐ: BHXH 8%, BHYT 1,5%, BHTN 1%. Biểu thuế luỹ tiến 7 bậc. Số liệu tham khảo — đối chiếu văn bản hiện hành.
              </Text>
            </Alert>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <SimpleGrid cols={3} mb="md">
            {[
              { l: 'Gross', v: r.gross, c: undefined },
              { l: 'Thuế TNCN', v: r.tax, c: 'red.7' },
              { l: 'Net thực nhận', v: r.net, c: 'teal.7' },
            ].map((x) => (
              <Paper key={x.l} withBorder p="sm" radius="md">
                <Text fz="xs" c="dimmed">{x.l}</Text>
                <Text fw={500} c={x.c} className="tnum" fz="md">{x.v.toLocaleString('vi-VN')}</Text>
              </Paper>
            ))}
          </SimpleGrid>
          <ResultRow label="BHXH (8%)" value={vnd(r.bhxh)} raw={r.bhxh} />
          <ResultRow label="BHYT (1,5%)" value={vnd(r.bhyt)} raw={r.bhyt} />
          <ResultRow label="BHTN (1%)" value={vnd(r.bhtn)} raw={r.bhtn} />
          <ResultRow label={`Giảm trừ gia cảnh (${deps} NPT)`} value={vnd(r.deduction)} raw={r.deduction} />
          <ResultRow label="Thu nhập tính thuế" value={vnd(r.taxable)} raw={r.taxable} strong />
          <Table mt="md" fz="sm" withTableBorder verticalSpacing={6}>
            <Table.Thead><Table.Tr><Table.Th>Bậc</Table.Th><Table.Th>Phần thu nhập</Table.Th><Table.Th ta="right">Thuế suất</Table.Th><Table.Th ta="right">Tiền thuế</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {r.rows.filter((x) => x.amount > 0).map((x) => (
                <Table.Tr key={x.level}>
                  <Table.Td>{x.level}</Table.Td>
                  <Table.Td className="tnum">{x.amount.toLocaleString('vi-VN')}</Table.Td>
                  <Table.Td ta="right">{pct(x.rate)}</Table.Td>
                  <Table.Td ta="right" className="tnum" fw={500}>{x.tax.toLocaleString('vi-VN')}</Table.Td>
                </Table.Tr>
              ))}
              {r.taxable === 0 && <Table.Tr><Table.Td colSpan={4}><Text fz="sm" c="dimmed" ta="center">Không phát sinh thuế TNCN</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Grid.Col>
      </Grid>
    </SectionCard>
  );
}

const KIND_COLOR = { GTGT: 'iris', TNCN: 'grape', TNDN: 'cyan', Khác: 'gray' } as const;

function DeadlineTool() {
  const list = useMemo(() => upcomingDeadlines(), []);
  const today = new Date('2026-11-03').getTime();
  return (
    <SectionCard title="Lịch hạn nộp thuế" description="Các mốc kê khai & nộp thuế sắp tới. Hạn rơi vào ngày nghỉ được lùi sang ngày làm việc kế tiếp." noPadding>
      <Table.ScrollContainer minWidth={560}>
        <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
          <Table.Thead><Table.Tr><Table.Th w={130}>Hạn chót</Table.Th><Table.Th>Nội dung</Table.Th><Table.Th w={90}>Loại</Table.Th><Table.Th w={110} ta="right">Còn lại</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>
            {list.map((d, i) => {
              const days = Math.ceil((new Date(d.date).getTime() - today) / 86400000);
              return (
                <Table.Tr key={i}>
                  <Table.Td className="tnum" fw={500}>{dateVN(d.date)}</Table.Td>
                  <Table.Td><Text fz="sm" fw={500}>{d.title}</Text><Text fz="xs" c="dimmed">{d.detail}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color={KIND_COLOR[d.kind]}>{d.kind}</Badge></Table.Td>
                  <Table.Td ta="right"><Badge variant={days <= 7 ? 'filled' : 'light'} color={days <= 7 ? 'red' : days <= 30 ? 'yellow' : 'gray'}>{days} ngày</Badge></Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </SectionCard>
  );
}

function ReviewTool() {
  const { invoices, active } = useStore();
  const issues = useMemo(() => invoices
    .filter((i) => i.direction === 'in')
    .map((i) => {
      const reasons: { text: string; color: string }[] = [];
      if (i.total >= TAX_CONFIG.nonCashThreshold && !i.paid) reasons.push({ text: `Từ ${TAX_CONFIG.nonCashThreshold / 1e6} triệu, chưa TT qua ngân hàng`, color: 'orange' });
      if (i.risk === 'high') reasons.push({ text: 'MST bán ngừng hoạt động', color: 'red' });
      if (i.risk === 'low') reasons.push({ text: 'MST bán tạm ngừng KD', color: 'yellow' });
      if (i.status === 'cancelled') reasons.push({ text: 'Hoá đơn đã huỷ', color: 'gray' });
      if (!i.hasOriginal) reasons.push({ text: 'Chưa lưu bản gốc XML', color: 'iris' });
      return { inv: i, reasons };
    })
    .filter((x) => x.reasons.length > 0), [invoices]);
  const vatAtRisk = issues.filter((x) => x.reasons.some((r) => r.color !== 'iris')).reduce((s, x) => s + x.inv.vat, 0);

  return (
    <SectionCard title="Rà soát điều kiện khấu trừ" description={`Hoá đơn đầu vào của ${active.shortName} có thể bị loại khi khấu trừ thuế GTGT.`} noPadding>
      <SimpleGrid cols={{ base: 1, sm: 3 }} px={20} pb={16} spacing="sm">
        <Paper withBorder p="sm" radius="md"><Text fz="xs" c="dimmed">Hoá đơn cần xem</Text><Text fw={500} fz="lg">{issues.length}</Text></Paper>
        <Paper withBorder p="sm" radius="md"><Text fz="xs" c="dimmed">VAT có nguy cơ bị loại</Text><Text fw={500} fz="lg" c="red.7" className="tnum">{vnd(vatAtRisk)}</Text></Paper>
        <Paper withBorder p="sm" radius="md"><Text fz="xs" c="dimmed">Ngưỡng chứng từ không tiền mặt</Text><Text fw={500} fz="lg" className="tnum">{vnd(TAX_CONFIG.nonCashThreshold)}</Text></Paper>
      </SimpleGrid>
      <ScrollArea.Autosize mah={520}>
        <Table.ScrollContainer minWidth={720}>
          <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover stickyHeader>
            <Table.Thead><Table.Tr><Table.Th>Hoá đơn</Table.Th><Table.Th>Người bán</Table.Th><Table.Th ta="right">Tổng tiền</Table.Th><Table.Th ta="right">VAT</Table.Th><Table.Th w={260}>Vấn đề</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {issues.slice(0, 60).map(({ inv, reasons }) => (
                <Table.Tr key={inv.id}>
                  <Table.Td><Text fz="sm" fw={500} className="mono">{inv.number}</Text><Text fz="xs" c="dimmed">{dateVN(inv.issuedAt)} · <Badge size="xs" variant="dot" color={STATUS_META[inv.status].color}>{STATUS_META[inv.status].label}</Badge></Text></Table.Td>
                  <Table.Td maw={260}><Text fz="sm" lineClamp={2} lh={1.4}>{inv.partnerName}</Text><Text fz="xs" c="dimmed" className="mono">{inv.partnerTax}</Text></Table.Td>
                  <Table.Td ta="right" className="tnum" fw={500}>{inv.total.toLocaleString('vi-VN')}</Table.Td>
                  <Table.Td ta="right" className="tnum">{inv.vat.toLocaleString('vi-VN')}</Table.Td>
                  <Table.Td><Stack gap={4}>{reasons.map((r) => <Badge key={r.text} size="sm" variant="light" color={r.color} style={{ textTransform: 'none', fontWeight: 600 }}>{r.text}</Badge>)}</Stack></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </ScrollArea.Autosize>
    </SectionCard>
  );
}

export default function ToolsPage() {
  const [tool, setTool] = useState<ToolId>('vat');
  const Panel = { vat: VatTool, words: WordsTool, pit: PitTool, deadline: DeadlineTool, review: ReviewTool }[tool];

  return (
    <>
      <PageHeader eyebrow="Tiện ích" title="Công cụ kế toán" subtitle="Các phép tính và tra cứu hay dùng hằng ngày — kết quả bấm để sao chép." />
      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
          <Paper className="glass" withBorder radius="md" p={8} style={{ position: 'sticky', top: 84 }}>
            <Stack gap={4}>
              {TOOLS.map((t) => {
                const on = t.id === tool;
                return (
                  <UnstyledButton key={t.id} onClick={() => setTool(t.id)} p="sm" style={{ borderRadius: 8, background: on ? 'var(--mantine-color-iris-light)' : undefined }}>
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size={36} radius="md" variant={on ? 'filled' : 'light'} color="iris"><t.icon size={18} /></ThemeIcon>
                      <Box style={{ minWidth: 0 }}>
                        <Text fz="sm" fw={500} c={on ? 'iris.8' : undefined}>{t.label}</Text>
                        <Text fz="xs" c="dimmed" truncate>{t.desc}</Text>
                      </Box>
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
          <Panel />
        </Grid.Col>
      </Grid>
    </>
  );
}

