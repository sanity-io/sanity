/** @internal */
export const isDev = process.env.NODE_ENV !== 'production'

/** @internal */
export const isProd = !isDev

/**
 * Checks if the current environment is using staging or not.
 *
 * @internal
 */
// @ts-expect-error: __SANITY_STAGING__ is a global env variable set by the vite config
export const isStaging = typeof __SANITY_STAGING__ !== 'undefined' && __SANITY_STAGING__ === true
