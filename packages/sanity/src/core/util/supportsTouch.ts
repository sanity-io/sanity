/** @internal */
export const supportsTouch = (() => {
  return typeof window !== 'undefined' && 'ontouchstart' in window
})()
