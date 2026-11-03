'use client';

import {
  Accordion, Avatar, Badge, Box, Button, Card, Container, Grid, Group, Paper, Progress, SimpleGrid, Stack, Text, ThemeIcon, Title,
} from '@mantine/core';
import {
  IconArrowRight, IconBell, IconBolt, IconBuildingStore, IconCloud, IconFileSpreadsheet, IconKey, IconRefresh,
  IconShieldCheck, IconSparkles, IconChartAreaLine, IconCheck,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DURATIONS, PLANS, priceOf } from '@/lib/data';

const FEATURES = [
  { icon: IconRefresh, title: 'Đồng bộ tự động', desc: 'Kết nối cổng hoá đơn điện tử của cơ quan thuế, tự tải hoá đơn vào/ra theo lịch.', color: 'iris', span: 7 },
  { icon: IconShieldCheck, title: 'Cảnh báo MST rủi ro', desc: 'Phát hiện nhà cung cấp ngừng hoạt động trước khi bạn kê khai khấu trừ.', color: 'orange', span: 5 },
  { icon: IconBuildingStore, title: 'Không giới hạn MST', desc: 'Một tài khoản, quản lý hàng chục doanh nghiệp. Chuyển đổi trong 1 cú click.', color: 'teal', span: 4 },
  { icon: IconFileSpreadsheet, title: 'Xuất Excel / XML', desc: 'Tải bản gốc hàng loạt, xuất bảng kê đúng mẫu.', color: 'grape', span: 4 },
  { icon: IconCloud, title: 'Cloud 24/7', desc: 'Gói Cloud+ chạy trên máy chủ, không cần treo máy.', color: 'cyan', span: 4 },
];

function HeroPreview() {
  return (
    <Box pos="relative" className="floaty">
      <Card className="glass" p="lg" radius={28} shadow="xl" style={{ transform: 'rotate(-2deg)' }}>
        <Group justify="space-between" mb="md">
          <Group gap="xs"><Avatar color="iris" variant="filled" radius="xl" size="sm">HĐ</Avatar><Box><Text fz="sm" fw={800}>Hải Đăng Travel</Text><Text fz={10} c="dimmed" className="mono">MST 0312456789</Text></Box></Group>
          <Badge color="teal" variant="dot">Đang kết nối</Badge>
        </Group>
        <SimpleGrid cols={2} mb="md">
          <Paper withBorder p="sm" radius="lg"><Text fz={11} c="dimmed">Đầu vào T10</Text><Text fw={900} fz="lg">482 tr</Text><Progress value={72} size={4} color="iris" mt={6} /></Paper>
          <Paper withBorder p="sm" radius="lg"><Text fz={11} c="dimmed">Đầu ra T10</Text><Text fw={900} fz="lg">615 tr</Text><Progress value={88} size={4} color="volt" mt={6} /></Paper>
        </SimpleGrid>
        <Stack gap={8}>
          {[['00012874', 'Hàng không Sao Việt', '18.540.000'], ['00004417', 'Khách sạn Biển Xanh', '7.236.000'], ['00098120', 'Viễn thông Ánh Dương', '594.000']].map(([n, p, t]) => (
            <Group key={n} justify="space-between" wrap="nowrap" p={8} style={{ borderRadius: 12, border: '1px solid var(--ihx-border)' }}>
              <Group gap={8} wrap="nowrap"><Box w={4} h={26} bg="iris.4" style={{ borderRadius: 4 }} /><Box><Text fz="xs" fw={700} className="mono">{n}</Text><Text fz={11} c="dimmed">{p}</Text></Box></Group>
              <Text fz="sm" fw={800} className="tnum">{t}</Text>
            </Group>
          ))}
        </Stack>
      </Card>
      <Paper p="sm" radius="xl" shadow="xl" pos="absolute" bottom={-24} left={-24} style={{ background: '#ccff1c', color: '#0a0b12', transform: 'rotate(3deg)' }}>
        <Group gap={8}><IconBolt size={18} /><Text fw={800} fz="sm">+18 hoá đơn mới · 42s</Text></Group>
      </Paper>
      <Paper p="sm" radius="xl" shadow="xl" pos="absolute" top={-20} right={-14} className="glass" withBorder>
        <Group gap={8}><IconBell size={16} color="var(--mantine-color-orange-5)" /><Text fw={700} fz="xs">1 MST rủi ro cần kiểm tra</Text></Group>
      </Paper>
    </Box>
  );
}

export default function Landing() {
  const best = DURATIONS[DURATIONS.length - 1]!;
  return (
    <Box>
      <Box component="header" pos="sticky" top={0} style={{ zIndex: 100 }} className="glass">
        <Container size="xl" py="md">
          <Group justify="space-between">
            <Logo />
            <Group gap="xl" visibleFrom="md">
              {[['#features', 'Tính năng'], ['#how', 'Cách hoạt động'], ['#pricing', 'Bảng giá'], ['#faq', 'Hỏi đáp']].map(([h, l]) => (
                <Text key={h} component="a" href={h} fw={600} fz="sm" c="dimmed" style={{ textDecoration: 'none' }}>{l}</Text>
              ))}
            </Group>
            <Group gap="xs">
              <ThemeToggle />
              <Button component={Link} href="/app" className="volt-btn" rightSection={<IconArrowRight size={16} />}>Vào ứng dụng</Button>
            </Group>
          </Group>
        </Container>
      </Box>

      <Box pos="relative">
        <Box className="grid-bg" pos="absolute" inset={0} style={{ pointerEvents: 'none' }} />
        <Container size="xl" py={{ base: 60, md: 110 }} pos="relative">
          <Grid gap={60} align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Badge size="lg" variant="light" leftSection={<IconSparkles size={14} />} mb="lg">Mới: Đồng bộ Cloud 24/7 không cần treo máy</Badge>
              <Title order={1} fz={{ base: 38, md: 56 }} lh={1.08} lts={-2}>
                Mọi hoá đơn điện tử,<br /><span className="gradient-text">một trung tâm.</span>
              </Title>
              <Text fz={{ base: 'md', md: 'xl' }} c="dimmed" mt="lg" maw={540}>
                InvoiceHubX tự gom hoá đơn đầu vào – đầu ra từ cổng thuế cho mọi mã số thuế, đối soát VAT và cảnh báo rủi ro trước khi bạn kịp mở Excel.
              </Text>
              <Group mt={36}>
                <Button size="lg" className="volt-btn" component={Link} href="/app" rightSection={<IconArrowRight size={18} />}>Dùng thử miễn phí</Button>
                <Button size="lg" variant="default" component={Link} href="/app/billing">Xem bảng giá</Button>
              </Group>
              <Group mt="xl" gap="lg">
                {['Không cần thẻ', 'Kết nối trong 60 giây', 'Dữ liệu mã hoá'].map((t) => (
                  <Group key={t} gap={6}><IconCheck size={16} color="var(--mantine-color-teal-5)" /><Text fz="sm" c="dimmed">{t}</Text></Group>
                ))}
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}><Box px={{ base: 'md', md: 40 }}><HeroPreview /></Box></Grid.Col>
          </Grid>
        </Container>
      </Box>

      <Container size="xl" mb={80}>
        <SimpleGrid cols={{ base: 2, md: 4 }}>
          {[['12.000+', 'doanh nghiệp'], ['3,4 triệu', 'hoá đơn/tháng'], ['42 giây', 'đồng bộ trung bình'], ['99,9%', 'uptime Cloud']].map(([v, l]) => (
            <Paper key={l} p="lg" radius="xl" className="glass" withBorder ta="center"><Text fz={30} fw={900} className="gradient-text">{v}</Text><Text c="dimmed" fz="sm">{l}</Text></Paper>
          ))}
        </SimpleGrid>
      </Container>

      <Container size="xl" id="features" py={60}>
        <Text c="iris.3" fw={800} tt="uppercase" lts={2} fz="sm">Tính năng</Text>
        <Title order={2} fz={{ base: 30, md: 44 }} lts={-1} mb="xl" maw={720}>Được thiết kế cho kế toán bận rộn nhất</Title>
        <Grid gap="lg">
          {FEATURES.map((f) => (
            <Grid.Col key={f.title} span={{ base: 12, md: f.span }}>
              <Card className="glass lift" p="xl" h="100%">
                <ThemeIcon size={52} radius="lg" variant="light" color={f.color} mb="lg"><f.icon size={26} /></ThemeIcon>
                <Text fw={900} fz="xl">{f.title}</Text>
                <Text c="dimmed" mt={6}>{f.desc}</Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Container>

      <Container size="xl" id="how" py={60}>
        <Paper radius={32} p={{ base: 'xl', md: 50 }} style={{ background: 'linear-gradient(130deg, #1d1450, #3e20cc 60%, #5933ff)', color: '#fff' }}>
          <Title order={2} fz={{ base: 28, md: 40 }} lts={-1} mb={40}>3 bước, không cần cài đặt phức tạp</Title>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing={40}>
            {[
              { icon: IconKey, t: 'Nhập MST & tài khoản cổng thuế', d: 'Thông tin được mã hoá AES-256, chỉ dùng để tải hoá đơn.' },
              { icon: IconRefresh, t: 'Đặt lịch đồng bộ', d: 'Chọn khung giờ, chạy trên máy tính hoặc Cloud 24/7.' },
              { icon: IconChartAreaLine, t: 'Xem báo cáo & xuất file', d: 'Dashboard VAT, cảnh báo rủi ro, xuất Excel một chạm.' },
            ].map((s, i) => (
              <Box key={s.t}>
                <Group mb="md"><Text fz={56} fw={900} c="#ccff1c" lh={1}>0{i + 1}</Text><s.icon size={30} opacity={0.8} /></Group>
                <Text fw={800} fz="lg">{s.t}</Text>
                <Text opacity={0.75} mt={4}>{s.d}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Paper>
      </Container>

      <Container size="xl" id="pricing" py={60}>
        <Group justify="space-between" align="flex-end" mb="xl">
          <Box>
            <Text c="iris.3" fw={800} tt="uppercase" lts={2} fz="sm">Bảng giá</Text>
            <Title order={2} fz={{ base: 30, md: 44 }} lts={-1}>Ưu đãi đến {best.discount}% khi trả trước {best.months} tháng</Title>
          </Box>
          <Button component={Link} href="/app/billing" variant="light" rightSection={<IconArrowRight size={16} />}>Chi tiết các gói</Button>
        </Group>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {PLANS.map((p) => {
            const pr = p.base ? priceOf(p.base, 36) : null;
            const featured = p.id === 'plus';
            return (
              <Card key={p.id} p="xl" className={featured ? 'lift' : 'glass lift'} style={featured ? { background: 'linear-gradient(160deg, #151725, #1d1450)', border: '1px solid rgba(204,255,28,.5)', color: '#fff' } : undefined}>
                <Group justify="space-between"><Text fw={900} fz="xl">{p.name}</Text>{p.highlight && <Badge color="volt" variant="filled" c="dark.9">{p.highlight}</Badge>}</Group>
                <Text fz={38} fw={900} mt="md" lts={-1}>{pr ? `${Math.round(pr.perMonth / 1000)}k` : '0 ₫'}<Text span fz="md" fw={500} opacity={0.6}>{pr ? ' /tháng' : ''}</Text></Text>
                <Text fz="sm" opacity={0.6} mb="lg">{pr ? `Giá gốc ${p.base.toLocaleString('vi-VN')} ₫/tháng` : 'Miễn phí trọn đời'}</Text>
                <Stack gap={8}>{p.features.slice(0, 4).map((f) => <Group key={f} gap={8} wrap="nowrap"><IconCheck size={16} color={featured ? '#ccff1c' : 'var(--mantine-color-iris-4)'} /><Text fz="sm">{f}</Text></Group>)}</Stack>
                <Button mt="xl" component={Link} href="/app/billing" className={featured ? 'volt-btn' : undefined} variant={featured ? 'filled' : 'light'}>Bắt đầu</Button>
              </Card>
            );
          })}
        </SimpleGrid>
      </Container>

      <Container size="md" id="faq" py={60}>
        <Title order={2} ta="center" fz={{ base: 30, md: 40 }} lts={-1} mb="xl">Câu hỏi thường gặp</Title>
        <Accordion variant="separated" radius="xl">
          {[
            ['InvoiceHubX lấy hoá đơn từ đâu?', 'Từ cổng hoá đơn điện tử của cơ quan thuế, bằng chính tài khoản tra cứu của doanh nghiệp bạn.'],
            ['Mật khẩu cổng thuế có an toàn?', 'Mật khẩu được mã hoá AES-256 phía máy chủ, không hiển thị lại cho bất kỳ ai, kể cả đội ngũ InvoiceHubX.'],
            ['Pro và Cloud+ khác nhau thế nào?', 'Pro chạy đồng bộ trên ứng dụng máy tính của bạn. Cloud+ chạy trên máy chủ 24/7, không cần mở máy.'],
            ['Có dùng thử được không?', 'Gói Starter miễn phí trọn đời với 1 MST và 100 lượt tải bản gốc mỗi tháng.'],
          ].map(([q, a]) => (
            <Accordion.Item key={q} value={q}><Accordion.Control fw={700}>{q}</Accordion.Control><Accordion.Panel c="dimmed">{a}</Accordion.Panel></Accordion.Item>
          ))}
        </Accordion>
      </Container>

      <Container size="xl" py={60}>
        <Paper radius={32} p={{ base: 'xl', md: 60 }} ta="center" style={{ background: '#ccff1c', color: '#0a0b12' }}>
          <Title order={2} fz={{ base: 30, md: 48 }} lts={-1.5}>Ngừng tải hoá đơn thủ công từ hôm nay.</Title>
          <Text fz="lg" mt="sm" opacity={0.75}>Kết nối mã số thuế đầu tiên trong chưa đầy một phút.</Text>
          <Button mt="xl" size="xl" color="dark" component={Link} href="/app" rightSection={<IconArrowRight size={20} />}>Mở InvoiceHubX</Button>
        </Paper>
      </Container>

      <Box component="footer" py="xl" style={{ borderTop: '1px solid var(--ihx-border)' }}>
        <Container size="xl">
          <Group justify="space-between">
            <Logo size={24} />
            <Text fz="sm" c="dimmed">© 2026 InvoiceHubX · Bản demo giao diện, dữ liệu là mẫu.</Text>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
