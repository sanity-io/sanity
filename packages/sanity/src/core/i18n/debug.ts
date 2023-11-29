/* eslint-disable no-process-env */
import type {TFunction} from 'i18next'

/**
 * Mode to use for debugging. `reverse`, `triangles` or `log`.
 */
const DEBUG_MODE = process.env.SANITY_STUDIO_DEBUG_I18N

/**
 * Whether or not the debug mode for i18n should be enabled
 *
 * @internal
 */
export const DEBUG_I18N = Boolean(DEBUG_MODE)

/**
 * Wrapper function use for debugging. The "reverse" approach is less disruptive to the layout, but
 * may be hard to use since it is hard to read labels. The "triangles" approach is easy to spot.
 */
const debugWrappers = {
  reverse: (str: string) => `‮${str}`,
  triangles: (str: string) => `◤ ${str} ◢`,
}

/**
 * If in debug mode, wrap the given `t` function in a function that adds a prefix and suffix to the
 * translated string. If not, return the original `t` function as-is.
 *
 * @param t - The `t` function to wrap
 * @returns The wrapped `t` function, or the original `t` function if not in debug mode
 * @internal
 */
export function maybeWrapT(t: TFunction): TFunction {
  const wrapper =
    DEBUG_MODE === 'reverse' || DEBUG_MODE === 'triangles' ? debugWrappers[DEBUG_MODE] : null

  return wrapper ? (((...args: any) => wrapper(t(...args)) as any) as TFunction) : t
}
