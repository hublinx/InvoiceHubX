'use client';

import { Alert, Anchor, Box, Button, Checkbox, Group, PasswordInput, PinInput, Progress, Stack, Text, TextInput } from '@mantine/core';
import { IconCheck, IconLock, IconMail, IconMailOpened, IconUser, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { GoogleButton, OrDivider } from '@/components/GoogleButton';
import { useAuth, type Session } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RULES = [
  { re: /.{8,}/, label: 'Tối thiểu 8 ký tự' },
  { re: /[A-Z]/, label: 'Có chữ in hoa' },
  { re: /[0-9]/, label: 'Có chữ số' },
  { re: /[^A-Za-z0-9]/, label: 'Có ký tự đặc biệt' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { ready, session, signIn } = useAuth();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState('');
  const [resend, setResend] = useState(0);

  useEffect(() => { if (ready && session && step === 'form') router.replace('/app'); }, [ready, session, step, router]);
  useEffect(() => { if (resend <= 0) return; const t = setTimeout(() => setResend((s) => s - 1), 1000); return () => clearTimeout(t); }, [resend]);

  const score = RULES.filter((r) => r.re.test(pw)).length;
  const valid = name.trim().length > 1 && EMAIL_RE.test(email) && score === 4 && agree;
  const finish = (s: Omit<Session, 'signedInAt'>) => { signIn(s); router.replace('/app'); };

  if (step === 'otp') {
    return (
      <AuthLayout title="Xác thực email" subtitle={<>Nhập mã 6 số vừa gửi tới <b>{email}</b>.</>}
        footer={<Anchor component="button" fz="sm" onClick={() => setStep('form')}>← Sửa thông tin đăng ký</Anchor>}>
        <Stack gap="lg" align="center">
          <IconMailOpened size={48} color="var(--mantine-color-iris-6)" />
          <PinInput length={6} type="number" size="lg" oneTimeCode value={otp} onChange={setOtp} aria-label="Mã xác thực" />
          <Button fullWidth size="md" disabled={otp.length < 6} loading={busy}
            onClick={() => { setBusy(true); setTimeout(() => finish({ name: name.trim(), email, method: 'password' }), 600); }}>
            Xác nhận & vào ứng dụng
          </Button>
          <Text fz="sm" c="dimmed">
            Chưa nhận được mã?{' '}
            {resend > 0 ? <>Gửi lại sau {resend}s</> : <Anchor component="button" fz="sm" onClick={() => setResend(60)}>Gửi lại</Anchor>}
          </Text>
          <Alert color="gray" variant="light" p="sm" w="100%"><Text fz="xs">Bản demo: nhập 6 số bất kỳ.</Text></Alert>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Miễn phí gói Starter trọn đời — không cần thẻ thanh toán."
      footer={<Text fz="sm" c="dimmed">Đã có tài khoản? <Anchor component={Link} href="/login" fw={600}>Đăng nhập</Anchor></Text>}
    >
      <GoogleButton text="signup_with" label="Đăng ký với Google" onSuccess={finish} />
      <OrDivider />
      <form noValidate onSubmit={(e) => { e.preventDefault(); setTouched(true); if (valid) { setStep('otp'); setResend(60); } }}>
        <Stack gap="md">
          <TextInput label="Họ và tên" size="md" leftSection={<IconUser size={18} />} value={name} onChange={(e) => setName(e.currentTarget.value)}
            error={touched && name.trim().length < 2 ? 'Vui lòng nhập họ tên' : null} autoComplete="name" />
          <TextInput label="Email công việc" type="email" size="md" leftSection={<IconMail size={18} />} value={email} onChange={(e) => setEmail(e.currentTarget.value.trim())}
            error={touched && !EMAIL_RE.test(email) ? 'Email không hợp lệ' : null} autoComplete="email" />
          <Box>
            <PasswordInput label="Mật khẩu" size="md" leftSection={<IconLock size={18} />} value={pw} onChange={(e) => setPw(e.currentTarget.value)}
              error={touched && score < 4 ? 'Mật khẩu chưa đủ mạnh' : null} autoComplete="new-password" />
            <Progress value={(score / 4) * 100} color={score < 2 ? 'red' : score < 4 ? 'yellow' : 'teal'} size={4} mt={8} radius="xl" />
            <Group gap="md" mt={6}>
              {RULES.map((r) => {
                const ok = r.re.test(pw);
                return <Group key={r.label} gap={4} c={ok ? 'teal.7' : 'dimmed'}>{ok ? <IconCheck size={12} /> : <IconX size={12} />}<Text fz="xs">{r.label}</Text></Group>;
              })}
            </Group>
          </Box>
          <Checkbox checked={agree} onChange={(e) => setAgree(e.currentTarget.checked)}
            error={touched && !agree ? 'Bạn cần đồng ý điều khoản' : null}
            label={<Text fz="sm">Tôi đồng ý với <Anchor fz="sm">Điều khoản sử dụng</Anchor> và <Anchor fz="sm">Chính sách bảo mật</Anchor></Text>} />
          <Button type="submit" size="md" fullWidth>Tạo tài khoản</Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
