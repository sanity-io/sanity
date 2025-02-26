export function ensureVersionPrefix(version: string): string {
  if (!version.startsWith('v')) {
    return `v${version}`
  }
  return version
}
