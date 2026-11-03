'use client';

import {
  Accordion, Badge, Box, Button, Card, Grid, Group, List, Paper, RingProgress, SimpleGrid, Stack, Table, Text, ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { IconCheck, IconCircleCheckFilled, IconCrown, IconMinus, IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import { PageHeader } from '@/components/AppFrame';
import { CheckoutModal } from '@/components/CheckoutModal';
import { DURATIONS, PAYMENTS, PLANS, priceOf, type PlanId } from '@/lib/data';
import { dateVN, vnd } from '@/lib/format';
import { useStore } from '@/lib/store';

const COMPARE: [string, string | boolean, string | boolean, string | boolean][] = [
  ['Số mã số thuế', '1', 'Không giới hạn', 'Không giới hạn'],
  ['Lượt tải hoá đơn gốc', '100 / tháng', 'Không giới hạn', 'Không giới hạn'],
  ['Đồng bộ tự động', 'Thủ công', 'Trên máy tính', 'Cloud 24/7'],
  ['Cảnh báo MST rủi ro', false, true, true],
  ['Xuất Excel / XML hàng loạt', false, true, true],
  ['Đối soát với sổ sách kế toán', false, false, true],
  ['Thông báo Email & Zalo', false, false, true],
  ['Lưu trữ', '12 tháng', '10 năm', '10 năm'],
  ['Hỗ trợ', 'Cộng đồng', 'Giờ hành chính', 'Ưu tiên 1-1'],
];

function MembershipCard() {
  const { plan, user } = useStore();
  const now = new Date('2026-11-03').getTime();
  const end = new Date(plan.expiresAt).getTime();
  const start = new Date(plan.startedAt).getTime();
  const left = Math.max(0, Math.ceil((end - now) / 86400000));
  const pct = Math.max(0, Math.min(100, ((end - now) / (end - start)) * 100));
  const name = PLANS.find((p) => p.id === plan.id)!.name;
  return (
    <Paper p="xl" radius={28} style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(125deg, #0f1f3d 0%, #1e3a8a 45%, #2563eb 100%)', color: '#fff', border: '1px solid rgba(255,255,255,.12)' }}>
      <Box style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,.45), transparent 70%)' }} />
      <Group justify="space-between" align="flex-start" style={{ position: 'relative' }} wrap="nowrap">
        <Box>
          <Group gap="xs"><IconCrown size={18} color="#f59e0b" /><Text fz="xs" tt="uppercase" fw={500} lts={2} opacity={0.8}>Thẻ thành viên</Text></Group>
          <Text fz={44} fw={500} lh={1.1} mt="sm" lts={-0.5}>{name}</Text>
          <Text opacity={0.75} fz="sm">{user.email}</Text>
          <Group mt="xl" gap="xl">
            <Box><Text fz={11} opacity={0.6} tt="uppercase" fw={500}>Bắt đầu</Text><Text fw={500} className="mono">{dateVN(plan.startedAt)}</Text></Box>
            <Box><Text fz={11} opacity={0.6} tt="uppercase" fw={500}>Hết hạn</Text><Text fw={500} className="mono">{dateVN(plan.expiresAt)}</Text></Box>
          </Group>
        </Box>
        <RingProgress
          size={130} thickness={10} roundCaps
          sections={[{ value: pct, color: '#f59e0b' }]}
          rootColor="rgba(255,255,255,.15)"
          label={<Box ta="center"><Text fz={30} fw={500} lh={1} c="white">{left}</Text><Text fz={11} c="rgba(255,255,255,.7)">ngày còn lại</Text></Box>}
        />
      </Group>
      <Text fz="xs" opacity={0.6} mt="lg" style={{ position: 'relative' }}>Hết hạn, tài khoản tự chuyển về Starter — dữ liệu vẫn được giữ nguyên.</Text>
    </Paper>
  );
}

export default function BillingPage() {
  const { plan } = useStore();
  const [months, setMonths] = useState(12);
  const [checkout, setCheckout] = useState<PlanId | null>(null);

  return (
    <>
      <PageHeader eyebrow="Gói dịch vụ" title={<>Đầu tư một lần, <span className="gradient-text">nhẹ đầu cả năm</span></>} subtitle="Giá đã gồm VAT, thanh toán một lần, không tự động gia hạn. Thời hạn càng dài, ưu đãi càng sâu — tối đa 65%." />

      <Grid gap="md" mb="xl">
        <Grid.Col span={{ base: 12, lg: 7 }}><MembershipCard /></Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Card className="glass" p="lg" h="100%">
            <Text fw={500} mb="sm">Bạn đang dùng</Text>
            <SimpleGrid cols={2}>
              {[['MST đã kết nối', '3 / ∞'], ['Lượt tải tháng này', '312'], ['Dung lượng Cloud', '1,8 GB'], ['Thiết bị', '3']].map(([k, v]) => (
                <Paper key={k} withBorder p="sm" radius="md"><Text fz="xs" c="dimmed">{k}</Text><Text fw={500} fz="lg" className="tnum">{v}</Text></Paper>
              ))}
            </SimpleGrid>
            <Button mt="md" fullWidth className="volt-btn" onClick={() => setCheckout(plan.id === 'free' ? 'pro' : plan.id)} leftSection={<IconSparkles size={16} />}>
              Gia hạn {PLANS.find((p) => p.id === plan.id)!.name} {months} tháng
            </Button>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Duration picker */}
      <Paper className="glass" withBorder p="md" radius="md" mb="lg">
        <Group justify="space-between" mb="sm" px={4}>
          <Text fw={500}>Chọn thời hạn</Text>
          <Text fz="sm" c="dimmed">Áp dụng cho mọi gói trả phí</Text>
        </Group>
        <SimpleGrid cols={{ base: 3, sm: 6 }} spacing="xs">
          {DURATIONS.map((d) => {
            const on = d.months === months;
            return (
              <UnstyledButton key={d.months} onClick={() => setMonths(d.months)} p="sm" style={{
                borderRadius: 16, textAlign: 'center', position: 'relative',
                background: on ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : 'transparent',
                border: `1px solid ${on ? 'transparent' : 'var(--ihx-border)'}`, color: on ? '#fff' : undefined, transition: 'all 150ms',
              }}>
                {d.tag && <Badge size="xs" variant="filled" color={d.months === 36 ? 'volt' : 'pink'} c={d.months === 36 ? 'dark.9' : undefined} style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{d.tag}</Badge>}
                <Text fw={500} fz="xl" lh={1.2}>{d.months}</Text>
                <Text fz="xs" opacity={0.75}>tháng</Text>
                <Text fz="xs" fw={500} c={on ? '#fde68a' : 'teal.7'} mt={2}>-{d.discount}%</Text>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
        {PLANS.map((p) => {
          const pr = p.base ? priceOf(p.base, months) : null;
          const current = plan.id === p.id;
          const featured = p.id === 'plus';
          return (
            <Card key={p.id} p="lg" className="glass lift" style={featured ? { borderColor: 'var(--mantine-color-iris-7)', borderWidth: 2, boxShadow: '0 12px 32px -16px rgba(30,58,138,.45)', borderTop: '5px solid var(--mantine-color-volt-5)' } : undefined}>
              <Group justify="space-between">
                <Text fw={500} fz={22}>{p.name}</Text>
                {current ? <Badge color="teal" variant="filled">Đang dùng</Badge> : p.highlight ? <Badge color="volt" variant="light" >{p.highlight}</Badge> : null}
              </Group>
              <Text fz="sm" c="dimmed" mih={40}>{p.tagline}</Text>
              <Box my="lg">
                {pr ? (
                  <>
                    <Group gap={8} align="baseline">
                      <Text fz={40} fw={500} lts={-0.5} className="tnum">{Math.round(pr.perMonth / 1000)}k</Text>
                      <Text c="dimmed">/tháng</Text>
                    </Group>
                    <Group gap={8}>
                      <Text fz="sm" td="line-through" c="dimmed" className="tnum">{vnd(pr.original)}</Text>
                      <Text fz="sm" fw={500} className="tnum">{vnd(pr.total)}</Text>
                    </Group>
                    <Badge mt={8} color="teal" variant="light">Tiết kiệm {vnd(pr.saved)}</Badge>
                  </>
                ) : (
                  <>
                    <Text fz={40} fw={500} lts={-0.5}>0 ₫</Text>
                    <Text fz="sm" c="dimmed">Miễn phí trọn đời</Text>
                    <Badge mt={8} color="gray" variant="light">Mặc định khi đăng ký</Badge>
                  </>
                )}
              </Box>
              <List spacing="sm" size="sm" mb="xl" icon={<ThemeIcon size={20} radius="xl" color="iris" variant={featured ? 'filled' : 'light'}><IconCheck size={12} stroke={3} /></ThemeIcon>} style={{ flex: 1 }}>
                {p.features.map((f) => <List.Item key={f}>{f}</List.Item>)}
              </List>
              {p.id === 'free' ? (
                <Button variant="default" fullWidth size="md" disabled>{current ? 'Gói hiện tại' : 'Tự quay về khi hết hạn'}</Button>
              ) : (
                <Button fullWidth size="md" variant={featured || current ? 'filled' : 'light'} onClick={() => setCheckout(p.id)}>
                  {current ? `Gia hạn ${months} tháng` : `Chọn ${p.name} ${months} tháng`}
                </Button>
              )}
            </Card>
          );
        })}
      </SimpleGrid>

      <Card className="glass" p={0} mb="xl">
        <Text fw={500} fz="lg" p="lg" pb={0}>So sánh chi tiết</Text>
        <Table.ScrollContainer minWidth={640}>
          <Table verticalSpacing="md" horizontalSpacing="lg" striped>
            <Table.Thead><Table.Tr><Table.Th>Tính năng</Table.Th>{PLANS.map((p) => <Table.Th key={p.id} ta="center">{p.name}</Table.Th>)}</Table.Tr></Table.Thead>
            <Table.Tbody>
              {COMPARE.map(([f, ...vals]) => (
                <Table.Tr key={f}>
                  <Table.Td fw={500}>{f}</Table.Td>
                  {vals.map((v, i) => (
                    <Table.Td key={i} ta="center">
                      {v === true ? <IconCircleCheckFilled size={20} color="var(--mantine-color-teal-5)" /> : v === false ? <IconMinus size={18} opacity={0.3} /> : <Text fz="sm">{v}</Text>}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card className="glass" p={0} h="100%">
            <Text fw={500} fz="lg" p="lg" pb={0}>Lịch sử thanh toán</Text>
            <Table.ScrollContainer minWidth={640}>
              <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
                <Table.Thead><Table.Tr><Table.Th>Mã GD</Table.Th><Table.Th>Ngày</Table.Th><Table.Th>Gói</Table.Th><Table.Th ta="right">Số tiền</Table.Th><Table.Th /></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {PAYMENTS.map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td className="mono" fz="sm" style={{ whiteSpace: 'nowrap' }}>{p.id}</Table.Td>
                      <Table.Td fz="sm">{dateVN(p.date)}</Table.Td>
                      <Table.Td fz="sm">{p.plan}</Table.Td>
                      <Table.Td ta="right" fw={500} className="tnum" style={{ whiteSpace: 'nowrap' }}>{vnd(p.amount)}</Table.Td>
                      <Table.Td><Badge color="teal" variant="light" style={{ overflow: 'visible' }}>{p.status}</Badge></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Card className="glass" p="lg" h="100%">
            <Text fw={500} fz="lg" mb="sm">Câu hỏi thường gặp</Text>
            <Accordion variant="separated" radius="lg">
              <Accordion.Item value="a"><Accordion.Control>Gia hạn sớm có mất ngày còn lại?</Accordion.Control><Accordion.Panel>Không. Thời hạn mới được cộng nối tiếp vào ngày hết hạn hiện tại.</Accordion.Panel></Accordion.Item>
              <Accordion.Item value="b"><Accordion.Control>Nâng cấp Pro → Cloud+ thế nào?</Accordion.Control><Accordion.Panel>Số ngày Pro còn lại được quy đổi thành tiền và trừ thẳng vào đơn Cloud+.</Accordion.Panel></Accordion.Item>
              <Accordion.Item value="c"><Accordion.Control>Có xuất hoá đơn VAT không?</Accordion.Control><Accordion.Panel>Có. Nhập thông tin công ty ở bước thanh toán hoặc nhắn tư vấn viên.</Accordion.Panel></Accordion.Item>
              <Accordion.Item value="d"><Accordion.Control>Hết hạn thì dữ liệu ra sao?</Accordion.Control><Accordion.Panel>Tài khoản về Starter, toàn bộ hoá đơn vẫn được lưu, chỉ giới hạn tính năng.</Accordion.Panel></Accordion.Item>
            </Accordion>
          </Card>
        </Grid.Col>
      </Grid>

      <CheckoutModal planId={checkout} months={months} onClose={() => setCheckout(null)} />
    </>
  );
}
