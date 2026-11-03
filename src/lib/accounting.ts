// Tiện ích nghiệp vụ kế toán. Các tham số pháp lý tập trung ở TAX_CONFIG để dễ cập nhật.

export const TAX_CONFIG = {
  /** Giảm trừ gia cảnh (đồng/tháng) */
  selfDeduction: 15_500_000,
  dependentDeduction: 6_200_000,
  /** Lương cơ sở — trần đóng BHXH, BHYT = 20 lần */
  baseSalary: 2_340_000,
  insurance: { bhxh: 0.08, bhyt: 0.015, bhtn: 0.01 },
  /** Lương tối thiểu vùng — trần đóng BHTN = 20 lần */
  regionMinWage: { I: 5_310_000, II: 4_730_000, III: 4_140_000, IV: 3_700_000 } as Record<string, number>,
  /** Biểu thuế luỹ tiến từng phần (thu nhập tính thuế/tháng) */
  pitBrackets: [
    { upTo: 5_000_000, rate: 0.05 },
    { upTo: 10_000_000, rate: 0.1 },
    { upTo: 18_000_000, rate: 0.15 },
    { upTo: 32_000_000, rate: 0.2 },
    { upTo: 52_000_000, rate: 0.25 },
    { upTo: 80_000_000, rate: 0.3 },
    { upTo: Infinity, rate: 0.35 },
  ],
  /** Ngưỡng phải có chứng từ thanh toán không dùng tiền mặt để được khấu trừ VAT */
  nonCashThreshold: 5_000_000,
};

// ---------- VAT ----------
export function vatFromNet(net: number, rate: number) {
  const vat = Math.round((net * rate) / 100);
  return { net, vat, gross: net + vat };
}
export function vatFromGross(gross: number, rate: number) {
  const net = Math.round(gross / (1 + rate / 100));
  return { net, vat: gross - net, gross };
}

// ---------- Đọc số thành chữ ----------
const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const UNITS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function readTriple(n: number, full: boolean): string {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10;
  const out: string[] = [];
  if (full || h > 0) out.push(DIGITS[h]!, 'trăm');
  if (t > 1) {
    out.push(DIGITS[t]!, 'mươi');
    if (u === 1) out.push('mốt');
    else if (u === 5) out.push('lăm');
    else if (u === 4) out.push('tư');
    else if (u > 0) out.push(DIGITS[u]!);
  } else if (t === 1) {
    out.push('mười');
    if (u === 5) out.push('lăm');
    else if (u > 0) out.push(DIGITS[u]!);
  } else if (u > 0) {
    if (full || h > 0) out.push('lẻ');
    out.push(DIGITS[u]!);
  }
  return out.join(' ');
}

export function numberToWords(input: number): string {
  let n = Math.round(Math.abs(input));
  if (n === 0) return 'Không đồng';
  const groups: number[] = [];
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]!;
    if (g === 0) continue;
    const words = readTriple(g, i < groups.length - 1);
    parts.push(UNITS[i] ? `${words} ${UNITS[i]}` : words);
  }
  const s = (input < 0 ? 'âm ' : '') + parts.join(' ') + ' đồng';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------- Thuế TNCN ----------
export function calcPit(gross: number, dependents: number, insuranceBase?: number, region = 'I') {
  const c = TAX_CONFIG;
  const salary = insuranceBase ?? gross;
  const base = Math.min(salary, c.baseSalary * 20);
  const bhxh = Math.round(base * c.insurance.bhxh);
  const bhyt = Math.round(base * c.insurance.bhyt);
  const bhtn = Math.round(Math.min(salary, (c.regionMinWage[region] ?? c.regionMinWage.I!) * 20) * c.insurance.bhtn);
  const insurance = bhxh + bhyt + bhtn;
  const deduction = c.selfDeduction + dependents * c.dependentDeduction;
  const taxable = Math.max(0, gross - insurance - deduction);
  let prev = 0, tax = 0;
  const rows = c.pitBrackets.map((b, i) => {
    const amount = Math.max(0, Math.min(taxable, b.upTo) - prev);
    const t = Math.round(amount * b.rate);
    tax += t;
    const row = { level: i + 1, from: prev, to: b.upTo, rate: b.rate, amount, tax: t };
    prev = b.upTo;
    return row;
  });
  return { gross, bhxh, bhyt, bhtn, insurance, deduction, taxable, tax, net: gross - insurance - tax, rows };
}

// ---------- Lịch hạn nộp ----------
export type Deadline = { date: string; title: string; detail: string; kind: 'GTGT' | 'TNCN' | 'TNDN' | 'Khác' };

export function upcomingDeadlines(today = new Date('2026-11-03')): Deadline[] {
  const y = today.getFullYear(), m = today.getMonth(); // 0-based
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (yy: number, mm: number, dd: number) => `${yy}-${pad(mm + 1)}-${pad(dd)}`;
  const lastDay = (yy: number, mm: number) => new Date(yy, mm + 1, 0).getDate();
  const list: Deadline[] = [];
  for (let k = 0; k < 4; k++) {
    const mm = (m + k) % 12, yy = y + Math.floor((m + k) / 12);
    const prevM = (mm + 11) % 12;
    list.push({ date: iso(yy, mm, 20), title: `Tờ khai thuế GTGT tháng ${prevM + 1}`, detail: 'Mẫu 01/GTGT — doanh nghiệp kê khai theo tháng', kind: 'GTGT' });
    list.push({ date: iso(yy, mm, 20), title: `Tờ khai thuế TNCN tháng ${prevM + 1}`, detail: 'Mẫu 05/KK-TNCN — nếu kê khai theo tháng', kind: 'TNCN' });
    if (mm % 3 === 0) {
      const q = Math.floor(prevM / 3) + 1;
      const d = iso(yy, mm, lastDay(yy, mm));
      list.push({ date: d, title: `Tờ khai GTGT / TNCN quý ${q}`, detail: 'Doanh nghiệp kê khai theo quý', kind: 'GTGT' });
      list.push({ date: d, title: `Tạm nộp thuế TNDN quý ${q}`, detail: 'Tạm nộp, không phải nộp tờ khai', kind: 'TNDN' });
    }
    if (mm === 0) list.push({ date: iso(yy, 0, 30), title: `Lệ phí môn bài năm ${yy}`, detail: 'Nộp lệ phí, chỉ nộp tờ khai khi có thay đổi', kind: 'Khác' });
  }
  list.push({ date: iso(y + 1, 2, 31), title: `Quyết toán TNDN & TNCN năm ${y}`, detail: 'Kèm báo cáo tài chính năm', kind: 'TNDN' });
  const t = today.getTime();
  return list.filter((d) => new Date(d.date).getTime() >= t).sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Tra cứu MST (mẫu) ----------
const KNOWN: Record<string, { name: string; address: string; status: 'active' | 'paused' | 'closed' }> = {
  '0100107518': { name: 'Công ty CP Hàng không Sao Việt', address: 'Long Biên, Hà Nội', status: 'active' },
  '0314789654': { name: 'Công ty TNHH Vận tải Phương Nam', address: 'Quận 7, TP. Hồ Chí Minh', status: 'closed' },
  '0316654321': { name: 'Công ty CP Phần mềm Mây Trắng', address: 'Thủ Đức, TP. Hồ Chí Minh', status: 'paused' },
};
export function lookupTaxCode(mst: string) {
  const k = KNOWN[mst];
  const seed = mst.split('').reduce((a, c) => a + Number(c || 0), 0);
  return {
    taxCode: mst,
    name: k?.name ?? `Công ty TNHH Thương mại Dịch vụ ${mst.slice(-4)}`,
    address: k?.address ?? ['Cầu Giấy, Hà Nội', 'Hải Châu, Đà Nẵng', 'Quận 1, TP. Hồ Chí Minh'][seed % 3]!,
    status: k?.status ?? 'active',
    taxOffice: mst.startsWith('01') ? 'Chi cục Thuế khu vực I' : mst.startsWith('03') ? 'Chi cục Thuế khu vực II' : 'Chi cục Thuế khu vực XII',
    issuedAt: `${2005 + (seed % 18)}-0${1 + (seed % 9)}-1${seed % 9}`,
    representative: ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Minh'][seed % 3]!,
  };
}
