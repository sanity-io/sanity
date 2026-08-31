type ParsedApiVersion =
  | {kind: 'experimental'}
  | {kind: 'legacy'}
  | {kind: 'dated'; value: string}
  | {kind: 'unknown'}

/**
 * Returns true when `selected` does not satisfy `required`.
 *
 * `X` is the experimental API: it satisfies every requirement, and when it is
 * the requirement only `X` satisfies it. Dated versions compare
 * lexicographically. `v1` sits below every dated version and `X`.
 */
export function isApiVersionBelow(selected: string, required: string): boolean {
  const parsedSelected = parseApiVersion(selected)
  const parsedRequired = parseApiVersion(required)

  if (parsedSelected.kind === 'unknown' || parsedRequired.kind === 'unknown') {
    return false
  }

  if (parsedSelected.kind === 'experimental') {
    return false
  }

  if (parsedRequired.kind === 'experimental') {
    return true
  }

  if (parsedSelected.kind === 'legacy') {
    return parsedRequired.kind !== 'legacy'
  }

  if (parsedRequired.kind === 'legacy') {
    return false
  }

  return parsedSelected.value < parsedRequired.value
}

function parseApiVersion(version: string): ParsedApiVersion {
  const normalized = version.replace(/^v/i, '').trim()

  if (!normalized) {
    return {kind: 'unknown'}
  }

  if (normalized.toUpperCase() === 'X') {
    return {kind: 'experimental'}
  }

  if (normalized === '1') {
    return {kind: 'legacy'}
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return {kind: 'dated', value: normalized}
  }

  return {kind: 'unknown'}
}
