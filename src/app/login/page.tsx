'use client';

import { Alert, Anchor, Button, Checkbox, Group, PasswordInput, PinInput, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { IconAlertCircle, IconArrowLeft, IconKey, IconLock, IconMail, IconMailFast } from '@tabler/icons-react';
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
      subtitle="Đăng nhập để quản lý hoá đơn"
    >
      <GoogleButton text="signin_with" label="Đăng nhập với Google" onSuccess={finish} />
      <OrDivider />

      {error && <Alert color="red" icon={<IconAlertCircle size={18} />} p="xs" mb="sm">{error}</Alert>}

      {method === 'password' && (
        <form onSubmit={submitPassword} noValidate>
          <Stack gap="sm">
            <TextInput label="Email" placeholder="ban@congty.vn" type="email" autoComplete="email"
              leftSection={<IconMail size={16} />} value={email} onChange={(e) => setEmail(e.currentTarget.value.trim())} error={emailErr} />
            <PasswordInput label="Mật khẩu" placeholder="Nhập mật khẩu" autoComplete="current-password"
                leftSection={<IconLock size={16} />} value={password} onChange={(e) => setPassword(e.currentTarget.value)}
                error={touched && password.length < 6 ? 'Mật khẩu tối thiểu 6 ký tự' : null} />
            <Group justify="space-between">
              <Checkbox label="Ghi nhớ đăng nhập" checked={remember} onChange={(e) => setRemember(e.currentTarget.checked)} size="xs" />
              <Anchor component={Link} href="/forgot-password" fz="xs">Quên mật khẩu?</Anchor>
            </Group>
            <Button type="submit" loading={busy} fullWidth>Đăng nhập</Button>
          </Stack>
        </form>
      )}

      {method === 'otp' && !otpSent && (
        <form onSubmit={sendOtp} noValidate>
          <Stack gap="sm">
            <TextInput label="Email" placeholder="ban@congty.vn" type="email" autoComplete="email" description="Nhận mã 6 số qua email, không cần mật khẩu."
              leftSection={<IconMail size={16} />} value={email} onChange={(e) => setEmail(e.currentTarget.value.trim())} error={emailErr} />
            <Button type="submit" loading={busy} fullWidth>Gửi mã đăng nhập</Button>
          </Stack>
        </form>
      )}

      {method === 'otp' && otpSent && (
        <Stack gap="sm" align="center">
          <Text fz="sm" ta="center">Nhập mã 6 số đã gửi tới<br /><b>{email}</b></Text>
          <PinInput length={6} type="number" oneTimeCode autoFocus value={otp} onChange={setOtp} onComplete={verifyOtp} aria-label="Mã đăng nhập" />
          <Button fullWidth disabled={otp.length < 6} loading={busy} onClick={verifyOtp}>Xác nhận</Button>
          <Group justify="space-between" w="100%">
            <Anchor component="button" fz="sm" c="dimmed" onClick={() => setOtpSent(false)}><IconArrowLeft size={14} style={{ verticalAlign: -2 }} /> Đổi email</Anchor>
            {wait > 0 ? <Text fz="sm" c="dimmed">Gửi lại sau {wait}s</Text> : <Anchor component="button" fz="sm" onClick={() => sendOtp()}>Gửi lại mã</Anchor>}
          </Group>
        </Stack>
      )}

      <Group justify="space-between" mt="sm" gap={6}>
        <Anchor component="button" fz="xs" onClick={() => { setMethod(method === 'password' ? 'otp' : 'password'); setError(null); setOtpSent(false); }}>
          <Group gap={4} wrap="nowrap">{method === 'password' ? <><IconMailFast size={14} />Đăng nhập bằng mã qua email</> : <><IconKey size={14} />Đăng nhập bằng mật khẩu</>}</Group>
        </Anchor>
        {method === 'password' && (
          <Tooltip label="Bản demo: email bất kỳ, mật khẩu ≥ 6 ký tự, mã OTP 6 số bất kỳ">
            <Anchor component="button" fz="xs" c="dimmed" onClick={() => { setEmail('demo@invoicehubx.vn'); setPassword('Demo@123'); }}>Điền tài khoản demo</Anchor>
          </Tooltip>
        )}
      </Group>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}
