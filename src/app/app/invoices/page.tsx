'use client';

import {
  ActionIcon, Affix, Badge, Box, Button, Card, Checkbox, Chip, Group, Menu, MultiSelect, Pagination, Paper,
  SegmentedControl, Select, SimpleGrid, Table, Text, TextInput, Tooltip, Transition,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle, IconArrowsSort, IconCalendar, IconCloudCheck, IconCloudOff, IconDots, IconDownload,
  IconEye, IconFileSpreadsheet, IconFilter, IconSearch, IconTag, IconX,
} from '@tabler/icons-react';
import 'dayjs/locale/vi';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/AppFrame';
import { InvoiceDrawer } from '@/components/InvoiceDrawer';
import { STATUS_META, type Invoice } from '@/lib/data';
import { dateVN, vnd, compact } from '@/lib/format';
import { useStore } from '@/lib/store';

const PAGE = 12;
type SortKey = 'issuedAt' | 'total' | 'partnerName';

function exportCsv(rows: Invoice[], name: string) {
  const head = ['Ký hiệu', 'Số HĐ', 'Ngày', 'Loại', 'Đối tác', 'MST', 'Tiền hàng', 'VAT%', 'Tiền thuế', 'Tổng', 'Trạng thái'];
  const lines = rows.map((r) => [r.symbol, r.number, dateVN(r.issuedAt), r.direction === 'in' ? 'Vào' : 'Ra', `"${r.partnerName}"`, r.partnerTax, r.preTax, r.vatRate, r.vat, r.total, STATUS_META[r.status].label].join(','));
  const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

function InvoicesInner() {
  const params = useSearchParams();
  const { invoices, active } = useStore();
  const [direction, setDirection] = useState<'all' | 'in' | 'out'>('all');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [dq] = useDebouncedValue(q, 200);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [riskOnly, setRiskOnly] = useState(params.get('risk') === '1');
  const [missingOnly, setMissingOnly] = useState(false);
  const [vat, setVat] = useState<string | null>(null);
  const [dates, setDates] = useState<[string | null, string | null]>([null, null]);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'issuedAt', dir: -1 });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState<Invoice | null>(null);

  useEffect(() => { setSelected([]); setPage(1); }, [active.id]);

  const filtered = useMemo(() => {
    const term = dq.trim().toLowerCase();
    const from = dates[0] ? new Date(dates[0]).getTime() : -Infinity;
    const to = dates[1] ? new Date(dates[1]).getTime() + 86400000 : Infinity;
    const rows = invoices.filter((i) => {
      if (direction !== 'all' && i.direction !== direction) return false;
      if (statuses.length && !statuses.includes(i.status)) return false;
      if (riskOnly && i.risk === 'none') return false;
      if (missingOnly && i.hasOriginal) return false;
      if (vat && String(i.vatRate) !== vat) return false;
      const t = new Date(i.issuedAt).getTime();
      if (t < from || t > to) return false;
      if (term && !`${i.number} ${i.symbol} ${i.partnerName} ${i.partnerTax}`.toLowerCase().includes(term)) return false;
      return true;
    });
    return rows.sort((a, b) => {
      const x = a[sort.key], y = b[sort.key];
      return (typeof x === 'number' ? x - (y as number) : String(x).localeCompare(String(y))) * sort.dir;
    });
  }, [invoices, direction, statuses, riskOnly, missingOnly, vat, dates, dq, sort]);

  useEffect(() => setPage(1), [direction, statuses, riskOnly, missingOnly, vat, dates, dq]);

  const pageRows = filtered.slice((page - 1) * PAGE, page * PAGE);
  const totals = filtered.reduce((s, i) => ({ pre: s.pre + i.preTax, vat: s.vat + i.vat, total: s.total + i.total }), { pre: 0, vat: 0, total: 0 });
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));
  const activeFilters = statuses.length + (riskOnly ? 1 : 0) + (missingOnly ? 1 : 0) + (vat ? 1 : 0) + (dates[0] ? 1 : 0);

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }));
  const Th = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean }) => (
    <Table.Th ta={right ? 'right' : undefined} onClick={() => toggleSort(k)} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <Group gap={4} justify={right ? 'flex-end' : 'flex-start'} wrap="nowrap">{children}<IconArrowsSort size={13} opacity={sort.key === k ? 1 : 0.35} /></Group>
    </Table.Th>
  );

  const clearAll = () => { setStatuses([]); setRiskOnly(false); setMissingOnly(false); setVat(null); setDates([null, null]); setQ(''); };

  return (
    <>
      <PageHeader
        eyebrow="Kho hoá đơn"
        title="Hoá đơn điện tử"
        subtitle={`${active.name} · ${invoices.length} hoá đơn`}
        right={
          <Group>
            <Button variant="default" leftSection={<IconFileSpreadsheet size={16} />} onClick={() => exportCsv(filtered, `hoa-don-${active.taxCode}.csv`)}>
              Xuất Excel ({filtered.length})
            </Button>
          </Group>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="lg">
        {[
          { label: 'Tiền hàng chưa thuế', value: totals.pre, color: 'iris' },
          { label: 'Tiền thuế GTGT', value: totals.vat, color: 'yellow' },
          { label: 'Tổng thanh toán', value: totals.total, color: 'volt' },
        ].map((s) => (
          <Paper key={s.label} className="glass" withBorder p="md" radius="lg" style={{ borderLeft: `4px solid var(--mantine-color-${s.color}-5)` }}>
            <Text fz="xs" c="dimmed" tt="uppercase" fw={700} lts={1}>{s.label}</Text>
            <Text fz={22} fw={900} className="tnum">{vnd(s.value)}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      <Card className="glass" p={0}>
        <Box p="md" style={{ borderBottom: '1px solid var(--ihx-border)' }}>
          <Group justify="space-between" gap="sm">
            <SegmentedControl
              radius="xl"
              value={direction}
              onChange={(v) => setDirection(v as typeof direction)}
              data={[
                { value: 'all', label: `Tất cả · ${invoices.length}` },
                { value: 'in', label: `Đầu vào · ${invoices.filter((i) => i.direction === 'in').length}` },
                { value: 'out', label: `Đầu ra · ${invoices.filter((i) => i.direction === 'out').length}` },
              ]}
            />
            <TextInput
              placeholder="Số HĐ, ký hiệu, tên hoặc MST đối tác…"
              leftSection={<IconSearch size={16} />}
              rightSection={q ? <ActionIcon variant="subtle" size="sm" onClick={() => setQ('')}><IconX size={14} /></ActionIcon> : null}
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              w={{ base: '100%', sm: 340 }}
              radius="xl"
            />
          </Group>
          <Group mt="md" gap="sm" align="flex-end">
            <MultiSelect
              placeholder={statuses.length ? undefined : 'Trạng thái'}
              data={Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label }))}
              value={statuses}
              onChange={setStatuses}
              leftSection={<IconFilter size={16} />}
              w={{ base: '100%', sm: 260 }}
              clearable
              radius="xl"
            />
            <DatePickerInput
              type="range"
              locale="vi"
              placeholder="Khoảng ngày lập"
              leftSection={<IconCalendar size={16} />}
              value={dates}
              onChange={(v) => setDates(v as [string | null, string | null])}
              clearable
              valueFormat="DD/MM/YYYY"
              w={{ base: '100%', sm: 250 }}
              radius="xl"
            />
            <Select placeholder="Thuế suất" data={['0', '5', '8', '10'].map((v) => ({ value: v, label: `VAT ${v}%` }))} value={vat} onChange={setVat} clearable w={{ base: '100%', sm: 140 }} radius="xl" />
            <Chip checked={riskOnly} onChange={setRiskOnly} color="orange" variant="light" icon={<IconAlertTriangle size={14} />}>MST rủi ro</Chip>
            <Chip checked={missingOnly} onChange={setMissingOnly} color="iris" variant="light">Chưa có bản gốc</Chip>
            {activeFilters > 0 && <Button variant="subtle" size="compact-sm" color="gray" onClick={clearAll}>Xoá {activeFilters} bộ lọc</Button>}
          </Group>
        </Box>

        <Table.ScrollContainer minWidth={980}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40}>
                  <Checkbox
                    aria-label="Chọn trang"
                    checked={allOnPage}
                    indeterminate={!allOnPage && pageRows.some((r) => selected.includes(r.id))}
                    onChange={() => setSelected((s) => (allOnPage ? s.filter((id) => !pageRows.some((r) => r.id === id)) : [...new Set([...s, ...pageRows.map((r) => r.id)])]))}
                  />
                </Table.Th>
                <Table.Th>Hoá đơn</Table.Th>
                <Th k="issuedAt">Ngày lập</Th>
                <Th k="partnerName">Đối tác</Th>
                <Table.Th ta="right">Tiền thuế</Table.Th>
                <Th k="total" right>Tổng tiền</Th>
                <Table.Th>Trạng thái</Table.Th>
                <Table.Th ta="center">Gốc</Table.Th>
                <Table.Th w={50} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pageRows.map((r) => (
                <Table.Tr key={r.id} bg={selected.includes(r.id) ? 'var(--mantine-color-iris-light)' : undefined} style={{ cursor: 'pointer' }} onClick={() => setOpen(r)}>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Checkbox aria-label="Chọn" checked={selected.includes(r.id)} onChange={() => setSelected((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]))} />
                  </Table.Td>
                  <Table.Td>
                    <Group gap={8} wrap="nowrap">
                      <Box w={4} h={34} style={{ borderRadius: 4, background: r.direction === 'in' ? 'var(--mantine-color-iris-4)' : 'var(--mantine-color-volt-6)' }} />
                      <Box>
                        <Text fz="sm" fw={700} className="mono">{r.number}</Text>
                        <Text fz="xs" c="dimmed" className="mono">{r.symbol}</Text>
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text fz="sm" className="tnum">{dateVN(r.issuedAt)}</Text></Table.Td>
                  <Table.Td maw={300}>
                    <Group gap={6} wrap="nowrap">
                      <Text fz="sm" fw={600} truncate>{r.partnerName}</Text>
                      {r.risk !== 'none' && <Tooltip label={r.risk === 'high' ? 'MST rủi ro cao' : 'MST cần theo dõi'}><IconAlertTriangle size={15} color={`var(--mantine-color-${r.risk === 'high' ? 'red' : 'yellow'}-5)`} style={{ flexShrink: 0 }} /></Tooltip>}
                    </Group>
                    <Group gap={6}>
                      <Text fz="xs" c="dimmed" className="mono">{r.partnerTax}</Text>
                      {r.tags.map((t) => <Badge key={t} size="xs" variant="outline" color="gray" leftSection={<IconTag size={9} />}>{t}</Badge>)}
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right"><Text fz="sm" className="tnum">{r.vat.toLocaleString('vi-VN')}</Text><Text fz="xs" c="dimmed">{r.vatRate}%</Text></Table.Td>
                  <Table.Td ta="right"><Text fz="sm" fw={800} className="tnum">{r.total.toLocaleString('vi-VN')}</Text></Table.Td>
                  <Table.Td><Badge color={STATUS_META[r.status].color} variant="dot">{STATUS_META[r.status].label}</Badge></Table.Td>
                  <Table.Td ta="center">
                    {r.hasOriginal ? <IconCloudCheck size={18} color="var(--mantine-color-teal-5)" /> : <IconCloudOff size={18} opacity={0.4} />}
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Menu position="bottom-end" withinPortal>
                      <Menu.Target><ActionIcon variant="subtle" color="gray"><IconDots size={16} /></ActionIcon></Menu.Target>
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
                <Table.Tr><Table.Td colSpan={9}><Box py={60} ta="center"><Text fz={40}>🧾</Text><Text fw={700}>Không có hoá đơn khớp bộ lọc</Text><Button mt="sm" variant="light" onClick={clearAll}>Xoá bộ lọc</Button></Box></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Group justify="space-between" p="md" style={{ borderTop: '1px solid var(--ihx-border)' }}>
          <Text fz="sm" c="dimmed">Hiển thị {filtered.length ? (page - 1) * PAGE + 1 : 0}–{Math.min(page * PAGE, filtered.length)} / {filtered.length}</Text>
          <Pagination total={Math.max(1, Math.ceil(filtered.length / PAGE))} value={page} onChange={setPage} radius="xl" size="sm" />
        </Group>
      </Card>

      <Affix position={{ bottom: 24, left: 0, right: 0 }} zIndex={150}>
        <Transition transition="slide-up" mounted={selected.length > 0}>
          {(styles) => (
            <Group justify="center" style={styles} px="md">
              <Paper shadow="xl" radius="xl" px="lg" py="sm" style={{ background: '#151725', border: '1px solid rgba(150,127,255,.4)' }}>
                <Group gap="md">
                  <Text fw={700} c="white">Đã chọn {selected.length} hoá đơn</Text>
                  <Text fz="sm" c="gray.5" className="tnum" visibleFrom="sm">{compact(invoices.filter((i) => selected.includes(i.id)).reduce((s, i) => s + i.total, 0))}</Text>
                  <Button size="xs" className="volt-btn" leftSection={<IconDownload size={14} />} onClick={() => { notifications.show({ title: 'Đã đưa vào hàng đợi', message: `Đang nén ${selected.length} hoá đơn (XML + PDF)…`, color: 'iris' }); setSelected([]); }}>Tải bản gốc</Button>
                  <Button size="xs" variant="white" color="dark" leftSection={<IconFileSpreadsheet size={14} />} onClick={() => exportCsv(invoices.filter((i) => selected.includes(i.id)), 'hoa-don-da-chon.csv')}>Excel</Button>
                  <ActionIcon variant="subtle" color="gray" onClick={() => setSelected([])}><IconX size={16} /></ActionIcon>
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
