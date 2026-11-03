// Đọc hoá đơn điện tử định dạng XML theo Thông tư 78/2021 & Quyết định 1450/QĐ-TCT
// Cấu trúc chính: HDon > DLHDon > (TTChung, NDHDon > (NBan, NMua, DSHHDVu, TToan)), MCCQT, DSCKS

import { numberToWords } from './accounting';
import { checkMst } from './mst';

export type Party = { name: string; taxCode: string; address: string; phone: string; email: string; bankAccount: string; bankName: string; buyerName?: string; customerCode?: string };
export type Item = { stt: string; kind: string; code: string; name: string; unit: string; qty: number; price: number; discountRate: number; discount: number; amount: number; vatRate: string };
export type Check = { level: 'ok' | 'warn' | 'error' | 'info'; title: string; detail?: string };
export type Signature = { role: string; subject: string; signingTime: string };

export type ParsedInvoice = {
  id: string;
  fileName: string;
  raw: string;
  general: { version: string; name: string; template: string; symbol: string; number: string; issuedAt: string; currency: string; exchangeRate: number; payment: string; providerTaxCode: string; adjusts?: string };
  seller: Party;
  buyer: Party;
  items: Item[];
  taxByRate: { rate: string; amount: number; vat: number }[];
  totals: { preTax: number; vat: number; discount: number; fees: number; total: number; words: string };
  cqtCode: string;
  signatures: Signature[];
  checks: Check[];
};

export class XmlInvoiceError extends Error {}

// ---------- tiện ích DOM không phụ thuộc namespace ----------
const kids = (el: Element | null | undefined, name: string): Element[] =>
  el ? Array.from(el.children).filter((c) => c.localName === name) : [];
const child = (el: Element | null | undefined, name: string) => kids(el, name)[0] ?? null;
const desc = (el: Element | Document | null | undefined, name: string): Element | null => {
  if (!el) return null;
  const all = el.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) if (all[i]!.localName === name) return all[i]!;
  return null;
};
const txt = (el: Element | null | undefined, name: string) => child(el, name)?.textContent?.trim() ?? '';
const num = (el: Element | null | undefined, name: string) => {
  const v = txt(el, name).replace(/\s/g, '');
  return v ? Number(v) || 0 : 0;
};

/** Thông tin khác (TTKhac > TTin > TTruong/DLieu) — một số nhà cung cấp đặt email, tên người mua ở đây */
function extra(el: Element | null, field: RegExp) {
  for (const t of kids(child(el, 'TTKhac'), 'TTin')) if (field.test(txt(t, 'TTruong'))) return txt(t, 'DLieu');
  return '';
}

function party(el: Element | null): Party {
  return {
    name: txt(el, 'Ten'),
    taxCode: txt(el, 'MST'),
    address: txt(el, 'DChi'),
    phone: txt(el, 'SDThoai'),
    email: txt(el, 'DCTDTu') || extra(el, /mail/i),
    bankAccount: txt(el, 'STKNHang'),
    bankName: txt(el, 'TNHang'),
    buyerName: txt(el, 'HVTNMHang') || undefined,
    customerCode: txt(el, 'MKHang') || undefined,
  };
}

const KIND: Record<string, string> = { '1': 'Hàng hoá, dịch vụ', '2': 'Khuyến mại', '3': 'Chiết khấu thương mại', '4': 'Ghi chú, diễn giải' };

const normWords = (s: string) =>
  s.toLowerCase().normalize('NFC')
    .replace(/[.,;:!]/g, ' ')
    .replace(/\blinh\b/g, 'lẻ').replace(/\bngàn\b/g, 'nghìn').replace(/\bchẵn\b|\bchẳn\b/g, '')
    .replace(/\bvnđ\b|\bvnd\b|\bđồng\b/g, '')
    .replace(/\s+/g, ' ').trim();

export function parseInvoiceXml(raw: string, fileName = 'hoa-don.xml'): ParsedInvoice {
  const doc = new DOMParser().parseFromString(raw, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new XmlInvoiceError('File không phải XML hợp lệ (lỗi cú pháp).');
  const hdon = desc(doc, 'HDon');
  const dl = desc(hdon ?? doc, 'DLHDon');
  if (!dl) throw new XmlInvoiceError('Không tìm thấy thẻ DLHDon — file không đúng định dạng hoá đơn điện tử theo TT78.');

  const tt = child(dl, 'TTChung');
  const nd = child(dl, 'NDHDon');
  const seller = party(child(nd, 'NBan'));
  const buyer = party(child(nd, 'NMua'));
  const ttoan = child(nd, 'TToan');

  const items: Item[] = kids(child(nd, 'DSHHDVu'), 'HHDVu').map((h) => ({
    stt: txt(h, 'STT'),
    kind: txt(h, 'TChat') || '1',
    code: txt(h, 'MHHDVu'),
    name: txt(h, 'THHDVu'),
    unit: txt(h, 'DVTinh'),
    qty: num(h, 'SLuong'),
    price: num(h, 'DGia'),
    discountRate: num(h, 'TLCKhau'),
    discount: num(h, 'STCKhau'),
    amount: num(h, 'ThTien'),
    vatRate: txt(h, 'TSuat'),
  }));

  const taxByRate = kids(child(ttoan, 'THTTLTSuat'), 'LTSuat').map((l) => ({ rate: txt(l, 'TSuat'), amount: num(l, 'ThTien'), vat: num(l, 'TThue') }));
  const totals = {
    preTax: num(ttoan, 'TgTCThue'),
    vat: num(ttoan, 'TgTThue'),
    discount: num(ttoan, 'TTCKTMai'),
    fees: kids(child(ttoan, 'DSLPhi'), 'LPhi').reduce((s, p) => s + num(p, 'TPhi'), 0),
    total: num(ttoan, 'TgTTTBSo'),
    words: txt(ttoan, 'TgTTTBChu'),
  };

  const ttHDLQuan = child(tt, 'TTHDLQuan');
  const general = {
    version: txt(tt, 'PBan'),
    name: txt(tt, 'THDon'),
    template: txt(tt, 'KHMSHDon'),
    symbol: txt(tt, 'KHHDon'),
    number: txt(tt, 'SHDon'),
    issuedAt: txt(tt, 'NLap'),
    currency: txt(tt, 'DVTTe') || 'VND',
    exchangeRate: num(tt, 'TGia') || 1,
    payment: txt(tt, 'HTTToan'),
    providerTaxCode: txt(tt, 'MSTTCGP'),
    adjusts: ttHDLQuan ? `${txt(ttHDLQuan, 'TCHDon') === '1' ? 'Thay thế' : 'Điều chỉnh'} HĐ ${txt(ttHDLQuan, 'KHHDCLQuan')} số ${txt(ttHDLQuan, 'SHDCLQuan')}` : undefined,
  };

  const cqtCode = desc(hdon ?? doc, 'MCCQT')?.textContent?.trim() ?? '';

  const signatures: Signature[] = [];
  const dscks = desc(hdon ?? doc, 'DSCKS');
  for (const [tag, role] of [['NBan', 'Người bán'], ['NMua', 'Người mua'], ['CQT', 'Cơ quan thuế'], ['CCKSKhac', 'Khác']] as const) {
    const node = child(dscks, tag);
    if (!node) continue;
    for (const sig of Array.from(node.getElementsByTagName('*')).filter((e) => e.localName === 'Signature')) {
      signatures.push({ role, subject: desc(sig, 'X509SubjectName')?.textContent?.trim() ?? '', signingTime: desc(sig, 'SigningTime')?.textContent?.trim() ?? '' });
    }
  }

  // ---------- Kiểm tra tự động ----------
  const checks: Check[] = [];
  const tol = Math.max(1, Math.round(totals.total * 1e-6));

  checks.push(cqtCode
    ? { level: 'ok', title: 'Có mã của cơ quan thuế', detail: cqtCode }
    : { level: 'info', title: 'Không có mã của cơ quan thuế', detail: 'Hoá đơn không mã hoặc file chưa được cấp mã. Đối chiếu trên cổng hoá đơn điện tử.' });

  for (const [label, p] of [['người bán', seller], ['người mua', buyer]] as const) {
    if (!p.taxCode) { if (label === 'người bán') checks.push({ level: 'error', title: 'Thiếu MST người bán' }); continue; }
    const c = checkMst(p.taxCode);
    checks.push(c.ok ? { level: 'ok', title: `MST ${label} hợp lệ`, detail: p.taxCode } : { level: 'error', title: `MST ${label} không hợp lệ`, detail: `${p.taxCode}: ${c.reason}` });
  }

  const goods = items.filter((i) => i.kind === '1' || i.kind === '2').reduce((s, i) => s + i.amount, 0);
  const tradeDiscount = items.filter((i) => i.kind === '3').reduce((s, i) => s + i.amount, 0);
  if (items.length) {
    const sumItems = goods - tradeDiscount;
    const diff = Math.abs(sumItems - totals.preTax);
    checks.push(diff <= tol
      ? { level: 'ok', title: 'Tổng tiền hàng khớp với các dòng hàng hoá' }
      : { level: 'warn', title: 'Tổng tiền hàng lệch so với cộng dòng', detail: `Cộng dòng ${sumItems.toLocaleString('vi-VN')} ≠ TgTCThue ${totals.preTax.toLocaleString('vi-VN')} (lệch ${diff.toLocaleString('vi-VN')})` });
  } else {
    checks.push({ level: 'warn', title: 'Hoá đơn không có dòng hàng hoá, dịch vụ' });
  }

  if (taxByRate.length) {
    const vatSum = taxByRate.reduce((s, r) => s + r.vat, 0);
    const d = Math.abs(vatSum - totals.vat);
    checks.push(d <= tol ? { level: 'ok', title: 'Tiền thuế theo từng thuế suất khớp tổng thuế' } : { level: 'warn', title: 'Tiền thuế theo thuế suất lệch tổng thuế', detail: `Lệch ${d.toLocaleString('vi-VN')}` });
  }

  const expected = totals.preTax + totals.vat + totals.fees - totals.discount;
  const d2 = Math.abs(expected - totals.total);
  checks.push(d2 <= tol
    ? { level: 'ok', title: 'Tổng thanh toán = tiền hàng + thuế' }
    : { level: 'error', title: 'Tổng thanh toán không khớp', detail: `Tiền hàng + thuế${totals.fees ? ' + phí' : ''}${totals.discount ? ' − chiết khấu' : ''} = ${expected.toLocaleString('vi-VN')}, trên hoá đơn ghi ${totals.total.toLocaleString('vi-VN')}` });

  if (totals.words && general.currency === 'VND') {
    const ok = normWords(totals.words) === normWords(numberToWords(totals.total));
    checks.push(ok ? { level: 'ok', title: 'Số tiền bằng chữ khớp bằng số' } : { level: 'warn', title: 'Số tiền bằng chữ có thể không khớp', detail: `Trên HĐ: “${totals.words}” — Đọc lại: “${numberToWords(totals.total)}”` });
  }

  checks.push(signatures.some((s) => s.role === 'Người bán')
    ? { level: 'ok', title: 'Có chữ ký số của người bán' }
    : { level: 'error', title: 'Không có chữ ký số của người bán' });

  if (general.issuedAt && new Date(general.issuedAt).getTime() > Date.now() + 86400000) checks.push({ level: 'warn', title: 'Ngày lập ở tương lai', detail: general.issuedAt });
  if (totals.total >= 5_000_000) checks.push({ level: 'info', title: 'Từ 5 triệu đồng', detail: 'Cần chứng từ thanh toán không dùng tiền mặt để được khấu trừ thuế GTGT đầu vào.' });
  if (general.adjusts) checks.push({ level: 'info', title: general.adjusts });

  return { id: `${fileName}-${general.symbol}-${general.number}-${Math.random().toString(36).slice(2, 6)}`, fileName, raw, general, seller, buyer, items, taxByRate, totals, cqtCode, signatures, checks };
}

export const RATE_LABEL = (r: string) => (r === 'KCT' ? 'Không chịu thuế' : r === 'KKKNT' ? 'Không kê khai, nộp thuế' : r || '—');
export const KIND_LABEL = (k: string) => KIND[k] ?? k;

/** Hoá đơn mẫu để dùng thử (dữ liệu giả) */
export const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <DLHDon Id="data">
    <TTChung>
      <PBan>2.0.1</PBan>
      <THDon>Hóa đơn giá trị gia tăng</THDon>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>C26TAA</KHHDon>
      <SHDon>00012874</SHDon>
      <NLap>2026-10-28</NLap>
      <DVTTe>VND</DVTTe>
      <TGia>1</TGia>
      <HTTToan>Chuyển khoản</HTTToan>
      <MSTTCGP>0100107518</MSTTCGP>
    </TTChung>
    <NDHDon>
      <NBan>
        <Ten>Công ty CP Hàng không Sao Việt</Ten>
        <MST>0100107518</MST>
        <DChi>Số 1 Đường Sân Bay, Long Biên, Hà Nội</DChi>
        <SDThoai>024 0000 0000</SDThoai>
        <STKNHang>0000123456789</STKNHang>
        <TNHang>Ngân hàng Demo</TNHang>
      </NBan>
      <NMua>
        <Ten>Công ty Cổ phần Dịch vụ Du lịch Hải Đăng</Ten>
        <MST>0312456782</MST>
        <DChi>Quận 3, TP. Hồ Chí Minh</DChi>
        <HVTNMHang>Trần Minh Hưng</HVTNMHang>
      </NMua>
      <DSHHDVu>
        <HHDVu>
          <TChat>1</TChat><STT>1</STT><MHHDVu>VE-HANSGN</MHHDVu>
          <THHDVu>Vé máy bay HAN - SGN (khứ hồi)</THHDVu><DVTinh>vé</DVTinh>
          <SLuong>6</SLuong><DGia>2450000</DGia><ThTien>14700000</ThTien><TSuat>8%</TSuat>
        </HHDVu>
        <HHDVu>
          <TChat>1</TChat><STT>2</STT><MHHDVu>HL-23KG</MHHDVu>
          <THHDVu>Hành lý ký gửi 23kg</THHDVu><DVTinh>kiện</DVTinh>
          <SLuong>6</SLuong><DGia>350000</DGia><ThTien>2100000</ThTien><TSuat>8%</TSuat>
        </HHDVu>
        <HHDVu>
          <TChat>1</TChat><STT>3</STT><MHHDVu>BH-DL</MHHDVu>
          <THHDVu>Bảo hiểm du lịch</THHDVu><DVTinh>người</DVTinh>
          <SLuong>6</SLuong><DGia>95000</DGia><ThTien>570000</ThTien><TSuat>KCT</TSuat>
        </HHDVu>
        <HHDVu>
          <TChat>3</TChat><STT>4</STT>
          <THHDVu>Chiết khấu thương mại đại lý 2%</THHDVu>
          <ThTien>336000</ThTien><TSuat>8%</TSuat>
        </HHDVu>
      </DSHHDVu>
      <TToan>
        <THTTLTSuat>
          <LTSuat><TSuat>8%</TSuat><ThTien>16464000</ThTien><TThue>1317120</TThue></LTSuat>
          <LTSuat><TSuat>KCT</TSuat><ThTien>570000</ThTien><TThue>0</TThue></LTSuat>
        </THTTLTSuat>
        <TgTCThue>17034000</TgTCThue>
        <TgTThue>1317120</TgTThue>
        <TTCKTMai>0</TTCKTMai>
        <TgTTTBSo>18351120</TgTTTBSo>
        <TgTTTBChu>Mười tám triệu ba trăm năm mươi mốt nghìn một trăm hai mươi đồng</TgTTTBChu>
      </TToan>
    </NDHDon>
  </DLHDon>
  <MCCQT Id="Id-MCCQT">00A1B2C3D4E5F60718293A4B5C6D7E8F90</MCCQT>
  <DSCKS>
    <NBan>
      <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
        <KeyInfo><X509Data><X509SubjectName>CN=CÔNG TY CP HÀNG KHÔNG SAO VIỆT, UID=MST:0100107518, L=Hà Nội, C=VN</X509SubjectName></X509Data></KeyInfo>
        <Object><SignatureProperties><SignatureProperty><SigningTime>2026-10-28T09:15:42</SigningTime></SignatureProperty></SignatureProperties></Object>
      </Signature>
    </NBan>
    <CQT>
      <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
        <KeyInfo><X509Data><X509SubjectName>CN=CỤC THUẾ (DEMO), C=VN</X509SubjectName></X509Data></KeyInfo>
        <Object><SignatureProperties><SignatureProperty><SigningTime>2026-10-28T09:15:50</SigningTime></SignatureProperty></SignatureProperties></Object>
      </Signature>
    </CQT>
  </DSCKS>
</HDon>`;
