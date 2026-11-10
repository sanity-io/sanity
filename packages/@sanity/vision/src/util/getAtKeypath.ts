/** A dotted key path written the way it reads in code: `0.author.tags.1` as `[0].author.tags[1]` */
export function describeKeypath(keypath: string): string {
  return keypath
    .split('.')
    .map((segment, index) =>
      /^\d+$/.test(segment) ? `[${segment}]` : index === 0 ? segment : `.${segment}`,
    )
    .join('')
}

/**
 * The value at one of `@rexxars/react-json-inspector`'s dotted key paths (`0.author.name`; empty
 * for the root). A key may contain dots itself, so at each step the longest run of segments that
 * names a property wins. Undefined when the path leads nowhere.
 */
export function getAtKeypath(data: unknown, keypath: string): {value: unknown} | undefined {
  if (keypath === '') return {value: data}
  const segments = keypath.split('.')
  let current = data
  let index = 0
  while (index < segments.length) {
    const container = current
    if (container === null || typeof container !== 'object') return undefined
    let end = segments.length
    while (end > index && !Object.hasOwn(container, segments.slice(index, end).join('.'))) end--
    if (end === index) return undefined
    current = Reflect.get(container, segments.slice(index, end).join('.'))
    index = end
  }
  return {value: current}
}
