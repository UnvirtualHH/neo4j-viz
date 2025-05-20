export function darkenColor(color: number, amount: number): number {
  const r = ((color >> 16) & 0xff) - amount;
  const g = ((color >> 8) & 0xff) - amount;
  const b = (color & 0xff) - amount;
  return (
    ((Math.max(r, 0) << 16) | (Math.max(g, 0) << 8) | Math.max(b, 0)) >>> 0
  );
}
