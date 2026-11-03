'use client';

import {
  ActionIcon, Affix, Badge, Box, Button, Checkbox, Collapse, Group, Input, UnstyledButton, Menu, MultiSelect, NumberInput, Pagination,
  Paper, Pill, SegmentedControl, Select, SimpleGrid, Table, Text, TextInput, Tooltip, Transition,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAdjustmentsHorizontal, IconAlertTriangle, IconArrowsSort, IconCalendar, IconChevronDown, IconCloudCheck,
  IconCloudOff, IconDots, IconDownload, IconEye, IconFileSpreadsheet, IconSearch, IconSortAscending,
  IconSortDescending, IconTag, IconX,
} from '@tabler/icons-react';
import 'dayjs/locale/vi';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/AppFrame';
import { InvoiceDrawer } from '@/components/InvoiceDrawer';
import { STATUS_META, type Invoice } from '@/lib/data';
import { dateVN, vnd } from '@/lib/format';
import { useStore } from '@/lib/store';

const PAGE_SIZES = ['10', '20', '50'];
type SortKey = 'issuedAt' | 'total' | 'partnerName' | 'vat';

type Filters = {
  statuses: string[];
  dates: [string | null, string | null];
  vatRates: string[];
  minTotal: number | '';
  maxTotal: number | '';
  partners: string[];
  paid: string | null;
  original: string | null;
  risk: string | null;
  tags: string[];
};
const EMPTY: Filters = { statuses: [], dates: [null, null], vatRates: [], minTotal: '', maxTotal: '', partners: [], paid: null, original: null, risk: null, tags: [] };

function exportCsv(rows: Invoice[], name: string) {
  const head = ['Ký hiệu', 'Số HĐ', 'Ngày lập', 'Loại', 'Đối tác', 'MST', 'Tiền hàng', 'Chiết khấu', 'VAT%', 'Tiền thuế', 'Tổng thanh toán', 'Trạng thái', 'Thanh toán'];
  const lines = rows.map((r) => [r.symbol, r.number, dateVN(r.issuedAt), r.direction === 'in' ? 'Vào' : 'Ra', `"${r.partnerName}"`, r.partnerTax, r.preTax, r.discount, r.vatRate, r.vat, r.total, STATUS_META[r.status].label, r.paid ? 'Đã TT' : 'Chưa TT'].join(','));
  const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

/** Một ô số liệu trong dải thống kê */
function Stat({ label, value, sub, color }: { label: string; value: ReactNode; sub?: ReactNode; color?: string }) {
  return (
    <Box px={{ base: 'md', sm: 'lg' }} py={16} className="stat-cell">
      <Text fz="xs" c="dimmed" fw={500} truncate>{label}</Text>
      <Text fz={{ base: 15, sm: 17 }} fw={500} className="tnum" c={color} mt={4} truncate>{value}</Text>
      {sub && <Text fz="xs" c="dimmed" mt={2} truncate>{sub}</Text>}
    </Box>
  );
}

function InvoicesInner() {
  const params = useSearchParams();
  const { invoices, active } = useStore();
  const [direction, setDirection] = useState<'all' | 'in' | 'out'>('all');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [dq] = useDebouncedValue(q, 200);
  const [f, setF] = useState<Filters>({ ...EMPTY, risk: params.get('risk') === '1' ? 'risky' : null });
  const [advOpen, setAdvOpen] = useState(params.get('risk') === '1');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'issuedAt', dir: -1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('20');
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState<Invoice | null>(null);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => { setSelected([]); setPage(1); setF(EMPTY); }, [active.id]);

  const partnerOptions = useMemo(() => {
    const m = new Map<string, string>();
    invoices.forEach((i) => m.set(i.partnerTax, i.partnerName));
    return [...m.entries()].map(([value, label]) => ({ value, label: `${label} · ${value}` }));
  }, [invoices]);
  const tagOptions = useMemo(() => [...new Set(invoices.flatMap((i) => i.tags))], [invoices]);

  const filtered = useMemo(() => {
    const term = dq.trim().toLowerCase();
    const from = f.dates[0] ? new Date(f.dates[0]).getTime() : -Infinity;
    const to = f.dates[1] ? new Date(f.dates[1]).getTime() + 86400000 : Infinity;
    const rows = invoices.filter((i) => {
      if (direction !== 'all' && i.direction !== direction) return false;
      if (f.statuses.length && !f.statuses.includes(i.status)) return false;
      if (f.vatRates.length && !f.vatRates.includes(String(i.vatRate))) return false;
      if (f.minTotal !== '' && i.total < f.minTotal) return false;
      if (f.maxTotal !== '' && i.total > f.maxTotal) return false;
      if (f.partners.length && !f.partners.includes(i.partnerTax)) return false;
      if (f.paid && (f.paid === 'paid') !== i.paid) return false;
      if (f.original && (f.original === 'yes') !== i.hasOriginal) return false;
      if (f.risk === 'risky' && i.risk === 'none') return false;
      if (f.risk === 'high' && i.risk !== 'high') return false;
      if (f.tags.length && !f.tags.some((t) => i.tags.includes(t))) return false;
      const t = new Date(i.issuedAt).getTime();
      if (t < from || t > to) return false;
      if (term && !`${i.number} ${i.symbol} ${i.partnerName} ${i.partnerTax}`.toLowerCase().includes(term)) return false;
      return true;
    });
    return rows.sort((a, b) => {
      const x = a[sort.key], y = b[sort.key];
      return (typeof x === 'number' ? x - (y as number) : String(x).localeCompare(String(y))) * sort.dir;
    });
  }, [invoices, direction, f, dq, sort]);

  useEffect(() => setPage(1), [direction, f, dq, pageSize]);

  const ps = Number(pageSize);
  const pageRows = filtered.slice((page - 1) * ps, page * ps);
  const totals = useMemo(() => {
    const live = filtered.filter((i) => i.status !== 'cancelled');
    return {
      count: filtered.length,
      inCount: filtered.filter((i) => i.direction === 'in').length,
      outCount: filtered.filter((i) => i.direction === 'out').length,
      pre: live.reduce((s, i) => s + i.preTax - i.discount, 0),
      vat: live.reduce((s, i) => s + i.vat, 0),
      total: live.reduce((s, i) => s + i.total, 0),
      risky: filtered.filter((i) => i.risk !== 'none').length,
      unpaid: live.filter((i) => !i.paid).reduce((s, i) => s + i.total, 0),
    };
  }, [filtered]);

  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));

  // Danh sách bộ lọc đang áp dụng → hiển thị dạng "pill" có nút xoá
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (f.statuses.length) chips.push({ key: 'st', label: `Trạng thái: ${f.statuses.map((s) => STATUS_META[s as keyof typeof STATUS_META].label).join(', ')}`, clear: () => set('statuses', []) });
  if (f.dates[0]) chips.push({ key: 'dt', label: `Ngày: ${dateVN(f.dates[0])}${f.dates[1] ? ' – ' + dateVN(f.dates[1]) : ''}`, clear: () => set('dates', [null, null]) });
  if (f.vatRates.length) chips.push({ key: 'vat', label: `VAT: ${f.vatRates.map((v) => v + '%').join(', ')}`, clear: () => set('vatRates', []) });
  if (f.minTotal !== '' || f.maxTotal !== '') chips.push({ key: 'amt', label: `Tổng tiền: ${f.minTotal !== '' ? f.minTotal.toLocaleString('vi-VN') : '0'} – ${f.maxTotal !== '' ? f.maxTotal.toLocaleString('vi-VN') : '∞'}`, clear: () => setF((s) => ({ ...s, minTotal: '', maxTotal: '' })) });
  if (f.partners.length) chips.push({ key: 'pt', label: `Đối tác: ${f.partners.length}`, clear: () => set('partners', []) });
  if (f.paid) chips.push({ key: 'paid', label: f.paid === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán', clear: () => set('paid', null) });
  if (f.original) chips.push({ key: 'org', label: f.original === 'yes' ? 'Có bản gốc' : 'Chưa có bản gốc', clear: () => set('original', null) });
  if (f.risk) chips.push({ key: 'risk', label: f.risk === 'high' ? 'MST rủi ro cao' : 'MST có rủi ro', clear: () => set('risk', null) });
  if (f.tags.length) chips.push({ key: 'tag', label: `Nhãn: ${f.tags.join(', ')}`, clear: () => set('tags', []) });
  const clearAll = () => { setF(EMPTY); setQ(''); };

  const Th = ({ k, children, right, w }: { k: SortKey; children: ReactNode; right?: boolean; w?: number }) => {
    const on = sort.key === k;
    const Icon = !on ? IconArrowsSort : sort.dir === 1 ? IconSortAscending : IconSortDescending;
    return (
      <Table.Th w={w} ta={right ? 'right' : undefined} onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (s.dir === 1 ? -1 : 1) : -1 }))} style={{ cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
        <Group gap={4} justify={right ? 'flex-end' : 'flex-start'} wrap="nowrap" c={on ? 'iris.7' : undefined}>{children}<Icon size={14} opacity={on ? 1 : 0.35} /></Group>
      </Table.Th>
    );
  };

  return (
    <>
      <PageHeader
        title="Hoá đơn điện tử"
        subtitle={<>{active.name} · <span className="mono">MST {active.taxCode}</span></>}
        right={<Button variant="default" leftSection={<IconFileSpreadsheet size={16} />} onClick={() => exportCsv(filtered, `hoa-don-${active.taxCode}.csv`)}>Xuất Excel</Button>}
      />

      <Paper className="glass" withBorder radius="md" style={{ overflow: 'hidden' }}>
        {/* Dải thống kê gọn — luôn tính theo bộ lọc hiện tại */}
        <SimpleGrid cols={{ base: 2, lg: 4 }} spacing={0} className="stat-strip" style={{ background: 'var(--mantine-color-body)' }}>
          <Stat label="Số hoá đơn" value={totals.count.toLocaleString('vi-VN')} sub={`${totals.inCount} đầu vào · ${totals.outCount} đầu ra${totals.risky ? ` · ${totals.risky} MST rủi ro` : ''}`} />
          <Stat label="Thuế GTGT" value={vnd(totals.vat)} sub={`Tiền hàng ${vnd(totals.pre)}`} />
          <Stat label="Tổng thanh toán" value={vnd(totals.total)} color="iris.8" sub="Không tính hoá đơn huỷ" />
          <Stat label="Chưa thanh toán" value={vnd(totals.unpaid)} color="orange.8" sub="Công nợ theo hoá đơn" />
        </SimpleGrid>

        {/* Thanh công cụ */}
        <Box px={{ base: 'md', sm: 'lg' }} py="md">
          <Group justify="space-between" gap="sm">
            <Group gap="sm" style={{ flex: 1 }} wrap="wrap">
              <SegmentedControl
                w={{ base: '100%', sm: 'auto' }}
                value={direction}
                onChange={(v) => setDirection(v as typeof direction)}
                data={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'in', label: 'Đầu vào' },
                  { value: 'out', label: 'Đầu ra' },
                ]}
              />
              <TextInput
                placeholder="Số HĐ, ký hiệu, tên hoặc MST đối tác"
                leftSection={<IconSearch size={16} />}
                rightSection={q ? <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setQ('')} aria-label="Xoá"><IconX size={14} /></ActionIcon> : null}
                value={q}
                onChange={(e) => setQ(e.currentTarget.value)}
                w={{ base: '100%', sm: 'auto' }}
                style={{ flex: 1, minWidth: 220, maxWidth: 420 }}
              />
              <DatePickerInput
                type="range" locale="vi" placeholder="Khoảng ngày lập" leftSection={<IconCalendar size={16} />}
                value={f.dates} onChange={(v) => set('dates', v as [string | null, string | null])} clearable valueFormat="DD/MM/YYYY" w={{ base: '100%', sm: 230 }}
              />
            </Group>
            <Button
              w={{ base: '100%', md: 'auto' }}
              variant={advOpen || chips.length ? 'light' : 'default'}
              leftSection={<IconAdjustmentsHorizontal size={16} />}
              rightSection={<IconChevronDown size={14} style={{ transform: advOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }} />}
              onClick={() => setAdvOpen((o) => !o)}
            >
              Lọc nâng cao{chips.length ? ` (${chips.length})` : ''}
            </Button>
          </Group>
        </Box>

        {/* Bộ lọc nâng cao — xổ ra */}
        <Collapse expanded={advOpen} transitionDuration={180}>
          <Box px={{ base: 'md', sm: 'lg' }} py="lg" style={{ borderTop: '1px solid var(--ihx-border)', background: 'var(--mantine-color-body)' }}>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" verticalSpacing="md">
              <MultiSelect label="Trạng thái hoá đơn" placeholder="Tất cả" data={Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label }))} value={f.statuses} onChange={(v) => set('statuses', v)} clearable />
              <MultiSelect label="Thuế suất" placeholder="Tất cả" data={['0', '5', '8', '10'].map((v) => ({ value: v, label: `${v}%` }))} value={f.vatRates} onChange={(v) => set('vatRates', v)} clearable />
              <MultiSelect label="Đối tác" placeholder="Tìm theo tên / MST" data={partnerOptions} value={f.partners} onChange={(v) => set('partners', v)} searchable clearable maxDropdownHeight={260} />
              <MultiSelect label="Nhãn" placeholder="Tất cả" data={tagOptions} value={f.tags} onChange={(v) => set('tags', v)} clearable />
              <Input.Wrapper label="Tổng thanh toán (đ)">
                <Group gap={6} wrap="nowrap">
                  <NumberInput placeholder="Từ" value={f.minTotal} onChange={(v) => set('minTotal', v === '' ? '' : Number(v))} thousandSeparator="." decimalSeparator="," hideControls allowNegative={false} />
                  <Text c="dimmed">–</Text>
                  <NumberInput placeholder="Đến" value={f.maxTotal} onChange={(v) => set('maxTotal', v === '' ? '' : Number(v))} thousandSeparator="." decimalSeparator="," hideControls allowNegative={false} />
                </Group>
              </Input.Wrapper>
              <Select label="Thanh toán" placeholder="Tất cả" data={[{ value: 'paid', label: 'Đã thanh toán' }, { value: 'unpaid', label: 'Chưa thanh toán' }]} value={f.paid} onChange={(v) => set('paid', v)} clearable />
              <Select label="Bản gốc XML/PDF" placeholder="Tất cả" data={[{ value: 'yes', label: 'Đã có bản gốc' }, { value: 'no', label: 'Chưa có bản gốc' }]} value={f.original} onChange={(v) => set('original', v)} clearable />
              <Select label="Rủi ro MST đối tác" placeholder="Tất cả" data={[{ value: 'risky', label: 'Có rủi ro (mọi mức)' }, { value: 'high', label: 'Chỉ rủi ro cao' }]} value={f.risk} onChange={(v) => set('risk', v)} clearable />
            </SimpleGrid>
            <Group justify="space-between" mt="md">
              <Text fz="xs" c="dimmed">Kết quả cập nhật ngay khi thay đổi bộ lọc.</Text>
              <Group gap="xs">
                <Button variant="subtle" color="gray" size="xs" onClick={clearAll} disabled={!chips.length && !q}>Đặt lại</Button>
                <Button size="xs" onClick={() => setAdvOpen(false)}>Thu gọn</Button>
              </Group>
            </Group>
          </Box>
        </Collapse>

        {/* Bộ lọc đang áp dụng */}
        {chips.length > 0 && (
          <Group gap={8} px={{ base: 'md', sm: 'lg' }} py={12} style={{ borderTop: '1px solid var(--ihx-border)' }}>
            <Text fz="xs" c="dimmed" mr={4}>Đang lọc:</Text>
            {chips.map((c) => <Pill key={c.key} withRemoveButton onRemove={c.clear} size="md">{c.label}</Pill>)}
            <Button variant="subtle" size="compact-xs" color="red" onClick={clearAll}>Xoá tất cả</Button>
          </Group>
        )}

        {/* Mobile / tablet nhỏ: danh sách thẻ */}
        <Box hiddenFrom="md" style={{ borderTop: '1px solid var(--ihx-border)' }}>
          {pageRows.map((r) => (
            <UnstyledButton key={r.id} onClick={() => setOpen(r)} w="100%" px="md" py={14} style={{ borderBottom: '1px solid var(--ihx-border)', borderLeft: `3px solid var(--mantine-color-${r.direction === 'in' ? 'iris-6' : 'volt-5'})` }}>
              <Group justify="space-between" wrap="nowrap" gap="sm" mb={4}>
                <Text fz="sm" className="mono" c="dimmed">{r.symbol} · {r.number}</Text>
                <Group gap={6} wrap="nowrap">
                  <Box w={8} h={8} style={{ borderRadius: 99, background: `var(--mantine-color-${STATUS_META[r.status].color}-6)` }} />
                  <Text fz="xs">{STATUS_META[r.status].label}</Text>
                </Group>
              </Group>
              <Group gap={6} wrap="nowrap" align="flex-start">
                <Text fz="md" fw={500} lh={1.4} lineClamp={2}>{r.partnerName}</Text>
                {r.risk !== 'none' && <IconAlertTriangle size={16} color={`var(--mantine-color-${r.risk === 'high' ? 'red' : 'yellow'}-6)`} style={{ flexShrink: 0, marginTop: 3 }} />}
              </Group>
              <Group justify="space-between" mt={8} align="flex-end">
                <Box>
                  <Text fz="xs" c="dimmed">{dateVN(r.issuedAt)} · {r.direction === 'in' ? 'Đầu vào' : 'Đầu ra'}</Text>
                  <Text fz="xs" c="dimmed">Thuế {r.vatRate}%: {r.vat.toLocaleString('vi-VN')}</Text>
                </Box>
                <Box ta="right">
                  <Text fz="md" fw={500} className="tnum">{r.total.toLocaleString('vi-VN')} ₫</Text>
                  <Text fz="xs" c={r.paid ? 'teal.7' : 'orange.7'}>{r.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</Text>
                </Box>
              </Group>
            </UnstyledButton>
          ))}
          {pageRows.length === 0 && (
            <Box py={48} px="md" ta="center">
              <Text fw={500}>Không có hoá đơn khớp bộ lọc</Text>
              <Button mt="md" variant="light" onClick={clearAll}>Xoá bộ lọc</Button>
            </Box>
          )}
        </Box>

        <Box visibleFrom="md">
        <Table.ScrollContainer minWidth={900} type="native">
          <Table highlightOnHover verticalSpacing={16} horizontalSpacing="lg" style={{ borderTop: '1px solid var(--ihx-border)', tableLayout: 'fixed' }}>
            <Table.Thead bg="var(--mantine-color-body)">
              <Table.Tr>
                <Table.Th w={44}>
                  <Checkbox
                    aria-label="Chọn cả trang"
                    checked={allOnPage}
                    indeterminate={!allOnPage && pageRows.some((r) => selected.includes(r.id))}
                    onChange={() => setSelected((s) => (allOnPage ? s.filter((id) => !pageRows.some((r) => r.id === id)) : [...new Set([...s, ...pageRows.map((r) => r.id)])]))}
                  />
                </Table.Th>
                <Table.Th w={140}>Số hoá đơn</Table.Th>
                <Th k="issuedAt" w={115}>Ngày lập</Th>
                <Th k="partnerName">Đối tác</Th>
                <Th k="vat" right w={120}>Thuế GTGT</Th>
                <Th k="total" right w={140}>Tổng tiền</Th>
                <Table.Th w={140} pl={28}>Trạng thái</Table.Th>
                <Table.Th w={52} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pageRows.map((r) => (
                <Table.Tr key={r.id} bg={selected.includes(r.id) ? 'var(--mantine-color-iris-light)' : undefined} style={{ cursor: 'pointer' }} onClick={() => setOpen(r)}>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Checkbox aria-label="Chọn" checked={selected.includes(r.id)} onChange={() => setSelected((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]))} />
                  </Table.Td>
                  <Table.Td>
                    <Group gap={10} wrap="nowrap">
                      <Tooltip label={r.direction === 'in' ? 'Đầu vào' : 'Đầu ra'}>
                        <Box w={3} h={36} style={{ borderRadius: 2, flexShrink: 0, background: r.direction === 'in' ? 'var(--mantine-color-iris-6)' : 'var(--mantine-color-volt-5)' }} />
                      </Tooltip>
                      <Box>
                        <Text fz="sm" fw={500} className="mono" lh={1.5}>{r.number}</Text>
                        <Text fz="xs" c="dimmed" className="mono" lh={1.5}>{r.symbol}</Text>
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text fz="sm" className="tnum">{dateVN(r.issuedAt)}</Text></Table.Td>
                  <Table.Td>
                    <Group gap={6} wrap="nowrap" align="flex-start">
                      <Text fz="sm" fw={500} lineClamp={2} lh={1.45} title={r.partnerName}>{r.partnerName}</Text>
                      {r.risk !== 'none' && (
                        <Tooltip label={r.risk === 'high' ? 'MST ngừng hoạt động' : 'MST tạm ngừng kinh doanh'}>
                          <IconAlertTriangle size={15} color={`var(--mantine-color-${r.risk === 'high' ? 'red' : 'yellow'}-6)`} style={{ flexShrink: 0, marginTop: 3 }} />
                        </Tooltip>
                      )}
                    </Group>
                    <Text fz="xs" c="dimmed" className="mono" lh={1.5} mt={2}>MST {r.partnerTax}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text fz="sm" className="tnum" lh={1.5}>{r.vat.toLocaleString('vi-VN')}</Text>
                    <Text fz="xs" c="dimmed" lh={1.5}>{r.vatRate}%</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text fz="sm" fw={500} className="tnum" lh={1.5}>{r.total.toLocaleString('vi-VN')}</Text>
                    <Text fz="xs" c={r.paid ? 'teal.7' : 'orange.7'} lh={1.5}>{r.paid ? 'Đã TT' : 'Chưa TT'}</Text>
                  </Table.Td>
                  <Table.Td pl={28}>
                    <Group gap={6} wrap="nowrap">
                      <Box w={8} h={8} style={{ borderRadius: 99, flexShrink: 0, background: `var(--mantine-color-${STATUS_META[r.status].color}-6)` }} />
                      <Text fz="sm" style={{ whiteSpace: 'nowrap' }}>{STATUS_META[r.status].label}</Text>
                    </Group>
                    <Group gap={4} wrap="nowrap" c={r.hasOriginal ? 'dimmed' : 'orange.7'}>
                      {r.hasOriginal ? <IconCloudCheck size={13} /> : <IconCloudOff size={13} />}
                      <Text fz="xs" inherit style={{ whiteSpace: 'nowrap' }}>{r.hasOriginal ? 'Có bản gốc' : 'Chưa có gốc'}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Menu position="bottom-end" withinPortal>
                      <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label="Thao tác"><IconDots size={16} /></ActionIcon></Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEye size={14} />} onClick={() => setOpen(r)}>Xem chi tiết</Menu.Item>
                        <Menu.Item leftSection={<IconDownload size={14} />}>Tải XML + PDF</Menu.Item>
                        <Menu.Item leftSection={<IconTag size={14} />}>Gắn nhãn</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
              {pageRows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Box py={56} ta="center">
                      <Text fw={500}>Không có hoá đơn khớp bộ lọc</Text>
                      <Text fz="sm" c="dimmed" mt={4}>Thử bỏ bớt điều kiện lọc hoặc đổi khoảng ngày.</Text>
                      <Button mt="md" variant="light" onClick={clearAll}>Xoá bộ lọc</Button>
                    </Box>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        </Box>

        <Group justify="space-between" px={{ base: 'md', sm: 'lg' }} py="md" style={{ borderTop: '1px solid var(--ihx-border)' }}>
          <Group gap="sm">
            <Text fz="sm" c="dimmed">
              {filtered.length ? `${(page - 1) * ps + 1}–${Math.min(page * ps, filtered.length)}` : 0} / {filtered.length} hoá đơn
            </Text>
            <Select size="xs" w={110} visibleFrom="sm" value={pageSize} onChange={(v) => setPageSize(v ?? '20')} data={PAGE_SIZES.map((v) => ({ value: v, label: `${v} / trang` }))} allowDeselect={false} />
          </Group>
          <Pagination total={Math.max(1, Math.ceil(filtered.length / ps))} value={page} onChange={setPage} size="sm" />
        </Group>
      </Paper>

      <Affix position={{ bottom: 24, left: 0, right: 0 }} zIndex={150}>
        <Transition transition="slide-up" mounted={selected.length > 0}>
          {(styles) => (
            <Group justify="center" style={styles} px="md">
              <Paper shadow="xl" radius="md" px="md" py="sm" style={{ background: '#0f1f3d' }}>
                <Group gap="md">
                  <Text fw={500} c="white" fz="sm">Đã chọn {selected.length} hoá đơn</Text>
                  <Text fz="sm" c="gray.4" className="tnum" visibleFrom="sm">{vnd(invoices.filter((i) => selected.includes(i.id)).reduce((s, i) => s + i.total, 0))}</Text>
                  <Button size="xs" leftSection={<IconDownload size={14} />} onClick={() => { notifications.show({ title: 'Đã đưa vào hàng đợi', message: `Đang nén ${selected.length} hoá đơn (XML + PDF)…`, color: 'iris' }); setSelected([]); }}>Tải bản gốc</Button>
                  <Button size="xs" variant="white" leftSection={<IconFileSpreadsheet size={14} />} onClick={() => exportCsv(invoices.filter((i) => selected.includes(i.id)), 'hoa-don-da-chon.csv')}>Excel</Button>
                  <ActionIcon variant="subtle" color="gray" onClick={() => setSelected([])} aria-label="Bỏ chọn"><IconX size={16} /></ActionIcon>
                </Group>
              </Paper>
            </Group>
          )}
        </Transition>
      </Affix>

      <InvoiceDrawer invoice={open} onClose={() => setOpen(null)} />
    </>
  );
}

export default function InvoicesPage() {
  return <Suspense><InvoicesInner /></Suspense>;
}
