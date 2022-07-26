export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return (
    !!obj && typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]'
  )
}
