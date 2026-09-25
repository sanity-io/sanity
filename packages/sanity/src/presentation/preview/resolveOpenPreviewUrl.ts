import {
  urlSearchParamPreviewPerspective,
  urlSearchParamPreviewVariant,
} from '@sanity/preview-url-secret/constants'

import {type PresentationPerspective, type PreviewUrlPreviewMode} from '../types'
import {createPreviewModeEnableUrl} from '../util/createPreviewModeEnableUrl'
import {encodeStudioPerspective} from '../util/encodeStudioPerspective'

interface OpenPreviewUrlOptions {
  previewLocationOrigin?: string
  previewLocationRoute: string
  perspective: PresentationPerspective
  previewMode: PreviewUrlPreviewMode | null
  previewUrlSecret: string | null
  targetOrigin: string
  variant: string | undefined
}

/** @internal */
export function resolveOpenPreviewUrl(options: OpenPreviewUrlOptions): string {
  const {
    perspective,
    previewLocationOrigin,
    previewLocationRoute,
    previewMode,
    previewUrlSecret,
    targetOrigin,
    variant,
  } = options
  const previewUrl = new URL(previewLocationRoute, previewLocationOrigin || targetOrigin)

  previewUrl.searchParams.set(
    urlSearchParamPreviewPerspective,
    encodeStudioPerspective(perspective),
  )
  if (variant) {
    previewUrl.searchParams.set(urlSearchParamPreviewVariant, variant)
  } else {
    previewUrl.searchParams.delete(urlSearchParamPreviewVariant)
  }

  if (!previewMode || !previewUrlSecret) {
    const {pathname, search, hash} = previewUrl
    return `${previewLocationOrigin}${pathname}${search}${hash}`
  }

  return createPreviewModeEnableUrl({
    enable: previewMode.enable,
    perspective,
    previewUrl,
    previewUrlSecret,
    variant,
  }).toString()
}
