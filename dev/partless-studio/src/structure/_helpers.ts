// For testing. Bump the timeout to introduce som lag
export function delayValue<T>(val: T, ms = 10): Promise<T> {
  return new Promise((resolve) => setTimeout(resolve, ms, val))
}
