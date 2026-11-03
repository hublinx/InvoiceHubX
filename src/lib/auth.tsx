'use client';

/**
 * Xác thực phía client cho bản UI demo.
 * - Phiên đăng nhập lưu ở localStorage (chỉ để demo — khi có backend sẽ thay bằng cookie/JWT do server cấp).
 * - Google: nếu có NEXT_PUBLIC_GOOGLE_CLIENT_ID thì dùng Google Identity Services thật,
 *   ngược lại dùng hộp chọn tài khoản ở chế độ demo.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export type Session = {
  name: string;
  email: string;
  picture?: string;
  method: 'password' | 'google' | 'google-demo';
  signedInAt: string;
};

type Auth = {
  ready: boolean;
  session: Session | null;
  signIn: (s: Omit<Session, 'signedInAt'>, remember?: boolean) => void;
  signOut: () => void;
};

const KEY = 'ihx-session';
const Ctx = createContext<Auth | null>(null);

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(read());
    setReady(true);
  }, []);

  const signIn = useCallback<Auth['signIn']>((s, remember = true) => {
    const full: Session = { ...s, signedInAt: new Date().toISOString() };
    try {
      (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(full));
      (remember ? sessionStorage : localStorage).removeItem(KEY);
    } catch { /* trình duyệt chặn storage — vẫn đăng nhập trong phiên hiện tại */ }
    setSession(full);
  }, []);

  const signOut = useCallback(() => {
    try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch { /* bỏ qua */ }
    try { window.google?.accounts.id.disableAutoSelect(); } catch { /* bỏ qua */ }
    setSession(null);
  }, []);

  return <Ctx.Provider value={{ ready, session, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}

/** Giải mã phần payload của ID token Google (JWT). Chỉ đọc thông tin hiển thị — việc xác minh chữ ký phải làm ở server. */
export function decodeGoogleCredential(credential: string) {
  const part = credential.split('.')[1] ?? '';
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  const json = decodeURIComponent(
    atob(b64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
  );
  return JSON.parse(json) as { email: string; name: string; picture?: string; email_verified?: boolean };
}

// ---------- Kiểu tối thiểu cho Google Identity Services ----------
type GsiButtonOptions = { theme?: 'outline' | 'filled_blue' | 'filled_black'; size?: 'large' | 'medium' | 'small'; text?: 'signin_with' | 'signup_with' | 'continue_with'; shape?: 'rectangular' | 'pill'; width?: number; locale?: string; logo_alignment?: 'left' | 'center' };
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: 'popup' | 'redirect'; auto_select?: boolean }) => void;
          renderButton: (el: HTMLElement, o: GsiButtonOptions) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

let gsiPromise: Promise<void> | null = null;
export function loadGsi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.accounts?.id) return Promise.resolve();
  gsiPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { gsiPromise = null; reject(new Error('Không tải được Google Sign-In')); };
    document.head.appendChild(s);
  });
  return gsiPromise;
}
