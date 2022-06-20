import {useCallback, useEffect} from 'react'

/**
 * Takes an effect callback and dependency array like {@link useEffect}.
 *
 * When dependencies change (including component mount, ala useEffect),
 * the effect will be invoked after <delay> milliseconds.
 *
 * The effect is debounced:
 * Delay restarts whenever dependencies change, and only the last
 * change to dependencies will be used.
 *
 * @param effect like {@link useEffect} callback. Can return a cleanup function. It is only used if the
 * effect actually triggers (ie, it was invoked after delay).
 * @param deps
 * @param delay in milliseconds. Passing 0 will make the effect trigger after rendering is done.
 */
export const useDebouncedEffect = (effect, deps, delay) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callback = useCallback(effect, deps)

  useEffect(() => {
    let cleanup
    const handler = setTimeout(() => {
      cleanup = callback()
    }, delay)

    return () => {
      clearTimeout(handler)
      typeof cleanup === 'function' && cleanup()
    }
  }, [callback, delay])
}
