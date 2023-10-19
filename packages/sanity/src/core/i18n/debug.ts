/* eslint-disable no-process-env */
import type {TFunction} from 'i18next'

/**
 * Whether or not the debug mode for i18n should be enabled
 *
 * @internal
 */
export const DEBUG_I18N = Boolean(process.env.SANITY_STUDIO_DEBUG_I18N)

/**
 * If in debug mode, wrap the given `t` function in a function that adds a prefix and suffix to the
 * translated string. If not, return the original `t` function as-is.
 *
 * @param t - The `t` function to wrap
 * @returns The wrapped `t` function, or the original `t` function if not in debug mode
 * @internal
 */
export function maybeWrapT(t: TFunction): TFunction {
  return DEBUG_I18N ? (((...args: any) => `◤ ${t(...args)} ◢`) as any as TFunction) : t
}
