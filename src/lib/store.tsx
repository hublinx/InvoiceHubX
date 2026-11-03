'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { notifications } from '@mantine/notifications';
import { COMPANIES, generateInvoices, type Company, type Invoice, type PlanId } from './data';

type Store = {
  user: { name: string; email: string; phone: string; joinedAt: string };
  setUser: (u: Store['user']) => void;
  companies: Company[];
  activeId: string;
  active: Company;
  setActiveId: (id: string) => void;
  addCompany: (c: Pick<Company, 'name' | 'taxCode'>) => void;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  removeCompany: (id: string) => void;
  invoices: Invoice[];
  plan: { id: PlanId; expiresAt: string; startedAt: string };
  setPlan: (p: Store['plan']) => void;
  quota: { used: number; total: number };
  syncing: boolean;
  syncNow: () => void;
};

const Ctx = createContext<Store | null>(null);

const COLORS = ['grape', 'cyan', 'pink', 'indigo', 'lime'];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState({ name: 'Trần Minh Hưng', email: 'demo@invoicehubx.vn', phone: '0900 000 000', joinedAt: '2026-02-11' });
  const [companies, setCompanies] = useState<Company[]>(COMPANIES);
  const [activeId, setActiveId] = useState(COMPANIES[0]!.id);
  const [plan, setPlan] = useState<Store['plan']>({ id: 'pro', startedAt: '2026-10-02', expiresAt: '2026-12-02' });
  const [syncing, setSyncing] = useState(false);

  const active = companies.find((c) => c.id === activeId) ?? companies[0]!;
  const invoices = useMemo(() => generateInvoices(active.id), [active.id]);

  const syncNow = useCallback(() => {
    if (syncing) return;
    setSyncing(true);
    const id = notifications.show({
      loading: true,
      title: `Đang đồng bộ ${active.shortName}`,
      message: 'Kết nối cổng hoá đơn điện tử của Tổng cục Thuế…',
      autoClose: false,
      withCloseButton: false,
    });
    setTimeout(() => {
      setSyncing(false);
      setCompanies((cs) => cs.map((c) => (c.id === active.id ? { ...c, status: 'connected', lastSync: new Date().toISOString() } : c)));
      notifications.update({
        id,
        loading: false,
        color: 'teal',
        title: 'Đồng bộ hoàn tất',
        message: `Đã cập nhật ${Math.floor(Math.random() * 20) + 3} hoá đơn mới cho ${active.shortName}.`,
        autoClose: 3500,
        withCloseButton: true,
      });
    }, 2200);
  }, [active, syncing]);

  const value: Store = {
    user,
    setUser,
    companies,
    activeId: active.id,
    active,
    setActiveId,
    addCompany: ({ name, taxCode }) => {
      const id = 'c' + Date.now();
      setCompanies((cs) => [
        ...cs,
        {
          id,
          name,
          taxCode,
          shortName: name.replace(/^(công ty|cty)\s+(cổ phần|tnhh)?\s*/i, '').slice(0, 24),
          status: 'connected',
          autoSync: true,
          lastSync: new Date().toISOString(),
          invoices: 0,
          color: COLORS[cs.length % COLORS.length]!,
        },
      ]);
      setActiveId(id);
    },
    updateCompany: (id, patch) => setCompanies((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    removeCompany: (id) => {
      setCompanies((cs) => {
        const next = cs.filter((c) => c.id !== id);
        if (id === activeId && next[0]) setActiveId(next[0].id);
        return next.length ? next : cs;
      });
    },
    invoices,
    plan,
    setPlan,
    quota: { used: 312, total: plan.id === 'free' ? 100 : Infinity },
    syncing,
    syncNow,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
