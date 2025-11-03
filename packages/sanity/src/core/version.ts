import {version} from '../../package.json'

let buildVersion: string | undefined
try {
  // this offers a way to override what version is displayed
  // currently used for test-studio preview builds to attach custom version details like git info
  buildVersion = process.env.PKG_BUILD_VERSION
} catch {
  // ignore, assume process.env is not defined by the runtime
}

try {
  buildVersion =
    buildVersion ||
    // This is replaced by `@sanity/pkg-utils` at build time
    // and must always be references by its full static name, e.g. no optional chaining, no `if (process && process.env)` etc.
    process.env.PKG_VERSION
} catch {
  // ignore, assuming process.env is not defined by the runtime
  // note: this should normally not happen when running from a production build built by pkg-utils
  // but could happen when using other build tools or running directly from source, e.g. in a dev or test environment
}

/**
 * @hidden
 * @beta
 */
export const SANITY_VERSION = buildVersion || `${version}-dev`
