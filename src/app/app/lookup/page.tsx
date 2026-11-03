'use client';

import {
  ActionIcon, Alert, Badge, Box, Button, CopyButton, Grid, Group, Loader, Paper, Progress, SimpleGrid, Stack, Table,
  Tabs, Text, Textarea, TextInput, ThemeIcon, Tooltip, UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue, useLocalStorage } from '@mantine/hooks';
import {
  IconAlertTriangle, IconBuilding, IconCheck, IconCircleCheck, IconCircleX, IconCopy, IconFileSpreadsheet,
  IconHistory, IconListSearch, IconSearch, IconTrash, IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader, SectionCard } from '@/components/AppFrame';
import { timeVN, vnd } from '@/lib/format';
import { checkMst, DEMO_MSTS, lookupMst, normalizeMst, NotFoundError, type MstResult } from '@/lib/mst';
import { useStore } from '@/lib/store';

const STATUS = {
  active: { label: 'Đang hoạt động', color: 'teal' },
  paused: { label: 'Tạm ngừng kinh doanh', color: 'yellow' },
  closed: { label: 'Ngừng hoạt động', color: 'red' },
} as const;

function CopyIcon({ value }: { value: string }) {
  return (
    <CopyButton value={value}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Đã chép' : 'Sao chép'}>
          <ActionIcon size="sm" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy} aria-label="Sao chép">
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <Box py={10} style={{ borderBottom: '1px dashed var(--ihx-border)' }}>
      <Text fz="xs" c="dimmed" mb={2}>{label}</Text>
      <Group gap={4} wrap="nowrap" justify="space-between">
        <Text fz="sm" fw={500} className={mono ? 'mono' : undefined}>{value || <Text span c="dimmed" fw={400}>—</Text>}</Text>
        {value && <CopyIcon value={value} />}
      </Group>
    </Box>
  );
}

function ResultCard({ r }: { r: MstResult }) {
  const { invoices, companies, active } = useStore();
  const related = invoices.filter((i) => i.partnerTax === r.taxCode);
  const mine = companies.find((c) => c.taxCode === r.taxCode);
  const total = related.reduce((s, i) => s + i.total, 0);
  return (
    <Paper withBorder radius="md" p={20}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon size={48} radius="md" variant="light"><IconBuilding size={24} /></ThemeIcon>
          <Box style={{ minWidth: 0 }}>
            <Text fw={500} fz="lg" lh={1.3}>{r.name}</Text>
            <Group gap={6}>
              <Text fz="sm" c="dimmed" className="mono">MST {r.taxCode}</Text>
              <CopyIcon value={r.taxCode} />
            </Group>
          </Box>
        </Group>
        {r.status ? (
          <Badge size="lg" color={STATUS[r.status].color}>{STATUS[r.status].label}</Badge>
        ) : (
          <Tooltip label="Nguồn tra cứu không cung cấp tình trạng hoạt động">
            <Badge size="lg" color="gray">Chưa rõ tình trạng</Badge>
          </Tooltip>
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <Box>
          <Field label="Tên doanh nghiệp" value={r.name} />
          <Field label="Tên quốc tế" value={r.internationalName} />
          <Field label="Tên viết tắt" value={r.shortName} />
        </Box>
        <Box>
          <Field label="Địa chỉ" value={r.address} />
          <Field label="Mã số thuế" value={r.taxCode} mono />
          <Field label="Thời điểm tra cứu" value={timeVN(r.fetchedAt)} />
        </Box>
      </SimpleGrid>

      {r.status && r.status !== 'active' && (
        <Alert mt="md" color={STATUS[r.status].color} icon={<IconAlertTriangle size={18} />} p="sm">
          <Text fz="sm">Hoá đơn từ doanh nghiệp này có thể không đủ điều kiện khấu trừ thuế GTGT. Kiểm tra trước khi kê khai.</Text>
        </Alert>
      )}

      <Group mt="md" gap="sm">
        {mine && <Badge color="iris" size="lg">Doanh nghiệp bạn đang quản lý</Badge>}
        {related.length > 0 ? (
          <Button component={Link} href={`/app/invoices?q=${r.taxCode}`} variant="light" size="xs">
            {related.length} hoá đơn với đối tác này · {vnd(total)}
          </Button>
        ) : (
          <Text fz="xs" c="dimmed">Chưa có hoá đơn nào với đối tác này trong {active.shortName}.</Text>
        )}
      </Group>

      <Text fz="xs" c="dimmed" mt="md">
        Nguồn: {r.source === 'vietqr' ? 'API công khai VietQR (tên, địa chỉ)' : 'Dữ liệu mẫu của bản demo — không phải dữ liệu thật'}.
        Tình trạng chính thức xem tại cổng của Cục Thuế.
      </Text>
    </Paper>
  );
}

function QuickLookup() {
  const [value, setValue] = useState('');
  const [dv] = useDebouncedValue(value, 350);
  const [state, setState] = useState<{ loading: boolean; result?: MstResult; error?: string }>({ loading: false });
  const [history, setHistory] = useLocalStorage<MstResult[]>({ key: 'ihx-mst-history', defaultValue: [] });
  const check = useMemo(() => checkMst(dv), [dv]);
  const live = checkMst(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  // Tự tra cứu khi MST hợp lệ — không cần bấm nút
  useEffect(() => {
    if (!check.ok) { setState({ loading: false }); return; }
    const ctrl = new AbortController();
    setState({ loading: true });
    lookupMst(check.normalized, ctrl.signal)
      .then((result) => {
        setState({ loading: false, result });
        setHistory((h) => [result, ...h.filter((x) => x.taxCode !== result.taxCode)].slice(0, 8));
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({ loading: false, error: e instanceof NotFoundError ? `Không tìm thấy doanh nghiệp có MST ${check.normalized}.` : (e as Error).message });
      });
    return () => ctrl.abort();
  }, [check]); // eslint-disable-line react-hooks/exhaustive-deps

  const showFormatError = value.length >= 10 && !live.ok;

  return (
    <Grid gap="md">
      <Grid.Col span={{ base: 12, lg: 8 }}>
        <Stack gap="md">
          <SectionCard title="Nhập mã số thuế" description="Gõ hoặc dán MST — hệ thống tự kiểm tra và tra cứu ngay, không cần bấm nút.">
            <TextInput
              ref={ref}
              size="lg"
              placeholder="VD: 0100107518 hoặc 0100107518-001"
              className="mono"
              value={value}
              onChange={(e) => setValue(e.currentTarget.value)}
              onPaste={(e) => { e.preventDefault(); setValue(normalizeMst(e.clipboardData.getData('text'))); }}
              leftSection={state.loading ? <Loader size={18} /> : <IconSearch size={20} />}
              rightSection={value ? <ActionIcon variant="subtle" color="gray" onClick={() => setValue('')} aria-label="Xoá"><IconX size={16} /></ActionIcon> : null}
              error={showFormatError ? (live as { reason: string }).reason : null}
              maxLength={16}
            />
            <Group mt="sm" gap="lg">
              {live.ok ? (
                <Group gap={6}><IconCircleCheck size={16} color="var(--mantine-color-teal-6)" /><Text fz="sm" c="teal.7">MST đúng định dạng & chữ số kiểm tra · {live.kind === 'branch' ? `Đơn vị phụ thuộc của ${live.parent}` : 'Đơn vị chính'}</Text></Group>
              ) : (
                <Text fz="xs" c="dimmed">Thử MST mẫu:</Text>
              )}
              {!live.ok && DEMO_MSTS.map((m) => <Button key={m} size="compact-xs" variant="default" className="mono" onClick={() => setValue(m)}>{m}</Button>)}
            </Group>
          </SectionCard>

          {state.loading && (
            <Paper withBorder radius="md" p={20}><Group gap="sm"><Loader size="sm" /><Text fz="sm" c="dimmed">Đang tra cứu {check.ok ? check.normalized : ''}…</Text></Group></Paper>
          )}
          {state.error && <Alert color="red" icon={<IconCircleX size={18} />} title="Không có kết quả">{state.error}</Alert>}
          {state.result && !state.loading && <ResultCard r={state.result} />}
          {!value && !state.result && (
            <Paper withBorder radius="md" p={32} ta="center" style={{ borderStyle: 'dashed' }}>
              <ThemeIcon size={48} radius="xl" variant="light" mx="auto" mb="sm"><IconSearch size={24} /></ThemeIcon>
              <Text fw={500}>Nhập MST để bắt đầu</Text>
              <Text fz="sm" c="dimmed">Kết quả gồm tên, địa chỉ và các hoá đơn bạn có với doanh nghiệp đó.</Text>
            </Paper>
          )}
        </Stack>
      </Grid.Col>

      <Grid.Col span={{ base: 12, lg: 4 }}>
        <SectionCard
          title={<Group gap={6}><IconHistory size={16} />Tra cứu gần đây</Group>}
          actions={history.length ? <Button size="compact-xs" variant="subtle" color="gray" leftSection={<IconTrash size={12} />} onClick={() => setHistory([])}>Xoá</Button> : null}
          noPadding
        >
          {history.length === 0 ? (
            <Text fz="sm" c="dimmed" px={20} pb={20}>Chưa có lượt tra cứu nào.</Text>
          ) : (
            <Stack gap={0}>
              {history.map((h) => (
                <UnstyledButton key={h.taxCode} onClick={() => setValue(h.taxCode)} px={20} py={10} style={{ borderTop: '1px solid var(--ihx-border)' }}>
                  <Text fz="sm" fw={500} truncate>{h.name}</Text>
                  <Text fz="xs" c="dimmed" className="mono">{h.taxCode}</Text>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </SectionCard>
      </Grid.Col>
    </Grid>
  );
}

type Row = { input: string; mst: string; check: ReturnType<typeof checkMst>; status: 'wait' | 'loading' | 'ok' | 'notfound' | 'error' | 'invalid'; result?: MstResult; error?: string };

function BatchLookup() {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const stop = useRef(false);

  const parsed = useMemo(() => [...new Set(text.split(/[\s,;]+/).map(normalizeMst).filter(Boolean))], [text]);

  const run = async () => {
    stop.current = false;
    const init: Row[] = parsed.map((m) => { const c = checkMst(m); return { input: m, mst: c.ok ? c.normalized : m, check: c, status: c.ok ? 'wait' : 'invalid' }; });
    setRows(init);
    setRunning(true);
    for (let i = 0; i < init.length; i++) {
      if (stop.current) break;
      if (init[i]!.status === 'invalid') continue;
      setRows((rs) => rs.map((r, j) => (j === i ? { ...r, status: 'loading' } : r)));
      try {
        const result = await lookupMst(init[i]!.mst);
        setRows((rs) => rs.map((r, j) => (j === i ? { ...r, status: 'ok', result } : r)));
      } catch (e) {
        setRows((rs) => rs.map((r, j) => (j === i ? { ...r, status: e instanceof NotFoundError ? 'notfound' : 'error', error: (e as Error).message } : r)));
      }
      await new Promise((r) => setTimeout(r, 250)); // tránh gửi dồn dập
    }
    setRunning(false);
  };

  const done = rows.filter((r) => !['wait', 'loading'].includes(r.status)).length;
  const exportCsv = () => {
    const head = 'MST,Hợp lệ,Tên doanh nghiệp,Địa chỉ,Kết quả';
    const lines = rows.map((r) => [r.mst, r.check.ok ? 'Có' : 'Không', `"${r.result?.name ?? ''}"`, `"${r.result?.address ?? ''}"`, r.status === 'ok' ? 'Tìm thấy' : r.status === 'invalid' ? (r.check as { reason: string }).reason : r.error ?? ''].join(','));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + [head, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = 'tra-cuu-mst.csv';
    a.click();
  };

  return (
    <Stack gap="md">
      <SectionCard title="Tra cứu hàng loạt" description="Dán danh sách MST (mỗi dòng một mã, hoặc cách nhau bởi dấu phẩy). Tối đa 200 mã mỗi lần.">
        <Textarea
          autosize minRows={4} maxRows={10} className="mono"
          placeholder={'0100107518\n0314789667\n0316654337'}
          value={text} onChange={(e) => setText(e.currentTarget.value)}
        />
        <Group justify="space-between" mt="md">
          <Text fz="sm" c="dimmed">{parsed.length} MST · {parsed.filter((m) => !checkMst(m).ok).length} sai định dạng</Text>
          <Group gap="sm">
            {running ? (
              <Button variant="default" onClick={() => { stop.current = true; }}>Dừng</Button>
            ) : (
              <Button onClick={run} disabled={!parsed.length || parsed.length > 200} leftSection={<IconListSearch size={16} />}>Tra cứu {parsed.length || ''} MST</Button>
            )}
          </Group>
        </Group>
      </SectionCard>

      {rows.length > 0 && (
        <SectionCard
          title="Kết quả"
          description={`${done}/${rows.length} đã xử lý · ${rows.filter((r) => r.status === 'ok').length} tìm thấy · ${rows.filter((r) => r.status === 'invalid').length} sai MST`}
          actions={<Button size="xs" variant="default" leftSection={<IconFileSpreadsheet size={14} />} onClick={exportCsv} disabled={running}>Xuất Excel</Button>}
          noPadding
        >
          {running && <Progress value={(done / rows.length) * 100} size="xs" radius={0} animated />}
          <Table.ScrollContainer minWidth={720}>
            <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover style={{ borderTop: '1px solid var(--ihx-border)' }}>
              <Table.Thead><Table.Tr><Table.Th w={150}>MST</Table.Th><Table.Th w={120}>Kiểm tra</Table.Th><Table.Th>Tên doanh nghiệp / Địa chỉ</Table.Th><Table.Th w={190}>Tình trạng</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>
                {rows.map((r) => (
                  <Table.Tr key={r.input}>
                    <Table.Td className="mono" fz="sm">{r.mst}</Table.Td>
                    <Table.Td>{r.check.ok ? <Badge color="teal">Hợp lệ</Badge> : <Tooltip label={(r.check as { reason: string }).reason}><Badge color="red">Sai MST</Badge></Tooltip>}</Table.Td>
                    <Table.Td>
                      {r.status === 'loading' && <Group gap={6}><Loader size={14} /><Text fz="sm" c="dimmed">Đang tra cứu…</Text></Group>}
                      {r.status === 'wait' && <Text fz="sm" c="dimmed">Đang chờ</Text>}
                      {r.status === 'ok' && <><Text fz="sm" fw={500}>{r.result!.name}</Text><Text fz="xs" c="dimmed">{r.result!.address}{r.result!.source === 'demo' ? ' · dữ liệu mẫu' : ''}</Text></>}
                      {(r.status === 'notfound' || r.status === 'error') && <Text fz="sm" c="red.7">{r.status === 'notfound' ? 'Không tìm thấy' : r.error}</Text>}
                      {r.status === 'invalid' && <Text fz="sm" c="dimmed">{(r.check as { reason: string }).reason}</Text>}
                    </Table.Td>
                    <Table.Td>{r.result?.status ? <Badge color={STATUS[r.result.status].color}>{STATUS[r.result.status].label}</Badge> : r.status === 'ok' ? <Badge color="gray">Chưa rõ</Badge> : null}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </SectionCard>
      )}
    </Stack>
  );
}

export default function LookupPage() {
  return (
    <>
      <PageHeader title="Tra cứu mã số thuế" subtitle="Kiểm tra MST hợp lệ, tên và địa chỉ doanh nghiệp — tra một mã hoặc cả danh sách nhà cung cấp." />
      <Tabs defaultValue="quick" variant="outline" keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="quick" leftSection={<IconSearch size={16} />}>Tra cứu nhanh</Tabs.Tab>
          <Tabs.Tab value="batch" leftSection={<IconListSearch size={16} />}>Tra cứu hàng loạt</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="quick"><QuickLookup /></Tabs.Panel>
        <Tabs.Panel value="batch"><BatchLookup /></Tabs.Panel>
      </Tabs>
    </>
  );
}
