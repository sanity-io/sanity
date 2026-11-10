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
  /**
   * The enable route redirects to a pathname on its own origin, so when it has the pathname of the preview page
   * it is that page: redirecting would redirect to the enable route itself, and it has to show the page instead
   */
  const isPreviewPage = url.pathname === previewUrl.pathname

  if (isPreviewPage) {
    const enableSearchParams = new Set(url.searchParams.keys())
    for (const [key, value] of previewUrl.searchParams) {
      if (!enableSearchParams.has(key)) {
        url.searchParams.append(key, value)
      }
    }
    if (!url.hash) {
      url.hash = previewUrl.hash
    }
  }

  url.searchParams.set(urlSearchParamPreviewSecret, previewUrlSecret)
  url.searchParams.set(urlSearchParamPreviewPerspective, encodeStudioPerspective(perspective))
  if (variant) {
    url.searchParams.set(urlSearchParamPreviewVariant, variant)
  } else {
    url.searchParams.delete(urlSearchParamPreviewVariant)
  }
  if (isPreviewPage) {
    url.searchParams.delete(urlSearchParamPreviewPathname)
  } else {
    url.searchParams.set(
      urlSearchParamPreviewPathname,
      `${previewUrl.pathname}${previewUrl.search}${previewUrl.hash}`,
    )
  }

  return url
}
