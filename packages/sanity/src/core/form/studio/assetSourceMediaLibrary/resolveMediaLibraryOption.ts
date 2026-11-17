import {type MediaLibraryResolver, type MediaLibraryResolverContext} from '@sanity/types'

/**
 * How long a resolver function may take before its result is ignored, in milliseconds.
 * Generous enough for a GROQ round trip or two; short enough that a stalled resolver
 * cannot hold up the asset source indefinitely.
 */
const DEFAULT_TIMEOUT_MS = 10_000

/**
 * Resolves an `options.mediaLibrary` option that is either a static value or a
 * {@link MediaLibraryResolver} function.
 *
 * - `undefined` resolves to `undefined` (the option is not configured).
 * - A non-function value is returned as-is.
 * - A function is called with `context` and awaited (sync or async), bounded by `timeoutMs`.
 *
 * Never throws: a resolver that throws, rejects or times out is reported with `console.error`
 * (naming `optionName`) and resolves to `undefined`, so a misbehaving resolver degrades to the
 * "not configured" behaviour instead of breaking the asset source.
 *
 * @internal
 */
export async function resolveMediaLibraryOption<T>(
  option: T | MediaLibraryResolver<T> | undefined,
  context: MediaLibraryResolverContext,
  opts: {timeoutMs?: number; optionName?: string} = {},
): Promise<T | undefined> {
  if (option === undefined) {
    return undefined
  }

  if (typeof option !== 'function') {
    return option
  }

  const {timeoutMs = DEFAULT_TIMEOUT_MS, optionName = 'option'} = opts
  const resolver = option as MediaLibraryResolver<T>

  let timer: ReturnType<typeof setTimeout> | undefined
  let timedOut = false

  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      timedOut = true
      console.error(
        `Media Library \`${optionName}\` resolver did not settle within ${timeoutMs}ms. Ignoring the option.`,
      )
      resolve(undefined)
    }, timeoutMs)
  })

  const resolution = (async (): Promise<T | undefined> => {
    try {
      return await resolver(context)
    } catch (error) {
      // A rejection after the timeout has already been reported adds nothing.
      if (!timedOut) {
        console.error(`Media Library \`${optionName}\` resolver threw. Ignoring the option.`, error)
      }
      return undefined
    }
  })()

  try {
    return await Promise.race([resolution, timeout])
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer)
    }
  }
}
