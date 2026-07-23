import {version} from '../../package.json'

declare global {
  /**
   * Replaced with the published package version by tsdown at build time (see the `define` option
   * in `tsdown.config.ts`); undefined when running from source, e.g. in dev or test environments
   */
  var __PKG_VERSION__: string | undefined
}

let buildVersion: string | undefined
try {
  // this offers a way to override what version is displayed
  // currently used for test-studio preview builds to attach custom version details like git info
  buildVersion = process.env.PKG_BUILD_VERSION
} catch {
  // ignore, assume process.env is not defined by the runtime
}

/**
 * @hidden
 * @beta
 */
export const SANITY_VERSION =
  buildVersion || (typeof __PKG_VERSION__ === 'string' ? __PKG_VERSION__ : `${version}-dev`)
