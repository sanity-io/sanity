import {getSanityImportMapUrl} from './importMap'

function checkIsStaging(): boolean {
  // Check the build-time constant (traditional builds)
  // @ts-expect-error: __SANITY_STAGING__ is a global env variable set by the vite config
  if (typeof __SANITY_STAGING__ !== 'undefined' && __SANITY_STAGING__ === true) {
    return true
  }

  // Check the runtime global (set via <script> tag for auto-updating staging deploys).
  // Uses a property access that survives tree-shaking, unlike the bare identifier above.
  // @ts-expect-error: __SANITY_STAGING__ is not in the globalThis type but may be set at runtime
  if (typeof globalThis !== 'undefined' && globalThis.__SANITY_STAGING__ === true) {
    return true
  }

  // For auto-updating studios, check if the import map points to the staging CDN
  const importMapUrl = getSanityImportMapUrl()
  if (importMapUrl && importMapUrl.includes('sanity-cdn.work')) {
    return true
  }

  return false
}

/**
 * Whether the current environment is staging.
 *
 * Checks three signals:
 * 1. The `__SANITY_STAGING__` build-time constant (set by Vite's `define` when building with
 *    `SANITY_INTERNAL_ENV=staging`). This works for traditionally built studios.
 * 2. The `globalThis.__SANITY_STAGING__` runtime global. This survives tree-shaking (unlike the
 *    bare identifier above, which Vite replaces statically) and can be set by injecting a
 *    `<script>` tag before the module scripts run - used for auto-updating staging deploys
 *    where the studio code is loaded from the production CDN.
 * 3. The import map URL - auto-updating studios load packages from a CDN, and the CDN host
 *    encodes the environment (`sanity-cdn.work` for staging, `sanity-cdn.com` for production).
 *    Since the import map is how the code gets loaded, it's always available when this runs.
 *
 * @internal
 */
export const isStaging: boolean = checkIsStaging()
