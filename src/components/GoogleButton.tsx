'use client';

import { Alert, Avatar, Badge, Box, Button, Divider, Group, Modal, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconChevronRight, IconInfoCircle, IconUserPlus } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { decodeGoogleCredential, GOOGLE_CLIENT_ID, loadGsi, type Session } from '@/lib/auth';

export function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

type Props = {
  label?: string;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onSuccess: (s: Omit<Session, 'signedInAt'>) => void;
};

const DEMO_ACCOUNTS = [
  { name: 'Trần Minh Hưng', email: 'demo@invoicehubx.vn' },
  { name: 'Kế toán Hải Đăng', email: 'ketoan.haidang@example.com' },
];

/** Hộp chọn tài khoản ở chế độ demo (khi chưa cấu hình Google Client ID) */
function DemoChooser({ opened, onClose, onPick }: { opened: boolean; onClose: () => void; onPick: Props['onSuccess'] }) {
  const [other, setOther] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && name.trim().length > 1;
  return (
    <Modal opened={opened} onClose={() => { onClose(); setOther(false); }} size={420} title={<Group gap={8}><GoogleLogo /><Text fw={700}>Tiếp tục với Google</Text></Group>}>
      <Alert color="yellow" variant="light" icon={<IconInfoCircle size={18} />} p="sm" mb="md">
        <Text fz="xs">Chế độ demo: chưa cấu hình Google Client ID nên không kết nối Google thật. Chọn một tài khoản mẫu để thử.</Text>
      </Alert>
      {!other ? (
        <Stack gap={0}>
          {DEMO_ACCOUNTS.map((a) => (
            <UnstyledButton key={a.email} onClick={() => onPick({ ...a, method: 'google-demo' })} py="sm" px={4} style={{ borderBottom: '1px solid var(--ihx-border)' }}>
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <Avatar radius="xl" color="iris">{a.name.split(' ').slice(-1)[0]![0]}</Avatar>
                  <Box><Text fz="sm" fw={600}>{a.name}</Text><Text fz="xs" c="dimmed">{a.email}</Text></Box>
                </Group>
                <IconChevronRight size={16} opacity={0.5} />
              </Group>
            </UnstyledButton>
          ))}
          <UnstyledButton onClick={() => setOther(true)} py="sm" px={4}>
            <Group gap="sm"><Avatar radius="xl" variant="default"><IconUserPlus size={18} /></Avatar><Text fz="sm" fw={600}>Dùng tài khoản khác</Text></Group>
          </UnstyledButton>
        </Stack>
      ) : (
        <Stack gap="sm">
          <TextInput label="Họ và tên" value={name} onChange={(e) => setName(e.currentTarget.value)} data-autofocus />
          <TextInput label="Email Google" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <Group justify="space-between" mt="xs">
            <Button variant="subtle" color="gray" onClick={() => setOther(false)}>Quay lại</Button>
            <Button disabled={!valid} onClick={() => onPick({ name: name.trim(), email: email.trim(), method: 'google-demo' })}>Tiếp tục</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}

/**
 * Nút "Đăng nhập với Google".
 * Có GOOGLE_CLIENT_ID → nút chính chủ của Google Identity Services; nếu không → nút demo.
 */
export function GoogleButton({ label = 'Tiếp tục với Google', text = 'continue_with', onSuccess }: Props) {
  const { ref: sizeRef, width } = useElementSize();
  const btnRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'loading' | 'real' | 'demo'>(GOOGLE_CLIENT_ID ? 'loading' : 'demo');
  const [chooser, setChooser] = useState(false);
  const cb = useRef(onSuccess);
  cb.current = onSuccess;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !width || !btnRef.current) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !btnRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          callback: ({ credential }) => {
            const p = decodeGoogleCredential(credential);
            cb.current({ name: p.name, email: p.email, picture: p.picture, method: 'google' });
          },
        });
        btnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline', size: 'large', shape: 'rectangular', text, locale: 'vi', logo_alignment: 'center',
          width: Math.min(400, Math.max(200, Math.floor(width))),
        });
        setMode('real');
      })
      .catch(() => !cancelled && setMode('demo'));
    return () => { cancelled = true; };
  }, [width, text]);

  return (
    <Box ref={sizeRef} w="100%">
      {GOOGLE_CLIENT_ID && <Box ref={btnRef} style={{ display: mode === 'real' ? 'flex' : 'none', justifyContent: 'center', minHeight: 44 }} />}
      {mode !== 'real' && (
        <>
          <Button
            fullWidth size="md" variant="default" loading={mode === 'loading'}
            leftSection={<GoogleLogo />}
            rightSection={mode === 'demo' ? <Badge size="xs" color="gray" variant="light">demo</Badge> : null}
            onClick={() => setChooser(true)}
            styles={{ label: { fontWeight: 600 } }}
          >
            {label}
          </Button>
          <DemoChooser opened={chooser} onClose={() => setChooser(false)} onPick={(s) => { setChooser(false); onSuccess(s); }} />
        </>
      )}
    </Box>
  );
}

export function OrDivider() {
  return <Divider my="lg" label={<Text fz="xs" c="dimmed">hoặc dùng email</Text>} labelPosition="center" />;
}
