/** @internal */
export function parseSearchParams(s: string | undefined): Record<string, string | undefined> {
  if (!s) return {}

  const searchParams = new URLSearchParams(s)

  return Object.fromEntries(searchParams.entries())
}
