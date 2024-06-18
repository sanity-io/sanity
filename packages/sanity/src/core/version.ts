import {version} from '../../package.json'
/**
 * This version is provided by `@sanity/pkg-utils` at build time
 * @hidden
 * @beta
 */
export const SANITY_VERSION = process.env.PKG_VERSION || `${version}-development`
