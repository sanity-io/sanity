import {
  urlSearchParamPreviewPathname,
  urlSearchParamPreviewPerspective,
  urlSearchParamPreviewSecret,
  urlSearchParamPreviewVariant,
} from '@sanity/preview-url-secret/constants'

import {type PresentationPerspective} from '../types'
import {encodeStudioPerspective} from './encodeStudioPerspective'

/**
 * The URL of the preview mode `enable` route, which turns on preview mode and then redirects to `previewUrl`
 * @internal
 */
export function createPreviewModeEnableUrl(options: {
  enable: string
  perspective: PresentationPerspective
  previewUrl: URL
  previewUrlSecret: string
  variant: string | undefined
}): URL {
  const {enable, perspective, previewUrl, previewUrlSecret, variant} = options
  const url = new URL(enable, previewUrl)

  url.searchParams.set(urlSearchParamPreviewSecret, previewUrlSecret)
  url.searchParams.set(urlSearchParamPreviewPerspective, encodeStudioPerspective(perspective))
  if (variant) {
    url.searchParams.set(urlSearchParamPreviewVariant, variant)
  } else {
    url.searchParams.delete(urlSearchParamPreviewVariant)
  }
  /**
   * When the enable route is also the preview page, redirecting to the preview would redirect to the enable route itself
   */
  if (previewUrl.pathname !== url.pathname) {
    url.searchParams.set(
      urlSearchParamPreviewPathname,
      `${previewUrl.pathname}${previewUrl.search}${previewUrl.hash}`,
    )
  }

  return url
}
