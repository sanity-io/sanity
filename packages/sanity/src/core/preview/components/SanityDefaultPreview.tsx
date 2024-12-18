import {isImageSource, isSanityImageUrl, parseImageAssetUrl} from '@sanity/asset-utils'
import {DocumentIcon} from '@sanity/icons'
import imageUrlBuilder from '@sanity/image-url'
import {type SanityImageSource} from '@sanity/image-url/lib/types/types'
import {type ImageUrlFitMode} from '@sanity/types'
import {
  type ComponentType,
  createElement,
  type ElementType,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react'
import {isValidElementType} from 'react-is'

import {Tooltip} from '../../../ui-components'
import {type PreviewProps} from '../../components/previews'
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
  tooltip?: ReactNode
}

/**
 * Used in cases where no custom preview component is provided
 * @internal
 * */
export function SanityDefaultPreview(props: SanityDefaultPreviewProps): ReactElement {
  const {icon, layout, media: mediaProp, imageUrl, title, tooltip, ...restProps} = props

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const imageBuilder = useMemo(() => imageUrlBuilder(client), [client])

  // NOTE: This function exists because the previews provides options
  // for the rendering of the media (dimensions)
  const renderMedia = useCallback(
    (options: {
      dimensions: {width?: number; height?: number; fit: ImageUrlFitMode; dpr?: number}
    }) => {
      const {dimensions} = options
      let imageSource = mediaProp

      // If this is a string and a valid Sanity Image URL, parse it so that we can
      // pass it as a valid asset ID to the image builder
      if (isString(imageSource) && isSanityImageUrl(imageSource)) {
        const {assetId} = parseImageAssetUrl(imageSource)

        imageSource = assetId
      }

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

    // If this is a string and a valid Sanity Image URL, pass it to the renderMedia function early
    // If we don't do this check early, then isValidElementType will return true for strings and create an
    // exception when used inside the BlockImagePreview
    if (isString(mediaProp) && isSanityImageUrl(mediaProp)) {
      return renderMedia
    }

    if (isImageSource(mediaProp)) {
      return renderMedia
    }

    if (isValidElementType(mediaProp)) {
      return mediaProp
    }

    if (isValidElement(mediaProp)) {
      return mediaProp
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

  if (tooltip) {
    return (
      <Tooltip
        content={tooltip}
        disabled={!tooltip}
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
