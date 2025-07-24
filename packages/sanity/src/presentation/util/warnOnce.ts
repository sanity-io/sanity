/** @internal */
export function defineWarnOnce() {
  let warned = false
  // oxlint-disable-next-line no-explicit-any
  return (...args: any[]): void => {
    if (!warned) {
      console.warn(...args)
      warned = true
    }
  }
}
