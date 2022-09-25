export function keysOf<T extends object>(value: T) {
  return Object.keys(value) as (keyof T)[]
}
