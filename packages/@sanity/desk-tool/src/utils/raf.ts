/**
 * @internal
 */
export function raf(fn: () => void): () => void {
  const frameId = requestAnimationFrame(fn)

  return () => {
    cancelAnimationFrame(frameId)
  }
}

/**
 * This is a function for calling a callback insid a double `requestAnimationFrame` (RAF).
 * This is useful for reliably triggering animations.
 *
 * The reason for using a double RAF is a common "bug" in browsers.
 * See: https://stackoverflow.com/questions/44145740/how-does-double-requestanimationframe-work
 *
 * @internal
 */
export function raf2(fn: () => void): () => void {
  let innerDispose: (() => void) | null = null

  const outerDispose = raf(() => {
    innerDispose = raf(fn)
  })

  return () => {
    if (innerDispose) innerDispose()

    outerDispose()
  }
}
