import {DocumentIcon} from '@sanity/icons'
import imageUrlBuilder from '@sanity/image-url'
import {ImageUrlFitMode, isImage, isReference} from '@sanity/types'
import React, {
  ComponentType,
  createElement,
  ElementType,
  isValidElement,
  ReactElement,
  useCallback,
  useMemo,
} from 'react'
import {isValidElementType} from 'react-is'
import {PreviewProps} from '../../components/previews'
import {useClient} from '../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {isString} from '../../util'
import {_previewComponents} from './_previewComponents'

function FallbackIcon() {
  return <DocumentIcon className="sanity-studio__preview-fallback-icon" />
}

/** @internal */
export interface SanityDefaultPreviewProps
  extends Omit<PreviewProps, 'value' | 'renderDefault' | 'schemaType'> {
  error?: Error | null
  icon?: ElementType | false
}

/**
 * @internal
 * */
export function SanityDefaultPreview(props: SanityDefaultPreviewProps): ReactElement {
  const {icon, layout, media: mediaProp, imageUrl, title, ...restProps} = props

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const imageBuilder = useMemo(() => imageUrlBuilder(client), [client])

  const component = _previewComponents[layout || 'default'] || _previewComponents.default

  // NOTE: This function exists because the previews provides options
  // for the rendering of the media (dimensions)
  const renderMedia = useCallback(
    (options: {
      dimensions: {width?: number; height?: number; fit: ImageUrlFitMode; dpr?: number}
    }) => {
      if (!isImage(mediaProp)) {
        return null
      }

      const {dimensions} = options

      // Handle sanity image
      return (
        <img
          alt={isString(title) ? title : undefined}
          referrerPolicy="strict-origin-when-cross-origin"
          src={
            imageBuilder
              .image(mediaProp)
              .width(dimensions.width || 100)
              .height(dimensions.height || 100)
              .fit(dimensions.fit)
              .dpr(dimensions.dpr || 1)
              .url() || ''
          }
        />
      )
    },
    [imageBuilder, mediaProp, title]
  )

  const renderIcon = useCallback(() => {
    return createElement(icon || FallbackIcon)
  }, [icon])

  const media = useMemo(() => {
    if (icon === false) {
      // Explicitly disabled
      return false
    }

    if (isValidElementType(mediaProp)) {
      return mediaProp
    }

    if (isValidElement(mediaProp)) {
      return mediaProp
    }

    // If the asset is on media
    if (isReference(mediaProp) && mediaProp._type === 'reference') {
      return renderMedia
    }

    // Handle sanity image
    if (isImage(mediaProp)) {
      return renderMedia
    }

    // Handle image urls
    if (isString(imageUrl)) {
      return (
        <img
          src={imageUrl}
          alt={isString(title) ? title : undefined}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )
    }

    // Render fallback icon
    return renderIcon
  }, [icon, imageUrl, mediaProp, renderIcon, renderMedia])

  const previewProps: Omit<PreviewProps, 'renderDefault'> = useMemo(
    () => ({
      ...restProps,
      // @todo: fix `TS2769: No overload matches this call.`
      media: media as any,
      title,
    }),
    [media, restProps, title]
  )
  return createElement(
    component as ComponentType<Omit<PreviewProps, 'renderDefault'>>,
    previewProps
  )
}
