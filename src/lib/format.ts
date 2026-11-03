export const vnd = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫';
export const compact = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1).replace('.', ',') + ' tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + ' tr';
  if (n >= 1e3) return Math.round(n / 1e3) + 'k';
  return String(n);
};
export const dateVN = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
export const timeVN = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
};
export const initials = (name: string) =>
  name
    .replace(/^(công ty|cty)\s+(cổ phần|tnhh|tnhh mtv)?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
