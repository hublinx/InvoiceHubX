'use client';

import { Anchor, Button, Stack, Text, TextInput, ThemeIcon } from '@mantine/core';
import { IconArrowLeft, IconMail, IconMailCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthLayout } from '@/components/AuthLayout';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((s) => s - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const back = <Anchor component={Link} href="/login" fz="sm" fw={600}><IconArrowLeft size={14} style={{ verticalAlign: -2 }} /> Quay lại đăng nhập</Anchor>;

  if (sent) {
    return (
      <AuthLayout title="Kiểm tra hộp thư" footer={back}>
        <Stack align="center" ta="center" gap="md">
          <ThemeIcon size={64} radius="xl" variant="light" color="teal"><IconMailCheck size={32} /></ThemeIcon>
          <Text>Nếu <b>{email}</b> đã đăng ký InvoiceHubX, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút.</Text>
          <Text fz="sm" c="dimmed">Không thấy email? Kiểm tra thư mục Spam/Quảng cáo.</Text>
          <Button variant="default" disabled={wait > 0} onClick={() => setWait(60)}>{wait > 0 ? `Gửi lại sau ${wait}s` : 'Gửi lại email'}</Button>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Quên mật khẩu" subtitle="Nhập email đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu." footer={back}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!EMAIL_RE.test(email)) return; setBusy(true); setTimeout(() => { setBusy(false); setSent(true); setWait(60); }, 700); }}>
        <Stack gap="md">
          <TextInput label="Email" type="email" size="md" leftSection={<IconMail size={18} />} value={email} onChange={(e) => setEmail(e.currentTarget.value.trim())}
            error={touched && !EMAIL_RE.test(email) ? 'Email không hợp lệ' : null} autoComplete="email" data-autofocus />
          <Button type="submit" size="md" loading={busy} fullWidth>Gửi liên kết đặt lại</Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
