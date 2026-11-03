'use client';

import {
  ActionIcon, Alert, Badge, Box, Button, Code, Divider, Grid, Group, Paper, ScrollArea, SimpleGrid, Stack, Table,
  Tabs, Text, ThemeIcon, Tooltip, UnstyledButton,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle, IconCircleCheck, IconCircleX, IconCode, IconDownload, IconFileInvoice, IconFileSpreadsheet,
  IconFileTypeXml, IconInfoCircle, IconListCheck, IconSignature, IconTrash, IconUpload, IconX,
} from '@tabler/icons-react';
import { useState } from 'react';
import { PageHeader, SectionCard } from '@/components/AppFrame';
import { dateVN, timeVN, vnd } from '@/lib/format';
import { useStore } from '@/lib/store';
import { KIND_LABEL, parseInvoiceXml, RATE_LABEL, SAMPLE_XML, XmlInvoiceError, type Check, type ParsedInvoice } from '@/lib/xmlInvoice';

type Failed = { id: string; fileName: string; error: string };

const LEVEL = {
  ok: { color: 'teal', icon: IconCircleCheck },
  warn: { color: 'orange', icon: IconAlertTriangle },
  error: { color: 'red', icon: IconCircleX },
  info: { color: 'blue', icon: IconInfoCircle },
} as const;

const n = (v: number) => v.toLocaleString('vi-VN', { maximumFractionDigits: 4 });

function verdict(checks: Check[]) {
  if (checks.some((c) => c.level === 'error')) return { color: 'red', label: 'Có lỗi' };
  if (checks.some((c) => c.level === 'warn')) return { color: 'orange', label: 'Cần xem' };
  return { color: 'teal', label: 'Hợp lệ' };
}

function download(name: string, content: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}

function itemsCsv(list: ParsedInvoice[]) {
  const head = ['Ký hiệu', 'Số HĐ', 'Ngày lập', 'MST bán', 'Người bán', 'MST mua', 'Người mua', 'STT', 'Tính chất', 'Mã hàng', 'Tên hàng hoá, dịch vụ', 'ĐVT', 'Số lượng', 'Đơn giá', 'Chiết khấu', 'Thành tiền', 'Thuế suất'];
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = list.flatMap((p) => p.items.map((i) => [p.general.symbol, p.general.number, p.general.issuedAt, p.seller.taxCode, q(p.seller.name), p.buyer.taxCode, q(p.buyer.name), i.stt, KIND_LABEL(i.kind), i.code, q(i.name), i.unit, i.qty, i.price, i.discount, i.amount, i.vatRate].join(',')));
  return '﻿' + [head.join(','), ...rows].join('\n');
}

function PartyBox({ title, p }: { title: string; p: ParsedInvoice['seller'] }) {
  const rows: [string, string | undefined][] = [
    ['Mã số thuế', p.taxCode], ['Địa chỉ', p.address], ['Người mua hàng', p.buyerName], ['Mã khách hàng', p.customerCode],
    ['Điện thoại', p.phone], ['Email', p.email], ['Số tài khoản', p.bankAccount ? `${p.bankAccount}${p.bankName ? ' — ' + p.bankName : ''}` : undefined],
  ];
  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Text fz="xs" c="dimmed" fw={500} tt="uppercase" lts={0.5}>{title}</Text>
      <Text fw={500} mt={4} mb={6}>{p.name || '—'}</Text>
      <Stack gap={4}>
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <Group key={k} gap={8} wrap="nowrap" align="flex-start">
            <Text fz="xs" c="dimmed" w={100} style={{ flexShrink: 0 }}>{k}</Text>
            <Text fz="sm" className={k === 'Mã số thuế' || k === 'Số tài khoản' ? 'mono' : undefined}>{v}</Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

function InvoiceView({ inv }: { inv: ParsedInvoice }) {
  const { companies } = useStore();
  const g = inv.general;
  const mine = companies.find((c) => c.taxCode === inv.buyer.taxCode) ? 'Đầu vào' : companies.find((c) => c.taxCode === inv.seller.taxCode) ? 'Đầu ra' : null;
  const v = verdict(inv.checks);
  const issues = inv.checks.filter((c) => c.level === 'error' || c.level === 'warn').length;

  return (
    <Paper className="glass" withBorder radius="md" style={{ overflow: 'hidden' }}>
      {/* Đầu hoá đơn */}
      <Box p={20} style={{ borderBottom: '1px solid var(--ihx-border)' }}>
        <Group justify="space-between" align="flex-start" gap="md">
          <Box>
            <Group gap={8} mb={4}>
              <Badge color={v.color} size="lg">{v.label}</Badge>
              {mine && <Badge color={mine === 'Đầu vào' ? 'iris' : 'volt'} size="lg">{mine}</Badge>}
              {g.adjusts && <Badge color="yellow" size="lg">{g.adjusts.split(' ')[0]}</Badge>}
            </Group>
            <Text fw={500} fz="xl">{g.name || 'Hoá đơn điện tử'}</Text>
            <Text fz="sm" c="dimmed">{inv.fileName}</Text>
          </Box>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg" verticalSpacing={6}>
            {[['Mẫu số', g.template], ['Ký hiệu', g.symbol], ['Số', g.number], ['Ngày lập', g.issuedAt ? dateVN(g.issuedAt) : '—']].map(([k, val]) => (
              <Box key={k}><Text fz="xs" c="dimmed">{k}</Text><Text fw={500} className="mono">{val || '—'}</Text></Box>
            ))}
          </SimpleGrid>
        </Group>
        <Group gap="lg" mt="sm">
          <Text fz="xs" c="dimmed">Mã CQT: <Text span className="mono" c={inv.cqtCode ? undefined : 'dimmed'}>{inv.cqtCode || 'không có'}</Text></Text>
          <Text fz="xs" c="dimmed">Thanh toán: {g.payment || '—'}</Text>
          <Text fz="xs" c="dimmed">Tiền tệ: {g.currency}{g.exchangeRate !== 1 ? ` · tỷ giá ${n(g.exchangeRate)}` : ''}</Text>
          {g.version && <Text fz="xs" c="dimmed">Phiên bản XML: {g.version}</Text>}
        </Group>
      </Box>

      <Tabs defaultValue="invoice" variant="default">
        <Tabs.List px={12}>
          <Tabs.Tab value="invoice" leftSection={<IconFileInvoice size={16} />}>Nội dung hoá đơn</Tabs.Tab>
          <Tabs.Tab value="checks" leftSection={<IconListCheck size={16} />} rightSection={issues ? <Badge size="xs" color="orange" circle>{issues}</Badge> : null}>Kiểm tra</Tabs.Tab>
          <Tabs.Tab value="sign" leftSection={<IconSignature size={16} />}>Chữ ký số ({inv.signatures.length})</Tabs.Tab>
          <Tabs.Tab value="raw" leftSection={<IconCode size={16} />}>XML gốc</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="invoice" p={20}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="md">
            <PartyBox title="Đơn vị bán hàng" p={inv.seller} />
            <PartyBox title="Người mua hàng" p={inv.buyer} />
          </SimpleGrid>

          <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
            <Table.ScrollContainer minWidth={760}>
              <Table verticalSpacing={8} horizontalSpacing="sm" striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={44}>STT</Table.Th><Table.Th>Tên hàng hoá, dịch vụ</Table.Th><Table.Th w={70}>ĐVT</Table.Th>
                    <Table.Th ta="right" w={90}>Số lượng</Table.Th><Table.Th ta="right" w={120}>Đơn giá</Table.Th>
                    <Table.Th ta="right" w={110}>Chiết khấu</Table.Th><Table.Th ta="right" w={130}>Thành tiền</Table.Th><Table.Th ta="center" w={80}>Thuế suất</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {inv.items.map((i, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{i.stt || idx + 1}</Table.Td>
                      <Table.Td>
                        <Text fz="sm" fw={500}>{i.name}</Text>
                        <Group gap={6}>
                          {i.code && <Text fz="xs" c="dimmed" className="mono">{i.code}</Text>}
                          {i.kind !== '1' && <Badge size="xs" color={i.kind === '3' ? 'orange' : 'gray'}>{KIND_LABEL(i.kind)}</Badge>}
                        </Group>
                      </Table.Td>
                      <Table.Td fz="sm">{i.unit}</Table.Td>
                      <Table.Td ta="right" className="tnum" fz="sm">{i.qty ? n(i.qty) : ''}</Table.Td>
                      <Table.Td ta="right" className="tnum" fz="sm">{i.price ? n(i.price) : ''}</Table.Td>
                      <Table.Td ta="right" className="tnum" fz="sm">{i.discount ? n(i.discount) : ''}</Table.Td>
                      <Table.Td ta="right" className="tnum" fz="sm" fw={500} c={i.kind === '3' ? 'orange.8' : undefined}>{i.kind === '3' ? '−' : ''}{n(i.amount)}</Table.Td>
                      <Table.Td ta="center" fz="sm">{i.vatRate}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          <Grid gap="md" mt="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              {inv.taxByRate.length > 0 && (
                <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                  <Table verticalSpacing={6} horizontalSpacing="sm">
                    <Table.Thead><Table.Tr><Table.Th>Thuế suất</Table.Th><Table.Th ta="right">Tiền hàng</Table.Th><Table.Th ta="right">Tiền thuế</Table.Th></Table.Tr></Table.Thead>
                    <Table.Tbody>
                      {inv.taxByRate.map((r) => (
                        <Table.Tr key={r.rate}><Table.Td fz="sm">{RATE_LABEL(r.rate)}</Table.Td><Table.Td ta="right" className="tnum" fz="sm">{n(r.amount)}</Table.Td><Table.Td ta="right" className="tnum" fz="sm">{n(r.vat)}</Table.Td></Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              )}
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder radius="md" p="md">
                {[
                  ['Cộng tiền hàng (chưa thuế)', inv.totals.preTax],
                  ['Tiền thuế GTGT', inv.totals.vat],
                  ...(inv.totals.fees ? [['Phí, lệ phí', inv.totals.fees]] : []),
                  ...(inv.totals.discount ? [['Chiết khấu thương mại', -inv.totals.discount]] : []),
                ].map(([k, val]) => (
                  <Group key={k as string} justify="space-between" py={4}><Text fz="sm" c="dimmed">{k}</Text><Text fz="sm" fw={500} className="tnum">{n(val as number)}</Text></Group>
                ))}
                <Divider my={6} />
                <Group justify="space-between"><Text fw={500}>Tổng thanh toán</Text><Text fw={500} fz="xl" className="tnum">{n(inv.totals.total)} <Text span fz="sm" c="dimmed">{g.currency}</Text></Text></Group>
                {inv.totals.words && <Text fz="sm" fs="italic" c="dimmed" mt={4}>Bằng chữ: {inv.totals.words}</Text>}
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="checks" p={20}>
          <Stack gap={8}>
            {inv.checks.map((c, i) => {
              const L = LEVEL[c.level];
              return (
                <Group key={i} gap="sm" wrap="nowrap" align="flex-start" p="sm" style={{ border: '1px solid var(--ihx-border)', borderRadius: 8, borderLeft: `3px solid var(--mantine-color-${L.color}-6)` }}>
                  <L.icon size={18} color={`var(--mantine-color-${L.color}-6)`} style={{ flexShrink: 0, marginTop: 1 }} />
                  <Box>
                    <Text fz="sm" fw={500}>{c.title}</Text>
                    {c.detail && <Text fz="xs" c="dimmed" style={{ wordBreak: 'break-word' }}>{c.detail}</Text>}
                  </Box>
                </Group>
              );
            })}
          </Stack>
          <Text fz="xs" c="dimmed" mt="md">Kiểm tra dựa trên nội dung file. Chưa xác thực mật mã chữ ký số và chưa đối chiếu với dữ liệu trên cổng của cơ quan thuế.</Text>
        </Tabs.Panel>

        <Tabs.Panel value="sign" p={20}>
          {inv.signatures.length === 0 ? (
            <Alert color="orange" icon={<IconAlertTriangle size={18} />}>File không chứa chữ ký số.</Alert>
          ) : (
            <Stack gap="sm">
              {inv.signatures.map((s, i) => (
                <Paper key={i} withBorder radius="md" p="md">
                  <Group justify="space-between" mb={4}><Badge>{s.role}</Badge><Text fz="xs" c="dimmed">{s.signingTime ? `Ký lúc ${timeVN(s.signingTime)} ${new Date(s.signingTime).getFullYear()}` : 'Không có thời điểm ký'}</Text></Group>
                  <Text fz="sm" className="mono" style={{ wordBreak: 'break-word' }}>{s.subject || '(không có thông tin chứng thư)'}</Text>
                </Paper>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="raw" p={20}>
          <Group justify="flex-end" mb="sm">
            <Button size="xs" variant="default" leftSection={<IconDownload size={14} />} onClick={() => download(inv.fileName, inv.raw, 'application/xml')}>Tải file XML</Button>
          </Group>
          <ScrollArea.Autosize mah={480}><Code block fz={12}>{inv.raw}</Code></ScrollArea.Autosize>
        </Tabs.Panel>
      </Tabs>

      <Group justify="flex-end" gap="sm" p="md" style={{ borderTop: '1px solid var(--ihx-border)' }}>
        <Button variant="default" leftSection={<IconFileSpreadsheet size={16} />} onClick={() => download(`${g.symbol}-${g.number}.csv`, itemsCsv([inv]), 'text/csv;charset=utf-8')}>Xuất dòng hàng ra Excel</Button>
        <Button leftSection={<IconFileInvoice size={16} />} onClick={() => notifications.show({ color: 'teal', title: 'Đã thêm vào kho hoá đơn', message: `${g.symbol} · ${g.number} (bản demo chưa lưu thật)` })}>Thêm vào kho hoá đơn</Button>
      </Group>
    </Paper>
  );
}

export default function XmlReaderPage() {
  const [list, setList] = useState<ParsedInvoice[]>([]);
  const [failed, setFailed] = useState<Failed[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const addRaw = (items: { name: string; text: string }[]) => {
    const ok: ParsedInvoice[] = [];
    const bad: Failed[] = [];
    for (const it of items) {
      try { ok.push(parseInvoiceXml(it.text, it.name)); }
      catch (e) { bad.push({ id: it.name + Math.random(), fileName: it.name, error: e instanceof XmlInvoiceError ? e.message : 'Không đọc được file.' }); }
    }
    setList((l) => [...ok, ...l]);
    setFailed((f) => [...bad, ...f]);
    if (ok[0]) setActiveId(ok[0].id);
  };

  const onDrop = async (files: File[]) => addRaw(await Promise.all(files.map(async (f) => ({ name: f.name, text: await f.text() }))));
  const current = list.find((x) => x.id === activeId) ?? list[0];
  const sumTotal = list.reduce((s, x) => s + x.totals.total, 0);

  return (
    <>
      <PageHeader
        title="Đọc hoá đơn XML"
        subtitle="Tải lên file XML hoá đơn điện tử (chuẩn Thông tư 78) để xem nội dung, kiểm tra số liệu và xuất Excel. File được đọc ngay trên trình duyệt, không gửi lên máy chủ."
        right={list.length > 0 ? (
          <>
            <Button variant="default" leftSection={<IconFileSpreadsheet size={16} />} onClick={() => download('hoa-don-xml.csv', itemsCsv(list), 'text/csv;charset=utf-8')}>Xuất Excel tất cả</Button>
            <Button variant="subtle" color="red" leftSection={<IconTrash size={16} />} onClick={() => { setList([]); setFailed([]); }}>Xoá hết</Button>
          </>
        ) : null}
      />

      <Dropzone
        onDrop={onDrop}
        onReject={() => notifications.show({ color: 'red', title: 'File không được hỗ trợ', message: 'Chỉ nhận file .xml, tối đa 5 MB mỗi file.' })}
        accept={{ 'text/xml': ['.xml'], 'application/xml': ['.xml'] }}
        maxSize={5 * 1024 * 1024}
        multiple
        radius="md"
        mb="md"
        p="lg"
        style={{ borderWidth: 2, background: 'var(--ihx-surface)' }}
      >
        <Group justify="center" gap="lg" mih={list.length ? 60 : 140} style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept><ThemeIcon size={52} radius="md" color="teal" variant="light"><IconUpload size={28} /></ThemeIcon></Dropzone.Accept>
          <Dropzone.Reject><ThemeIcon size={52} radius="md" color="red" variant="light"><IconX size={28} /></ThemeIcon></Dropzone.Reject>
          <Dropzone.Idle><ThemeIcon size={52} radius="md" variant="light"><IconFileTypeXml size={28} /></ThemeIcon></Dropzone.Idle>
          <Box>
            <Text fw={500} fz="lg">Kéo thả file XML vào đây, hoặc bấm để chọn</Text>
            <Text fz="sm" c="dimmed">Chọn được nhiều file cùng lúc · tối đa 5 MB/file</Text>
          </Box>
        </Group>
      </Dropzone>

      {list.length === 0 && (
        <Group justify="center" gap="sm" mb="md">
          <Text fz="sm" c="dimmed">Chưa có file?</Text>
          <Button variant="light" size="xs" onClick={() => addRaw([{ name: 'hoa-don-mau.xml', text: SAMPLE_XML }])}>Mở hoá đơn mẫu</Button>
          <Button variant="default" size="xs" leftSection={<IconDownload size={14} />} onClick={() => download('hoa-don-mau.xml', SAMPLE_XML, 'application/xml')}>Tải file mẫu</Button>
        </Group>
      )}

      {failed.length > 0 && (
        <Stack gap={6} mb="md">
          {failed.map((f) => (
            <Alert key={f.id} color="red" icon={<IconCircleX size={18} />} p="sm" withCloseButton onClose={() => setFailed((x) => x.filter((y) => y.id !== f.id))}>
              <Text fz="sm"><b>{f.fileName}</b>: {f.error}</Text>
            </Alert>
          ))}
        </Stack>
      )}

      {list.length > 0 && current && (
        <Grid gap="md">
          {list.length > 1 && (
            <Grid.Col span={{ base: 12, lg: 3 }}>
              <SectionCard title={`${list.length} hoá đơn`} description={`Tổng thanh toán ${vnd(sumTotal)}`} noPadding>
                <ScrollArea.Autosize mah={640}>
                  {list.map((x) => {
                    const v = verdict(x.checks);
                    const on = x.id === current.id;
                    return (
                      <UnstyledButton key={x.id} onClick={() => setActiveId(x.id)} w="100%" px={16} py={10} style={{ borderTop: '1px solid var(--ihx-border)', background: on ? 'var(--mantine-color-iris-light)' : undefined }}>
                        <Group justify="space-between" wrap="nowrap" gap="xs">
                          <Box style={{ minWidth: 0 }}>
                            <Text fz="sm" fw={500} className="mono">{x.general.symbol} · {x.general.number}</Text>
                            <Text fz="xs" c="dimmed" truncate>{x.seller.name}</Text>
                          </Box>
                          <Tooltip label={v.label}><Box w={10} h={10} style={{ borderRadius: 99, flexShrink: 0, background: `var(--mantine-color-${v.color}-6)` }} /></Tooltip>
                        </Group>
                        <Group justify="space-between" mt={2}>
                          <Text fz="xs" c="dimmed">{x.general.issuedAt ? dateVN(x.general.issuedAt) : ''}</Text>
                          <Text fz="xs" fw={500} className="tnum">{n(x.totals.total)}</Text>
                        </Group>
                      </UnstyledButton>
                    );
                  })}
                </ScrollArea.Autosize>
              </SectionCard>
            </Grid.Col>
          )}
          <Grid.Col span={{ base: 12, lg: list.length > 1 ? 9 : 12 }}>
            <Group justify="flex-end" mb={8} gap={4}>
              <Tooltip label="Bỏ file này">
                <ActionIcon variant="subtle" color="gray" onClick={() => setList((l) => l.filter((x) => x.id !== current.id))} aria-label="Bỏ file"><IconTrash size={16} /></ActionIcon>
              </Tooltip>
            </Group>
            <InvoiceView inv={current} />
          </Grid.Col>
        </Grid>
      )}
    </>
  );
}
