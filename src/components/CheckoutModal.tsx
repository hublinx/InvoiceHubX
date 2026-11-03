'use client';

import {
  ActionIcon, Alert, Badge, Box, Button, CopyButton, Divider, Group, Modal, Paper, RingProgress, SimpleGrid, Stack,
  Stepper, Tabs, Text, TextInput, ThemeIcon, Tooltip,
} from '@mantine/core';
import { useInterval } from '@mantine/hooks';
import {
  IconBrandMessenger, IconBuildingBank, IconCheck, IconConfetti, IconCopy, IconDiscount2, IconMessageCircle, IconPhone, IconReceipt2,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { PLANS, priceOf, type PlanId } from '@/lib/data';
import { dateVN, vnd } from '@/lib/format';
import { useStore } from '@/lib/store';
import { FakeQr } from './FakeQr';

const COUPONS: Record<string, number> = { IHX10: 10, KETOAN2026: 15 };

function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <Group justify="space-between" wrap="nowrap" py={6}>
      <Text fz="sm" c="dimmed">{label}</Text>
      <Group gap={4} wrap="nowrap">
        <Text fz="sm" fw={500} className={mono ? 'mono' : undefined} ta="right">{value}</Text>
        <CopyButton value={value}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Đã chép' : 'Sao chép'}>
              <ActionIcon size="sm" variant={copied ? 'filled' : 'subtle'} color={copied ? 'teal' : 'gray'} onClick={copy}>{copied ? <IconCheck size={13} /> : <IconCopy size={13} />}</ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </Group>
  );
}

export function CheckoutModal({ planId, months, onClose }: { planId: PlanId | null; months: number; onClose: () => void }) {
  const { user, plan, setPlan } = useStore();
  const [step, setStep] = useState(0);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const [left, setLeft] = useState(15 * 60);
  const [checking, setChecking] = useState(false);
  const timer = useInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);

  const p = PLANS.find((x) => x.id === planId);
  const price = p ? priceOf(p.base, months) : null;
  const couponPct = applied ? COUPONS[applied]! : 0;
  const final = price ? Math.round((price.total * (100 - couponPct)) / 100 / 250) * 250 : 0;
  const orderCode = useMemo(() => 'IHX' + Math.random().toString(36).slice(2, 8).toUpperCase(), [planId, months]);

  const newExpiry = useMemo(() => {
    const base = planId === plan.id ? new Date(plan.expiresAt) : new Date('2026-11-03');
    base.setMonth(base.getMonth() + months);
    return base.toISOString();
  }, [planId, plan, months]);

  useEffect(() => {
    if (planId) { setStep(0); setApplied(null); setCode(''); setLeft(15 * 60); }
  }, [planId]);
  useEffect(() => { if (step === 1) timer.start(); else timer.stop(); return timer.stop; }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p || !price) return <Modal opened={false} onClose={onClose}>{null}</Modal>;

  const confirmPaid = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setStep(2);
      setPlan({ id: p.id, startedAt: '2026-11-03', expiresAt: newExpiry });
    }, 1800);
  };

  return (
    <Modal opened={!!planId} onClose={onClose} size={step === 1 ? 760 : 'lg'} title={<Group gap="xs"><IconReceipt2 size={20} /><Text fw={500}>Thanh toán gói {p.name}</Text></Group>}>
      <Stepper active={step} size="xs" mb="lg" color="iris" allowNextStepsSelect={false} onStepClick={(s) => s < step && step < 2 && setStep(s)}>
        <Stepper.Step label="Đơn hàng" />
        <Stepper.Step label="Thanh toán" />
        <Stepper.Step label="Kích hoạt" />
      </Stepper>

      {step === 0 && (
        <Stack>
          <Paper p="lg" radius="md" className="ticket" style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff' }}>
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text fz="xs" tt="uppercase" fw={500} lts={1.5} opacity={0.7}>Gói đã chọn</Text>
                <Text fz={26} fw={500}>{p.name} · {months} tháng</Text>
                <Text fz="sm" opacity={0.8}>Hiệu lực đến {dateVN(newExpiry)}</Text>
              </Box>
              <Badge color="volt" variant="light" size="lg">-{price.discount}%</Badge>
            </Group>
          </Paper>
          <Stack gap={6}>
            <Line label="Giá gốc" value={<Text td="line-through" c="dimmed" className="tnum">{vnd(price.original)}</Text>} />
            <Line label={`Ưu đãi theo thời hạn (${price.discount}%)`} value={<Text c="teal.7" fw={500} className="tnum">- {vnd(price.saved)}</Text>} />
            {applied && <Line label={`Mã ${applied} (${couponPct}%)`} value={<Text c="teal.7" fw={500} className="tnum">- {vnd(price.total - final)}</Text>} />}
            <Divider my={4} />
            <Line label={<Text fw={500}>Tổng thanh toán</Text>} value={<Text fz={26} fw={500} className="tnum">{vnd(final)}</Text>} />
            <Text fz="xs" c="dimmed" ta="right">≈ {vnd(final / months)}/tháng · đã gồm VAT</Text>
          </Stack>
          <Group align="flex-end" gap="xs">
            <TextInput style={{ flex: 1 }} label="Mã giảm giá" placeholder="VD: IHX10" leftSection={<IconDiscount2 size={16} />} value={code} onChange={(e) => setCode(e.currentTarget.value.toUpperCase())}
              error={code && applied !== code && code.length > 3 && !COUPONS[code] ? 'Mã không hợp lệ' : null} />
            <Button variant="light" onClick={() => COUPONS[code] && setApplied(code)} disabled={!COUPONS[code]}>Áp dụng</Button>
          </Group>
          <Paper withBorder p="sm" radius="md"><Text fz="sm">Tài khoản nhận gói: <b>{user.email}</b></Text></Paper>
          <Button size="md" className="volt-btn" onClick={() => setStep(1)}>Tiếp tục thanh toán</Button>
        </Stack>
      )}

      {step === 1 && (
        <Tabs defaultValue="bank" radius="md" variant="pills">
          <Tabs.List grow mb="md">
            <Tabs.Tab value="bank" leftSection={<IconBuildingBank size={16} />}>Chuyển khoản QR</Tabs.Tab>
            <Tabs.Tab value="chat" leftSection={<IconMessageCircle size={16} />}>Nhắn tư vấn viên</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="bank">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <Stack align="center" gap="xs">
                <Paper p="md" radius="md" bg="white" shadow="md"><FakeQr seed={orderCode} size={210} /></Paper>
                <Group gap={6}>
                  <RingProgress size={34} thickness={4} roundCaps sections={[{ value: (left / 900) * 100, color: left < 120 ? 'red' : 'iris' }]} />
                  <Text fz="sm" c="dimmed">Mã hết hạn sau <Text span fw={500} c="var(--mantine-color-text)" className="mono">{String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}</Text></Text>
                </Group>
                <Text fz="xs" c="dimmed" ta="center">Mở app ngân hàng bất kỳ → Quét QR (minh hoạ trong bản demo)</Text>
              </Stack>
              <Stack gap={0}>
                <Paper withBorder radius="md" px="md" py="xs">
                  <CopyRow label="Ngân hàng" value="Demo Bank" mono={false} />
                  <CopyRow label="Số tài khoản" value="0000 1234 5678" />
                  <CopyRow label="Chủ tài khoản" value="INVOICEHUBX DEMO" mono={false} />
                  <CopyRow label="Số tiền" value={final.toLocaleString('vi-VN')} />
                  <Divider my={4} />
                  <CopyRow label="Nội dung CK" value={orderCode} />
                </Paper>
                <Alert mt="md" color="yellow" variant="light" radius="lg" p="sm">
                  <Text fz="xs">Ghi <b>đúng nội dung {orderCode}</b> để hệ thống tự đối soát và kích hoạt trong 1–3 phút.</Text>
                </Alert>
                <Button mt="md" size="md" className="volt-btn" loading={checking} onClick={confirmPaid}>Tôi đã chuyển khoản</Button>
                <Button mt="xs" variant="subtle" color="gray" onClick={() => setStep(0)}>Quay lại</Button>
              </Stack>
            </SimpleGrid>
          </Tabs.Panel>
          <Tabs.Panel value="chat">
            <Stack>
              <Text c="dimmed" fz="sm">Cần xuất hoá đơn VAT cho công ty, hoặc thanh toán theo hợp đồng? Đội ngũ hỗ trợ sẽ phản hồi trong giờ hành chính.</Text>
              <SimpleGrid cols={{ base: 1, sm: 3 }}>
                {[
                  { icon: IconMessageCircle, t: 'Zalo OA', d: 'zalo.me/invoicehubx' },
                  { icon: IconBrandMessenger, t: 'Messenger', d: 'm.me/invoicehubx' },
                  { icon: IconPhone, t: 'Hotline', d: '1900 0000' },
                ].map((c) => (
                  <Paper key={c.t} withBorder p="md" radius="md" className="lift" style={{ cursor: 'pointer' }}>
                    <ThemeIcon variant="light" radius="md" mb="xs"><c.icon size={18} /></ThemeIcon>
                    <Text fw={500} fz="sm">{c.t}</Text>
                    <Text fz="xs" c="dimmed">{c.d}</Text>
                  </Paper>
                ))}
              </SimpleGrid>
              <Paper withBorder p="md" radius="md">
                <Text fz="xs" c="dimmed" mb={4}>Tin nhắn gợi ý (bấm để sao chép)</Text>
                <CopyRow label="" value={`Mua ${p.name} ${months} tháng · ${user.email} · ${orderCode}`} mono={false} />
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      )}

      {step === 2 && (
        <Stack align="center" ta="center" py="lg">
          <ThemeIcon size={84} radius={999} color="volt"  className="floaty"><IconConfetti size={44} /></ThemeIcon>
          <Text fz={28} fw={500}>Kích hoạt thành công!</Text>
          <Text c="dimmed">Gói <b>{p.name}</b> đã được áp dụng cho {user.email}.<br />Hiệu lực đến <b>{dateVN(newExpiry)}</b>.</Text>
          <Button size="md" onClick={onClose} mt="sm">Bắt đầu sử dụng</Button>
        </Stack>
      )}
    </Modal>
  );
}

function Line({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return <Group justify="space-between">{typeof label === 'string' ? <Text fz="sm" c="dimmed">{label}</Text> : label}{value}</Group>;
}
