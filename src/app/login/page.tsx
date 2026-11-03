'use client';

import { Alert, Anchor, Box, Button, Checkbox, Group, PasswordInput, PinInput, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertCircle, IconArrowLeft, IconInfoCircle, IconKey, IconLock, IconMail, IconMailFast } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { GoogleButton, OrDivider } from '@/components/GoogleButton';
import { useAuth, type Session } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameFromEmail = (email: string) =>
  email === 'demo@invoicehubx.vn' ? 'Trần Minh Hưng' : email.split('@')[0]!.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/app';
  const { ready, session, signIn } = useAuth();
  const [method, setMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => { if (ready && session) router.replace(next); }, [ready, session, next, router]);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((s) => s - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const emailOk = EMAIL_RE.test(email);
  const emailErr = touched && !emailOk ? 'Email không hợp lệ' : null;
  const finish = (s: Omit<Session, 'signedInAt'>) => { signIn(s, remember); router.replace(next); };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true); setError(null);
    if (!emailOk || password.length < 6) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (password.toLowerCase() === 'saimatkhau') { setError('Email hoặc mật khẩu không đúng.'); return; }
      finish({ name: nameFromEmail(email), email, method: 'password' });
    }, 600);
  };

  const sendOtp = (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true); setError(null);
    if (!emailOk) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); setOtpSent(true); setOtp(''); setWait(60); }, 600);
  };

  const verifyOtp = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); finish({ name: nameFromEmail(email), email, method: 'password' }); }, 500);
  };

  return (
    <AuthLayout
      tabs
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục quản lý hoá đơn"
      footer={<Text fz="sm" c="dimmed">Chưa có tài khoản? <Anchor component={Link} href="/register" fw={600}>Đăng ký miễn phí</Anchor></Text>}
    >
      <GoogleButton text="signin_with" label="Đăng nhập với Google" onSuccess={finish} />
      <OrDivider />

      <SegmentedControl
        fullWidth size="xs" mb="md" radius="md"
        value={method}
        onChange={(v) => { setMethod(v as 'password' | 'otp'); setError(null); setOtpSent(false); }}
        data={[
          { value: 'password', label: <Group gap={6} justify="center" wrap="nowrap"><IconKey size={14} />Mật khẩu</Group> },
          { value: 'otp', label: <Group gap={6} justify="center" wrap="nowrap"><IconMailFast size={14} />Mã qua email</Group> },
        ]}
      />

      {error && <Alert color="red" icon={<IconAlertCircle size={18} />} p="sm" mb="md">{error}</Alert>}

      {method === 'password' && (
        <form onSubmit={submitPassword} noValidate>
          <Stack gap="md">
            <TextInput label="Email" placeholder="ban@congty.vn" type="email" autoComplete="email"
              leftSection={<IconMail size={16} />} value={email} onChange={(e) => setEmail(e.currentTarget.value.trim())} error={emailErr} />
            <Box>
              <Group justify="space-between" mb={4}>
                <Text component="label" htmlFor="pw" fz="sm" fw={500}>Mật khẩu</Text>
                <Anchor component={Link} href="/forgot-password" fz="xs">Quên mật khẩu?</Anchor>
              </Group>
              <PasswordInput id="pw" placeholder="Nhập mật khẩu" autoComplete="current-password"
                leftSection={<IconLock size={16} />} value={password} onChange={(e) => setPassword(e.currentTarget.value)}
                error={touched && password.length < 6 ? 'Mật khẩu tối thiểu 6 ký tự' : null} />
            </Box>
            <Checkbox label="Ghi nhớ đăng nhập trên thiết bị này" checked={remember} onChange={(e) => setRemember(e.currentTarget.checked)} size="sm" />
            <Button type="submit" loading={busy} fullWidth size="md">Đăng nhập</Button>
          </Stack>
        </form>
      )}

      {method === 'otp' && !otpSent && (
        <form onSubmit={sendOtp} noValidate>
          <Stack gap="md">
            <TextInput label="Email" placeholder="ban@congty.vn" type="email" autoComplete="email" description="Chúng tôi sẽ gửi mã 6 số, không cần mật khẩu."
              leftSection={<IconMail size={16} />} value={email} onChange={(e) => setEmail(e.currentTarget.value.trim())} error={emailErr} />
            <Button type="submit" loading={busy} fullWidth size="md">Gửi mã đăng nhập</Button>
          </Stack>
        </form>
      )}

      {method === 'otp' && otpSent && (
        <Stack gap="md" align="center">
          <Text fz="sm" ta="center">Nhập mã 6 số đã gửi tới<br /><b>{email}</b></Text>
          <PinInput length={6} type="number" oneTimeCode autoFocus value={otp} onChange={setOtp} onComplete={verifyOtp} aria-label="Mã đăng nhập" />
          <Button fullWidth size="md" disabled={otp.length < 6} loading={busy} onClick={verifyOtp}>Xác nhận</Button>
          <Group justify="space-between" w="100%">
            <Anchor component="button" fz="sm" c="dimmed" onClick={() => setOtpSent(false)}><IconArrowLeft size={14} style={{ verticalAlign: -2 }} /> Đổi email</Anchor>
            {wait > 0 ? <Text fz="sm" c="dimmed">Gửi lại sau {wait}s</Text> : <Anchor component="button" fz="sm" onClick={() => sendOtp()}>Gửi lại mã</Anchor>}
          </Group>
        </Stack>
      )}

      <Alert mt="lg" color="gray" variant="light" icon={<IconInfoCircle size={16} />} p="xs">
        <Group justify="space-between" gap={6}>
          <Text fz="xs">Bản demo: email bất kỳ · mật khẩu ≥ 6 ký tự · mã OTP 6 số bất kỳ.</Text>
          {method === 'password' && <Anchor component="button" fz="xs" fw={600} onClick={() => { setEmail('demo@invoicehubx.vn'); setPassword('Demo@123'); }}>Điền tài khoản demo</Anchor>}
        </Group>
      </Alert>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}
