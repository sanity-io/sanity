const IGNORE_KEYS = ['_key', '_type', '_weak']

// oxlint-disable-next-line typescript/no-generated-empty-object-type -- the predicate deliberately narrows to "an object with no own keys"
export function isEmptyItem(value: Record<string, unknown>): value is Record<never, never> {
  return Object.keys(value).every((key) => IGNORE_KEYS.includes(key))
}
