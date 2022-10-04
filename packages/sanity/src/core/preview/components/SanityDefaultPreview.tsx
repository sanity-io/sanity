import {DocumentIcon} from '@sanity/icons'
import imageUrlBuilder from '@sanity/image-url'
import {ImageUrlFitMode, isImage, isReference} from '@sanity/types'
import React, {
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
import {isRecord, isString} from '../../util'
import {_extractUploadState} from './_extractUploadState'
import {_previewComponents} from './_previewComponents'

function FallbackIcon() {
  return <DocumentIcon className="sanity-studio__preview-fallback-icon" />
}

export interface SanityDefaultPreviewProps extends Omit<PreviewProps, 'value'> {
  error?: Error | null
  icon?: ElementType | false
  value?: unknown
}

export function SanityDefaultPreview(props: SanityDefaultPreviewProps): ReactElement {
  const {
    description: descriptionProp,
    icon,
    layout,
    media: mediaProp,
    subtitle: subtitleProp,
    title: titleProp,
    value: valueProp,
    ...restProps
  } = props

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const imageBuilder = useMemo(() => imageUrlBuilder(client), [client])

  const component = (_previewComponents[layout || 'default'] ||
    _previewComponents.default) as ElementType<PreviewProps>

  const {_upload, value} = useMemo(() => {
    return valueProp ? _extractUploadState(valueProp) : {_upload: undefined, value: undefined}
  }, [valueProp])

  const description: PreviewProps['description'] =
    descriptionProp ||
    (isRecord(value) && value?.description ? String(value?.description) : undefined)

  const title: PreviewProps['title'] =
    titleProp || (isRecord(value) && value?.title ? String(value?.title) : undefined)

  const subtitle: PreviewProps['subtitle'] =
    subtitleProp || (isRecord(value) && value?.subtitle ? String(value?.subtitle) : undefined)

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

    // Render fallback icon
    return renderIcon
  }, [icon, mediaProp, renderIcon, renderMedia])

  return createElement(component, {
    imageUrl: _upload?.previewImage,
    progress: _upload?.progress,
    ...restProps,
    // @todo: fix `TS2769: No overload matches this call.`
    media: media as any,
    description,
    title,
    subtitle,
    value,
  })
}
