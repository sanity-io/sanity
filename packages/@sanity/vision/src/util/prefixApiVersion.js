export default function prefixApiVersion(version) {
  if (version[0] !== 'v' && version !== 'other') {
    return `v${version}`
  }

  return version
}
