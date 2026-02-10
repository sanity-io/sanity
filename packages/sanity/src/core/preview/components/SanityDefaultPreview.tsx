import {isImageSource, isSanityImageUrl, parseImageAssetUrl} from '@sanity/asset-utils'
import {type SanityClient} from '@sanity/client'
import {DocumentIcon, WarningOutlineIcon} from '@sanity/icons'
import {
  createImageUrlBuilder,
  type ImageUrlBuilder,
  type SanityImageSource,
} from '@sanity/image-url'
import {Card, Flex, Skeleton} from '@sanity/ui'
import {
  type ComponentType,
  type ElementType,
  isValidElement,
  memo,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {isValidElementType} from 'react-is'

import {Tooltip} from '../../../ui-components'
import {type PreviewMediaDimensions, type PreviewProps} from '../../components/previews'
import {useAccessPolicy} from '../../form/inputs/files/ImageInput/useAccessPolicy'
import {useImageUrl} from '../../form/inputs/files/ImageInput/useImageUrl'
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

type SanityDefaultMediaProps = {
  client: SanityClient
  dimensions: PreviewMediaDimensions
  imageSource: SanityImageSource
  imageUrlBuilder: ImageUrlBuilder
  title: PreviewProps['title']
}

function SanityDefaultMedia({
  client,
  dimensions,
  imageSource,
  imageUrlBuilder,
  title,
}: SanityDefaultMediaProps) {
  const transform = (builder: ImageUrlBuilder, val: SanityImageSource) => {
    const width = dimensions.width ?? 100
    const height = dimensions.height ?? 100
    const fit = dimensions.fit
    const dpr = dimensions.dpr ?? 1

    return builder.image(val).withOptions({width, height, fit, dpr}).url() || ''
  }

  const accessPolicy = useAccessPolicy({client, source: imageSource})

  const {isLoading, url} = useImageUrl({
    accessPolicy,
    imageSource,
    imageUrlBuilder,
    transform,
  })

  const [hasImageError, setHasImageError] = useState(false)
  const handleError = () => setHasImageError(true)

  if (isLoading) {
    return <Skeleton animated style={{width: '100%', height: '100%'}} />
  }

  // Show a warning if we have a media library asset that we couldn't check
  // the access policy for (e.g., cookie auth) and the image failed to load
  const showAccessWarning = accessPolicy === 'unknown' && hasImageError

  if (showAccessWarning) {
    return (
      <Card tone="critical" style={{width: '100%', height: '100%'}}>
        <Flex justify="center" align="center" style={{width: '100%', height: '100%'}}>
          <WarningOutlineIcon />
        </Flex>
      </Card>
    )
  }

  return (
    <img
      alt={typeof title === 'string' ? title : undefined}
      onError={handleError}
      referrerPolicy="strict-origin-when-cross-origin"
      src={url}
    />
  )
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
  const imageBuilder = useMemo(() => createImageUrlBuilder(client), [client])

  // NOTE: This function exists because the previews provides options
  // for the rendering of the media (dimensions)
  const renderMedia = useCallback(
    (options: {dimensions: PreviewMediaDimensions}) => {
      let imageSource = mediaProp

      // If this is a string and a valid Sanity Image URL, parse it so that we can
      // pass it as a valid asset ID to the image builder
      if (isString(imageSource) && isSanityImageUrl(imageSource)) {
        const {assetId} = parseImageAssetUrl(imageSource)

        imageSource = assetId
      }

      return (
        <SanityDefaultMedia
          client={client}
          dimensions={options.dimensions}
          imageSource={imageSource as SanityImageSource}
          imageUrlBuilder={imageBuilder}
          title={title}
        />
      )
    },
    [client, imageBuilder, mediaProp, title],
  )

  const renderIcon = useCallback(() => {
    return Icon ? <Icon /> : <FallbackIcon />
  }, [Icon])

  const media = useMemo(() => {
    if (Icon === false) {
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
