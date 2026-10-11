import {getRedirectTo} from '@sanity/preview-url-secret/get-redirect-to'
import {withoutSecretSearchParams} from '@sanity/preview-url-secret/without-secret-search-params'

/**
 * The route the preview is on, relative to the target origin. When the preview is on a preview mode enable URL
 * it's the route that URL redirects to.
 * @internal
 */
export function resolvePreviewLocationRoute(
  previewUrl: string | undefined,
  targetOrigin: string,
): string {
  const {pathname, search, hash} = withoutSecretSearchParams(
    getRedirectTo(new URL(previewUrl || '/', targetOrigin)),
  )

  return `${pathname}${search}${hash}`
}
