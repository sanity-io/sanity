/** Items whose key is not among the excluded items' keys. */
export function without<Item>(
  items: readonly Item[],
  excluded: readonly Item[],
  keyOf: (item: Item) => unknown = (item) => item,
): Item[] {
  const excludedKeys = new Set(excluded.map(keyOf))
  return items.filter((item) => !excludedKeys.has(keyOf(item)))
}
