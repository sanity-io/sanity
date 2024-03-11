export function omit<T, K extends keyof T>(val: T, props: K[]): Omit<T, K> {
  const copy = {...val}
  for (const prop of props) {
    delete copy[prop]
  }
  return copy
}
