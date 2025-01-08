import {isImageSource} from '@sanity/asset-utils'
import {DocumentIcon} from '@sanity/icons'
import imageUrlBuilder from '@sanity/image-url'
import {type SanityImageSource} from '@sanity/image-url/lib/types/types'
import {type ImageUrlFitMode} from '@sanity/types'
import {
  type ComponentType,
  type ElementType,
  isValidElement,
  memo,
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
export const SanityDefaultPreview = memo(function SanityDefaultPreview(
  props: SanityDefaultPreviewProps,
): React.JSX.Element {
  const {icon: Icon, layout, media: mediaProp, imageUrl, title, tooltip, ...restProps} = props

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const imageBuilder = useMemo(() => imageUrlBuilder(client), [client])

  // NOTE: This function exists because the previews provides options
  // for the rendering of the media (dimensions)
  const renderMedia = useCallback(
    (options: {
      dimensions: {width?: number; height?: number; fit: ImageUrlFitMode; dpr?: number}
    }) => {
      const {dimensions} = options
      const width = dimensions.width || 100
      const height = dimensions.height || 100

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
              .width(width)
              .height(height)
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
    return Icon ? <Icon /> : <FallbackIcon />
  }, [Icon])

  const media = useMemo(() => {
    if (Icon === false) {
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
  }, [Icon, imageUrl, mediaProp, renderIcon, renderMedia, title])

  const previewProps: Omit<PreviewProps, 'renderDefault'> = useMemo(
    () => ({
      ...restProps,
      // @todo: fix `TS2769: No overload matches this call.`
      media: media as any,
      title,
    }),
    [media, restProps, title],
  )

  const LayoutComponent = _previewComponents[layout || 'default'] as ComponentType<
    Omit<PreviewProps, 'renderDefault'>
  >

  const children = <LayoutComponent {...previewProps} />

  if (tooltip) {
    return (
      <Tooltip
        content={tooltip}
        disabled={!tooltip}
        fallbackPlacements={['top-end', 'bottom-end']}
        placement="right"
      >
        {/* Currently tooltips won't trigger without a wrapping element */}
        <div>{children}</div>
      </Tooltip>
    )
  }

  return children
})
SanityDefaultPreview.displayName = 'Memo(SanityDefaultPreview)'
