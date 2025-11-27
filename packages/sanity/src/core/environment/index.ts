/** @internal */
export const isDev: boolean = process.env.NODE_ENV !== 'production'

/** @internal */
export const isProd: boolean = !isDev
