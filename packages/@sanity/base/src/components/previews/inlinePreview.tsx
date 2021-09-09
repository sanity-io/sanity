import React from 'react'
import {Box} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {MediaDimensions, PreviewProps} from './types'
import {MediaWrapper, InheritedText, Root} from './inlinePreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 32,
  height: 32,
  fit: 'crop',
  aspect: 1,
  dpr: getDevicePixelRatio(),
}

export const InlinePreview: React.FunctionComponent<PreviewProps<'inline'>> = (props) => {
  const {title, media, mediaDimensions = DEFAULT_MEDIA_DIMENSIONS, children} = props

  if (!title && !media) {
    return <span />
  }

  return (
    <Root>
      {media && (
        <MediaWrapper marginRight={1}>
          {typeof media === 'function' &&
            media({
              dimensions: mediaDimensions,
              layout: 'inline',
            })}
          {typeof media !== 'function' && media}
          {React.isValidElement(media) && media}
        </MediaWrapper>
      )}
      <InheritedText marginRight={1}>
        {typeof title === 'function'
          ? title({
              layout: 'inline',
            })
          : title}
      </InheritedText>
      {children && <Box as="span">{children}</Box>}
    </Root>
  )
}
