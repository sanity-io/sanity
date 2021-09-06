import React from 'react'
import {Box} from '@sanity/ui'
import {MediaDimensions} from './types'
import {MediaWrapper, InheritedText, Root} from './inlinePreview.styled'

interface InlinePreviewProps {
  title?: React.ReactNode | React.FC<{layout: 'inline'}>
  media?: React.ReactNode | React.FC<{dimensions: MediaDimensions; layout: 'default'}>
  children?: React.ReactNode
  mediaDimensions?: MediaDimensions
}

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 32,
  height: 32,
  fit: 'crop',
  aspect: 1,
}

export const InlinePreview: React.FunctionComponent<InlinePreviewProps> = (props) => {
  const {title, media, mediaDimensions = DEFAULT_MEDIA_DIMENSIONS, children} = props

  if (!title && !media) {
    return <span />
  }

  return (
    <Root>
      {media && (
        <MediaWrapper as="span">
          {typeof media === 'function' &&
            media({
              dimensions: mediaDimensions,
              layout: 'default',
            })}
          {typeof media !== 'function' && media}
          {React.isValidElement(media) && media}
        </MediaWrapper>
      )}
      <InheritedText marginRight={1}>
        {(typeof title === 'function' &&
          title({
            layout: 'inline',
          })) ||
          title}
      </InheritedText>
      {children && <Box as="span">{children}</Box>}
    </Root>
  )
}
