'use client';

import { Alert, Anchor, Button, Checkbox, Group, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertCircle, IconInfoCircle, IconLock, IconMail } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { GoogleButton, OrDivider } from '@/components/GoogleButton';
import { useAuth, type Session } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/app';
  const { ready, session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (ready && session) router.replace(next); }, [ready, session, next, router]);

  const emailErr = touched && !EMAIL_RE.test(email) ? 'Email không hợp lệ' : null;
  const pwErr = touched && password.length < 6 ? 'Mật khẩu tối thiểu 6 ký tự' : null;

  const finish = (s: Omit<Session, 'signedInAt'>) => { signIn(s, remember); router.replace(next); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!EMAIL_RE.test(email) || password.length < 6) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (password.toLowerCase() === 'saimatkhau') { setError('Email hoặc mật khẩu không đúng.'); return; }
      const name = email.split('@')[0]!.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      finish({ name: email === 'demo@invoicehubx.vn' ? 'Trần Minh Hưng' : name, email, method: 'password' });
    }, 700);
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Chào mừng trở lại! Đăng nhập để tiếp tục quản lý hoá đơn."
      footer={<Text fz="sm" c="dimmed">Chưa có tài khoản? <Anchor component={Link} href="/register" fw={600}>Đăng ký miễn phí</Anchor></Text>}
    >
      <GoogleButton text="signin_with" label="Đăng nhập với Google" onSuccess={finish} />
      <OrDivider />
      <form onSubmit={submit} noValidate>
        <Stack gap="md">
          {error && <Alert color="red" icon={<IconAlertCircle size={18} />} p="sm">{error}</Alert>}
          <TextInput label="Email" placeholder="ban@congty.vn" type="email" autoComplete="email" size="md"
            leftSection={<IconMail size={18} />} value={email} onChange={(e) => setEmail(e.currentTarget.value.trim())} error={emailErr} />
          <PasswordInput
            label={<Group justify="space-between" w="100%" gap={0}><span>Mật khẩu</span></Group>}
            placeholder="Nhập mật khẩu" autoComplete="current-password" size="md"
            leftSection={<IconLock size={18} />} value={password} onChange={(e) => setPassword(e.currentTarget.value)} error={pwErr}
          />
          <Group justify="space-between">
            <Checkbox label="Ghi nhớ đăng nhập" checked={remember} onChange={(e) => setRemember(e.currentTarget.checked)} />
            <Anchor component={Link} href="/forgot-password" fz="sm" fw={600}>Quên mật khẩu?</Anchor>
          </Group>
          <Button type="submit" size="md" loading={busy} fullWidth>Đăng nhập</Button>
        </Stack>
      </form>
      <Alert mt="lg" color="gray" variant="light" icon={<IconInfoCircle size={18} />} p="sm">
        <Group justify="space-between" gap="xs">
          <Text fz="xs">Bản demo: dùng email bất kỳ, mật khẩu từ 6 ký tự.</Text>
          <Button size="compact-xs" variant="light" onClick={() => { setEmail('demo@invoicehubx.vn'); setPassword('Demo@123'); }}>Điền tài khoản demo</Button>
        </Group>
      </Alert>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}
