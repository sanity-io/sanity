const MAX_DEPTH = 3
const MAX_ENTRIES = 10
const MAX_STRING_LENGTH = 200

/** Formats invalid schema values for diagnostics without invoking their serialization hooks. */
export default function inspect(value: unknown): string {
  return formatValue(value, [])
}

function formatValue(value: unknown, ancestors: object[]): string {
  if (typeof value === 'string') {
    return JSON.stringify(
      value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...` : value,
    )
  }
  if (typeof value === 'function') {
    return value.name ? `[Function: ${value.name}]` : '[Function]'
  }
  if (typeof value === 'bigint') return `${value}n`
  if (Object.is(value, -0)) return '-0'
  if (value === null || typeof value !== 'object') return String(value)
  if (value instanceof Date) return Date.prototype.toString.call(value)
  if (value instanceof RegExp) return RegExp.prototype.toString.call(value)
  if (value instanceof Map) return '[Map]'
  if (value instanceof Set) return '[Set]'

  if (ancestors.includes(value)) return '[Circular]'
  if (ancestors.length >= MAX_DEPTH) return Array.isArray(value) ? '[Array]' : '[Object]'

  const parents = [...ancestors, value]
  if (Array.isArray(value)) {
    const entries = Array.from({length: Math.min(value.length, MAX_ENTRIES)}, (_, index) =>
      formatProperty(value, String(index), parents),
    )
    if (value.length > MAX_ENTRIES) entries.push('...')
    return entries.length ? `[ ${entries.join(', ')} ]` : '[]'
  }

  const keys = Object.keys(value)
  const entries = keys.slice(0, MAX_ENTRIES).map((key) => {
    const name =
      key.length <= MAX_STRING_LENGTH && /^[A-Za-z_$][\w$]*$/.test(key)
        ? key
        : formatValue(key, parents)
    return `${name}: ${formatProperty(value, key, parents)}`
  })
  if (keys.length > MAX_ENTRIES) entries.push('...')
  return entries.length ? `{ ${entries.join(', ')} }` : '{}'
}

function formatProperty(value: object, key: string, ancestors: object[]): string {
  const descriptor = Object.getOwnPropertyDescriptor(value, key)
  if (!descriptor) return 'undefined'
  if ('value' in descriptor) return formatValue(descriptor.value, ancestors)
  return descriptor.get ? '[Getter]' : '[Setter]'
}
