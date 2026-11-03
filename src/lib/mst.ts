// Tra cứu & kiểm tra mã số thuế (MST)

const WEIGHTS = [31, 29, 23, 19, 17, 13, 7, 5, 3];

export type MstCheck =
  | { ok: true; kind: 'company' | 'branch'; normalized: string; parent: string }
  | { ok: false; reason: string };

/** Chuẩn hoá: bỏ khoảng trắng, dấu chấm; chấp nhận 13 số liền → thêm gạch nối */
export function normalizeMst(input: string) {
  const s = input.replace(/[\s.]/g, '');
  if (/^\d{13}$/.test(s)) return `${s.slice(0, 10)}-${s.slice(10)}`;
  return s;
}

/** Kiểm tra định dạng + chữ số kiểm tra (chữ số thứ 10) của MST */
export function checkMst(input: string): MstCheck {
  const m = normalizeMst(input);
  if (!m) return { ok: false, reason: 'Chưa nhập MST' };
  if (!/^\d{10}(-\d{3})?$/.test(m)) return { ok: false, reason: 'MST gồm 10 số, hoặc 13 số với đơn vị phụ thuộc (VD: 0101234567-001)' };
  const d = m.slice(0, 10).split('').map(Number);
  const sum = WEIGHTS.reduce((s, w, i) => s + w * d[i]!, 0);
  const check = 10 - (sum % 11);
  if (check !== d[9]) return { ok: false, reason: `Sai chữ số kiểm tra (chữ số thứ 10 phải là ${check > 9 ? 'không hợp lệ' : check})` };
  if (m.length > 10 && m.endsWith('-000')) return { ok: false, reason: 'Mã đơn vị phụ thuộc không được là 000' };
  return { ok: true, kind: m.length > 10 ? 'branch' : 'company', normalized: m, parent: m.slice(0, 10) };
}

export type MstResult = {
  taxCode: string;
  name: string;
  internationalName?: string;
  shortName?: string;
  address?: string;
  status?: 'active' | 'paused' | 'closed';
  source: 'vietqr' | 'demo';
  fetchedAt: string;
};

/** Dữ liệu mẫu cho bản demo khi không gọi được nguồn tra cứu */
const DEMO: Record<string, Omit<MstResult, 'taxCode' | 'source' | 'fetchedAt'>> = {
  '0100107518': { name: 'Công ty CP Hàng không Sao Việt', address: 'Long Biên, Hà Nội', status: 'active' },
  '0314789667': { name: 'Công ty TNHH Vận tải Phương Nam', address: 'Quận 7, TP. Hồ Chí Minh', status: 'closed' },
  '0316654337': { name: 'Công ty CP Phần mềm Mây Trắng', address: 'Thủ Đức, TP. Hồ Chí Minh', status: 'paused' },
  '0312456782': { name: 'Công ty Cổ phần Dịch vụ Du lịch Hải Đăng', address: 'Quận 3, TP. Hồ Chí Minh', status: 'active' },
};
export const DEMO_MSTS = Object.keys(DEMO);

/**
 * Tra cứu tên & địa chỉ theo MST qua API công khai của VietQR.
 * Nếu không gọi được (mạng, CORS, giới hạn lượt) → trả về dữ liệu mẫu khi có, hoặc ném lỗi.
 */
export async function lookupMst(mst: string, signal?: AbortSignal): Promise<MstResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    signal?.addEventListener('abort', () => ctrl.abort());
    const res = await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(mst)}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const json = (await res.json()) as { code?: string; desc?: string; data?: { id?: string; name?: string; internationalName?: string; shortName?: string; address?: string } | null };
      if (json.code === '00' && json.data?.name) {
        return {
          taxCode: json.data.id || mst,
          name: json.data.name,
          internationalName: json.data.internationalName || undefined,
          shortName: json.data.shortName || undefined,
          address: json.data.address || undefined,
          source: 'vietqr',
          fetchedAt,
        };
      }
      if (!DEMO[mst]) throw new NotFoundError(json.desc || 'Không tìm thấy doanh nghiệp với MST này');
    }
  } catch (e) {
    if (e instanceof NotFoundError) throw e;
    if (signal?.aborted) throw e;
    // lỗi mạng → thử dữ liệu mẫu bên dưới
  }
  const demo = DEMO[mst];
  if (demo) return { taxCode: mst, ...demo, source: 'demo', fetchedAt };
  throw new Error('Không kết nối được nguồn tra cứu. Kiểm tra mạng rồi thử lại.');
}

export class NotFoundError extends Error {}
