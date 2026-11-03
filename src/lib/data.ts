// Dữ liệu mẫu (mock) — UI demo, chưa kết nối backend.

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Company = {
  id: string;
  name: string;
  shortName: string;
  taxCode: string;
  status: 'connected' | 'error' | 'syncing';
  autoSync: boolean;
  lastSync: string;
  invoices: number;
  color: string;
};

export const COMPANIES: Company[] = [
  { id: 'c1', name: 'Công ty Cổ phần Dịch vụ Du lịch Hải Đăng', shortName: 'Hải Đăng Travel', taxCode: '0312456782', status: 'connected', autoSync: true, lastSync: '2026-11-03T08:12:00', invoices: 1284, color: 'iris' },
  { id: 'c2', name: 'Công ty TNHH Thương mại Minh Khoa', shortName: 'Minh Khoa Trading', taxCode: '0108765438', status: 'syncing', autoSync: true, lastSync: '2026-11-03T07:40:00', invoices: 642, color: 'teal' },
  { id: 'c3', name: 'Hộ kinh doanh Lan Anh Bakery', shortName: 'Lan Anh Bakery', taxCode: '8034567810', status: 'error', autoSync: false, lastSync: '2026-10-29T21:05:00', invoices: 97, color: 'orange' },
];

export type InvoiceStatus = 'valid' | 'replaced' | 'adjusted' | 'cancelled';
export type Direction = 'in' | 'out';

export type LineItem = { name: string; unit: string; qty: number; price: number };

export type Invoice = {
  id: string;
  direction: Direction;
  symbol: string;
  number: string;
  issuedAt: string;
  partnerName: string;
  partnerTax: string;
  preTax: number;
  vatRate: number;
  vat: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  risk: 'none' | 'low' | 'high';
  paid: boolean;
  hasOriginal: boolean;
  tags: string[];
  items: LineItem[];
};

const SUPPLIERS = [
  ['Công ty CP Hàng không Sao Việt', '0100107518'],
  ['Công ty TNHH Khách sạn Biển Xanh', '4201234566'],
  ['Tổng Công ty Điện lực Miền Nam', '0300951119'],
  ['Công ty CP Viễn thông Ánh Dương', '0101245486'],
  ['Công ty TNHH Vận tải Phương Nam', '0314789667'],
  ['Công ty CP Xăng dầu Đại Phát', '0305567890'],
  ['Công ty TNHH Văn phòng phẩm Hồng Hà', '0108123455'],
  ['Công ty CP Phần mềm Mây Trắng', '0316654337'],
  ['Công ty TNHH Nhà hàng Bếp Việt', '0315998871'],
  ['Công ty CP Lữ hành Thiên Hà', '0102345677'],
];
const CUSTOMERS = [
  ['Công ty TNHH Sự kiện Ngôi Sao', '0317112231'],
  ['Công ty CP Đầu tư Hưng Thịnh', '0309887764'],
  ['Trường Quốc tế Bình Minh', '0312223347'],
  ['Công ty TNHH Dược phẩm An Khang', '0105556676'],
  ['Ngân hàng TMCP Phú Quý - CN Sài Gòn', '0300112240'],
  ['Công ty CP Bất động sản Hoàng Gia', '0316667784'],
];
const ITEMS: [string, string, number][] = [
  ['Vé máy bay HAN - SGN', 'vé', 1_850_000],
  ['Phòng Deluxe 2 đêm', 'phòng', 2_400_000],
  ['Tour Hạ Long 3N2Đ', 'khách', 4_200_000],
  ['Thuê xe 29 chỗ', 'chuyến', 6_500_000],
  ['Cước Internet cáp quang', 'tháng', 550_000],
  ['Tiền điện kỳ 10', 'kWh', 3_200],
  ['Giấy A4 Double A', 'ram', 78_000],
  ['Phí bản quyền phần mềm', 'năm', 12_000_000],
  ['Suất ăn đoàn', 'suất', 185_000],
  ['Xăng RON95', 'lít', 23_500],
  ['Bảo hiểm du lịch', 'người', 95_000],
];

const STATUSES: InvoiceStatus[] = ['valid', 'valid', 'valid', 'valid', 'valid', 'valid', 'adjusted', 'replaced', 'cancelled'];

export function generateInvoices(companyId: string, count = 140): Invoice[] {
  const seed = companyId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = mulberry32(seed * 977);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)]!;
  const out: Invoice[] = [];
  const end = new Date('2026-11-03').getTime();
  for (let i = 0; i < count; i++) {
    const direction: Direction = r() < 0.62 ? 'in' : 'out';
    const [partnerName, partnerTax] = direction === 'in' ? pick(SUPPLIERS) : pick(CUSTOMERS);
    const nItems = 1 + Math.floor(r() * 4);
    const items: LineItem[] = Array.from({ length: nItems }, () => {
      const [name, unit, base] = pick(ITEMS);
      const qty = unit === 'kWh' ? 800 + Math.floor(r() * 3000) : unit === 'lít' ? 50 + Math.floor(r() * 400) : 1 + Math.floor(r() * 12);
      return { name, unit, qty, price: Math.round((base * (0.85 + r() * 0.3)) / 100) * 100 };
    });
    const preTax = items.reduce((s, it) => s + it.qty * it.price, 0);
    const vatRate = pick([8, 8, 10, 10, 10, 5, 0]);
    const discount = r() < 0.15 ? Math.round((preTax * 0.03) / 1000) * 1000 : 0;
    const vat = Math.round(((preTax - discount) * vatRate) / 100);
    const issued = new Date(end - Math.floor(r() * 300) * 86400000 - Math.floor(r() * 86400000));
    const status = pick(STATUSES);
    const risk = r() < 0.07 ? 'high' : r() < 0.12 ? 'low' : 'none';
    out.push({
      id: `${companyId}-${i}`,
      direction,
      symbol: `${pick(['1', '2'])}C26T${pick(['AA', 'AB', 'HD', 'KM'])}`,
      number: String(100 + Math.floor(r() * 90000)).padStart(8, '0'),
      issuedAt: issued.toISOString(),
      partnerName,
      partnerTax,
      preTax,
      vatRate,
      vat,
      discount,
      total: preTax - discount + vat,
      status,
      risk,
      paid: r() < 0.7,
      hasOriginal: r() < 0.8,
      tags: r() < 0.25 ? [pick(['Công tác', 'Marketing', 'Vận hành', 'Dự án Q4'])] : [],
      items,
    });
  }
  return out.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export const STATUS_META: Record<InvoiceStatus, { label: string; color: string }> = {
  valid: { label: 'Hợp lệ', color: 'teal' },
  adjusted: { label: 'Điều chỉnh', color: 'yellow' },
  replaced: { label: 'Thay thế', color: 'blue' },
  cancelled: { label: 'Đã huỷ', color: 'red' },
};

export function monthlySeries(invoices: Invoice[]) {
  const map = new Map<string, { month: string; 'Đầu vào': number; 'Đầu ra': number; sortKey: string }>();
  for (const inv of invoices) {
    if (inv.status === 'cancelled') continue;
    const d = new Date(inv.issuedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, { month: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`, 'Đầu vào': 0, 'Đầu ra': 0, sortKey: key });
    const row = map.get(key)!;
    row[inv.direction === 'in' ? 'Đầu vào' : 'Đầu ra'] += inv.total / 1e6;
  }
  return [...map.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-10)
    .map(({ sortKey, ...rest }) => ({ ...rest, 'Đầu vào': Math.round(rest['Đầu vào']), 'Đầu ra': Math.round(rest['Đầu ra']) }));
}

// ---------- Gói dịch vụ ----------
export type PlanId = 'free' | 'pro' | 'plus';
export const DURATIONS = [
  { months: 1, discount: 40 },
  { months: 3, discount: 45 },
  { months: 6, discount: 50 },
  { months: 12, discount: 55, tag: 'Phổ biến' },
  { months: 24, discount: 60 },
  { months: 36, discount: 65, tag: 'Hời nhất' },
];

export const PLANS: {
  id: PlanId;
  name: string;
  tagline: string;
  base: number;
  features: string[];
  highlight?: string;
}[] = [
  {
    id: 'free',
    name: 'Starter',
    tagline: 'Làm quen, không giới hạn thời gian',
    base: 0,
    features: ['1 mã số thuế', 'Đồng bộ thủ công trên máy tính', '100 lượt tải hoá đơn gốc / tháng', 'Lưu trữ đám mây 12 tháng'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Cho kế toán quản lý nhiều doanh nghiệp',
    base: 75_000,
    features: ['Không giới hạn mã số thuế', 'Đồng bộ tự động trên máy tính', 'Không giới hạn lượt tải', 'Cảnh báo MST rủi ro', 'Xuất Excel / XML hàng loạt'],
  },
  {
    id: 'plus',
    name: 'Cloud+',
    tagline: 'Chạy 24/7 trên Cloud, không cần treo máy',
    base: 150_000,
    highlight: 'Không cần treo máy',
    features: ['Mọi tính năng của Pro', 'Đồng bộ trên Cloud theo lịch', 'Thông báo qua Email & Zalo', 'Đối soát tự động với sổ sách', 'Hỗ trợ ưu tiên 1-1'],
  },
];

export function priceOf(base: number, months: number) {
  const d = DURATIONS.find((x) => x.months === months)!;
  const original = base * months;
  const total = Math.round((original * (100 - d.discount)) / 100 / 250) * 250;
  return { original, total, perMonth: total / months, saved: original - total, discount: d.discount };
}

export const PAYMENTS = [
  { id: 'PAY-2610-0081', date: '2026-10-02', plan: 'Pro · 1 tháng', amount: 45_000, method: 'Chuyển khoản', status: 'Thành công' },
  { id: 'PAY-2607-0412', date: '2026-07-01', plan: 'Pro · 3 tháng', amount: 123_750, method: 'Chuyển khoản', status: 'Thành công' },
  { id: 'PAY-2604-0230', date: '2026-04-03', plan: 'Starter → Pro (dùng thử)', amount: 0, method: 'Khuyến mãi', status: 'Thành công' },
];

export const SYNC_LOG = [
  { id: 1, company: 'Hải Đăng Travel', at: '2026-11-03T08:12:00', added: 18, updated: 3, status: 'ok', duration: '42s' },
  { id: 2, company: 'Minh Khoa Trading', at: '2026-11-03T07:40:00', added: 7, updated: 0, status: 'running', duration: '—' },
  { id: 3, company: 'Lan Anh Bakery', at: '2026-10-29T21:05:00', added: 0, updated: 0, status: 'error', duration: '9s', message: 'Sai mật khẩu cổng hoá đơn điện tử' },
  { id: 4, company: 'Hải Đăng Travel', at: '2026-11-02T20:00:00', added: 26, updated: 1, status: 'ok', duration: '58s' },
  { id: 5, company: 'Minh Khoa Trading', at: '2026-11-02T20:00:00', added: 11, updated: 2, status: 'ok', duration: '31s' },
  { id: 6, company: 'Hải Đăng Travel', at: '2026-11-02T08:00:00', added: 9, updated: 0, status: 'ok', duration: '27s' },
];

export const DEVICES = [
  { id: 'd1', name: 'Chrome · Windows 11', location: 'TP. Hồ Chí Minh', lastActive: 'Đang hoạt động', current: true, kind: 'desktop' },
  { id: 'd2', name: 'InvoiceHubX Desktop · Windows', location: 'TP. Hồ Chí Minh', lastActive: '2 giờ trước', current: false, kind: 'app' },
  { id: 'd3', name: 'Safari · iPhone 16', location: 'Hà Nội', lastActive: '3 ngày trước', current: false, kind: 'mobile' },
];
