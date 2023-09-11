/** @internal */
export function compileSearchParams(
  searchParams: Record<string, string | undefined> | undefined,
): string | undefined {
  if (!searchParams) return undefined

  const entries = Object.entries(searchParams).filter(([, v]) => typeof v === 'string' && v)

  if (entries.length === 0) return undefined

  return entries.reduce<string>((acc, [k, v], idx) => {
    const prefix = idx === 0 ? '?' : '&'
    return `${acc}${prefix}${k}=${v}`
  }, '')
}
