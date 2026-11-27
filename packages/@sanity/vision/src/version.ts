import {version} from '../package.json'

declare global {
  /**
   * Replaced with this package's version by tsdown at build time (see `define` in
   * `tsdown.config.ts`). Undefined when running from source, in dev or in tests.
   */
  var __PKG_VERSION__: string | undefined
}

/**
 * `@sanity/vision` version stamped onto Vision telemetry events.
 * Preview publishes set `PKG_VERSION` for the package build. A studio's `PKG_BUILD_VERSION`
 * does not override this: that value describes the studio, not this package.
 * @internal
 */
export const VISION_VERSION =
  typeof __PKG_VERSION__ === 'string' ? __PKG_VERSION__ : `${version}-dev`
