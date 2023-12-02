import {DocumentIcon} from '@sanity/icons'
import imageUrlBuilder from '@sanity/image-url'
import {ImageUrlFitMode} from '@sanity/types'
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
import {SanityImageSource} from '@sanity/image-url/lib/types/types'
import {isImageSource} from '@sanity/asset-utils'
import {Tooltip} from '../../../ui'
import {PreviewProps} from '../../components/previews'
import {useClient} from '../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {isString} from '../../util'
import {_previewComponents} from './_previewComponents'

function FallbackIcon() {
  return <DocumentIcon className="sanity-studio__preview-fallback-icon" />
}

/** @internal */
export interface SanityDefaultPreviewProps extends Omit<PreviewProps, 'renderDefault'> {
  error?: Error | null
  icon?: ElementType | false
  tooltipLabel?: string
}

/**
 * Used in cases where no custom preview component is provided
 * @internal
 * */
export function SanityDefaultPreview(props: SanityDefaultPreviewProps): ReactElement {
  const {icon, layout, media: mediaProp, imageUrl, title, tooltipLabel, ...restProps} = props

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const imageBuilder = useMemo(() => imageUrlBuilder(client), [client])

  // NOTE: This function exists because the previews provides options
  // for the rendering of the media (dimensions)
  const renderMedia = useCallback(
    (options: {
      dimensions: {width?: number; height?: number; fit: ImageUrlFitMode; dpr?: number}
    }) => {
      const {dimensions} = options

      // Handle sanity image
      return (
        <img
          alt={isString(title) ? title : undefined}
          referrerPolicy="strict-origin-when-cross-origin"
          src={
            imageBuilder
              .image(
                mediaProp as SanityImageSource /*will only enter this code path if it's compatible*/,
              )
              .width(dimensions.width || 100)
              .height(dimensions.height || 100)
              .fit(dimensions.fit)
              .dpr(dimensions.dpr || 1)
              .url() || ''
          }
        />
      )
    },
    [imageBuilder, mediaProp, title],
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

    if (isImageSource(mediaProp)) {
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
  }, [icon, imageUrl, mediaProp, renderIcon, renderMedia, title])

  const previewProps: Omit<PreviewProps, 'renderDefault'> = useMemo(
    () => ({
      ...restProps,
      // @todo: fix `TS2769: No overload matches this call.`
      media: media as any,
      title,
    }),
    [media, restProps, title],
  )

  const layoutComponent = _previewComponents[layout || 'default']

  const children = createElement(
    layoutComponent as ComponentType<Omit<PreviewProps, 'renderDefault'>>,
    previewProps,
  )

  if (tooltipLabel) {
    return (
      <Tooltip
        content={tooltipLabel}
        disabled={!tooltipLabel}
        fallbackPlacements={['top-end']}
        placement="bottom-end"
      >
        {/* Currently tooltips won't trigger without a wrapping element */}
        <div>{children}</div>
      </Tooltip>
    )
  }

  return children
}
