'use client';

import {
  Badge, Box, Button, CopyButton, Divider, Drawer, Group, Paper, ScrollArea, SimpleGrid, Stack, Table, Text,
  ThemeIcon, Timeline, Tooltip, ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCheck, IconCloudDownload, IconCopy, IconFileTypePdf, IconFileTypeXml, IconShieldCheck, IconShieldExclamation, IconSend,
} from '@tabler/icons-react';
import { STATUS_META, type Invoice } from '@/lib/data';
import { dateVN, vnd } from '@/lib/format';
import { useStore } from '@/lib/store';

export function InvoiceDrawer({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { active } = useStore();
  const inv = invoice;
  return (
    <Drawer opened={!!inv} onClose={onClose} position="right" size="xl" title={<Text fw={800}>Chi tiết hoá đơn</Text>} scrollAreaComponent={ScrollArea.Autosize}>
      {inv && (
        <Stack gap="lg">
          <Paper p="lg" radius="md" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,.10), rgba(37,99,235,.02))', border: '1px solid rgba(37,99,235,.2)' }}>
            <Group justify="space-between" align="flex-start">
              <Box>
                <Group gap={6}>
                  <Badge color={inv.direction === 'in' ? 'iris' : 'volt'} variant={inv.direction === 'in' ? 'light' : 'filled'} c={inv.direction === 'out' ? 'dark.9' : undefined}>
                    {inv.direction === 'in' ? 'Đầu vào' : 'Đầu ra'}
                  </Badge>
                  <Badge color={STATUS_META[inv.status].color}>{STATUS_META[inv.status].label}</Badge>
                </Group>
                <Group gap={4} mt="sm">
                  <Text className="mono" fz="lg" fw={700}>{inv.symbol} · {inv.number}</Text>
                  <CopyButton value={inv.number}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Đã chép' : 'Chép số HĐ'}>
                        <ActionIcon variant="subtle" size="sm" onClick={copy}>{copied ? <IconCheck size={14} /> : <IconCopy size={14} />}</ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
                <Text fz="sm" c="dimmed">Ngày lập {dateVN(inv.issuedAt)}</Text>
              </Box>
              <Box ta="right">
                <Text fz="xs" c="dimmed">Tổng thanh toán</Text>
                <Text fz={28} fw={800} className="tnum" lts={-0.5}>{vnd(inv.total)}</Text>
              </Box>
            </Group>
          </Paper>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Paper withBorder p="md" radius="md">
              <Text fz="xs" c="dimmed" tt="uppercase" fw={700} lts={1}>Người bán</Text>
              <Text fw={700} mt={4}>{inv.direction === 'in' ? inv.partnerName : active.name}</Text>
              <Text fz="sm" className="mono" c="dimmed">MST {inv.direction === 'in' ? inv.partnerTax : active.taxCode}</Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Text fz="xs" c="dimmed" tt="uppercase" fw={700} lts={1}>Người mua</Text>
              <Text fw={700} mt={4}>{inv.direction === 'out' ? inv.partnerName : active.name}</Text>
              <Text fz="sm" className="mono" c="dimmed">MST {inv.direction === 'out' ? inv.partnerTax : active.taxCode}</Text>
            </Paper>
          </SimpleGrid>

          <Paper withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            <Table.ScrollContainer minWidth={520}>
              <Table verticalSpacing="sm" horizontalSpacing="md" striped>
                <Table.Thead>
                  <Table.Tr><Table.Th>Hàng hoá, dịch vụ</Table.Th><Table.Th ta="right">SL</Table.Th><Table.Th ta="right">Đơn giá</Table.Th><Table.Th ta="right">Thành tiền</Table.Th></Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {inv.items.map((it, i) => (
                    <Table.Tr key={i}>
                      <Table.Td><Text fz="sm" fw={600}>{it.name}</Text><Text fz="xs" c="dimmed">ĐVT: {it.unit}</Text></Table.Td>
                      <Table.Td ta="right" className="tnum">{it.qty.toLocaleString('vi-VN')}</Table.Td>
                      <Table.Td ta="right" className="tnum">{it.price.toLocaleString('vi-VN')}</Table.Td>
                      <Table.Td ta="right" className="tnum" fw={700}>{(it.qty * it.price).toLocaleString('vi-VN')}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            <Stack gap={6} p="md" style={{ borderTop: '1px solid var(--ihx-border)' }}>
              <Row label="Cộng tiền hàng" value={vnd(inv.preTax)} />
              {inv.discount > 0 && <Row label="Chiết khấu thương mại" value={'- ' + vnd(inv.discount)} />}
              <Row label={`Thuế GTGT (${inv.vatRate}%)`} value={vnd(inv.vat)} />
              <Divider />
              <Row label="Tổng thanh toán" value={vnd(inv.total)} bold />
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Group gap="sm" mb="sm">
              <ThemeIcon variant="light" color={inv.risk === 'none' ? 'teal' : 'orange'} radius="md">
                {inv.risk === 'none' ? <IconShieldCheck size={18} /> : <IconShieldExclamation size={18} />}
              </ThemeIcon>
              <Text fw={700}>Kiểm tra tự động</Text>
            </Group>
            <Timeline bulletSize={18} lineWidth={2} active={4}>
              <Timeline.Item color="teal" title="Chữ ký số hợp lệ"><Text fz="xs" c="dimmed">Đã xác thực với chứng thư người bán</Text></Timeline.Item>
              <Timeline.Item color="teal" title="Đã cấp mã CQT"><Text fz="xs" c="dimmed">Khớp dữ liệu cổng hoá đơn điện tử</Text></Timeline.Item>
              <Timeline.Item color={inv.risk === 'none' ? 'teal' : inv.risk === 'high' ? 'red' : 'yellow'} title="Tình trạng MST đối tác">
                <Text fz="xs" c="dimmed">{inv.risk === 'none' ? 'Đang hoạt động bình thường' : inv.risk === 'high' ? 'Ngừng hoạt động / bỏ địa chỉ kinh doanh' : 'Tạm ngừng kinh doanh có thời hạn'}</Text>
              </Timeline.Item>
              <Timeline.Item color={inv.paid ? 'teal' : 'gray'} title={inv.paid ? 'Đã thanh toán' : 'Chưa ghi nhận thanh toán'}>
                <Text fz="xs" c="dimmed">{inv.total >= 5_000_000 ? 'Từ 5 triệu — cần chứng từ thanh toán không dùng tiền mặt để khấu trừ' : 'Dưới ngưỡng 5 triệu'}</Text>
              </Timeline.Item>
            </Timeline>
          </Paper>

          <Group grow>
            <Button variant="default" leftSection={<IconFileTypeXml size={18} />} onClick={() => notifications.show({ title: 'Đang tải XML', message: `${inv.number}.xml`, color: 'iris' })}>Tải XML</Button>
            <Button variant="default" leftSection={<IconFileTypePdf size={18} />} onClick={() => notifications.show({ title: 'Đang tải PDF', message: `${inv.number}.pdf`, color: 'iris' })}>Tải PDF</Button>
          </Group>
          <Group grow>
            <Button variant="light" leftSection={<IconSend size={18} />}>Gửi cho kế toán</Button>
            <Button className="volt-btn" leftSection={<IconCloudDownload size={18} />}>Lấy bản gốc</Button>
          </Group>
        </Stack>
      )}
    </Drawer>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Group justify="space-between">
      <Text fz="sm" c={bold ? undefined : 'dimmed'} fw={bold ? 800 : 400}>{label}</Text>
      <Text fz={bold ? 'lg' : 'sm'} fw={bold ? 900 : 600} className="tnum">{value}</Text>
    </Group>
  );
}
