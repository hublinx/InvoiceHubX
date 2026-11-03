// QR minh hoạ (không quét được) — chỉ dùng cho bản demo UI.
export function FakeQr({ seed, size = 200 }: { seed: string; size?: number }) {
  const n = 29;
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296);
  const cells: [number, number][] = [];
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > 0.52) cells.push([x, y]);
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} rx={1.6} fill="#0a0b12" />
      <rect x={x + 1} y={y + 1} width={5} height={5} rx={1.1} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.8} fill="#5933ff" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${n + 2} ${n + 2}`} style={{ display: 'block' }} role="img" aria-label="Mã QR minh hoạ">
      <rect x={-1} y={-1} width={n + 2} height={n + 2} rx={2} fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x}.${y}`} x={x + 0.08} y={y + 0.08} width={0.84} height={0.84} rx={0.3} fill="#0a0b12" />)}
      {finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
      <rect x={n / 2 - 3} y={n / 2 - 3} width={6} height={6} rx={1.5} fill="#ccff1c" stroke="#fff" strokeWidth={0.6} />
      <text x={n / 2} y={n / 2 + 1.1} fontSize={3} fontWeight={900} textAnchor="middle" fill="#0a0b12">X</text>
    </svg>
  );
}
