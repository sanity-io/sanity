export function prefixApiVersion(version: string): string {
  if (version[0] !== 'v' && version !== 'other') {
    return `v${version}`
  }

  return version
}
