/** @internal */
export const isDev = process.env.NODE_ENV !== 'production'

/** @internal */
export const isProd = !isDev

/** @internal */
export {isStaging} from './isStaging'
