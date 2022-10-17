const IGNORE_KEYS = ['_key', '_type', '_weak']

export function isEmptyItem(value: Record<string, unknown>): value is Record<never, never> {
  return Object.keys(value).every((key) => IGNORE_KEYS.includes(key))
}
