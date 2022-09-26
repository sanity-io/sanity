export function getSizeDiff(prev: number | undefined, next: number | undefined): number {
  if (!prev || !next) {
    return 0
  }

  const increase = next - prev
  const pct = Math.round((increase / prev) * 100)

  return pct
}
