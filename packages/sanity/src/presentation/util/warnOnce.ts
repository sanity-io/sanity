/** @internal */
export function defineWarnOnce() {
  let warned = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]): void => {
    if (!warned) {
      // eslint-disable-next-line no-console
      console.warn(...args)
      warned = true
    }
  }
}
