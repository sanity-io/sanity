export function keysOf<T>(value: T) {
  return Object.keys(value) as (keyof T)[]
}
