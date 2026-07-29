import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'

/**
 * Resolves the API version to use for a query that may carry a `variant` option.
 *
 * Fetching with a variant is only supported on the variants API version, which takes precedence
 * over any other version the caller would otherwise use (e.g. the releases version for stacked
 * perspectives).
 *
 * Intended to be used with {@link versionedClient}:
 *
 * ```ts
 * versionedClient(client, variantApiVersion(variant, releaseApiVersion))
 * ```
 *
 * @internal
 */
export function variantApiVersion(
  variant: string | undefined,
  fallbackApiVersion?: string,
): string | undefined {
  return variant ? VARIANTS_STUDIO_CLIENT_OPTIONS.apiVersion : fallbackApiVersion
}
