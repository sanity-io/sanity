import React from 'react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {MediaDimensions, PreviewProps} from './types'
import {RootDiv, MediaDiv, TextSpan} from './inlinePreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 32,
  height: 32,
  fit: 'crop',
  aspect: 1,
  dpr: getDevicePixelRatio(),
}

export const InlinePreview: React.FunctionComponent<PreviewProps<'inline'>> = (props) => {
  const {title, media, mediaDimensions = DEFAULT_MEDIA_DIMENSIONS} = props

  return (
    <RootDiv>
      <MediaDiv>
        {typeof media === 'function' &&
          media({
            dimensions: mediaDimensions,
            layout: 'inline',
          })}
        {typeof media !== 'function' && media}
        {React.isValidElement(media) && media}
      </MediaDiv>
      <TextSpan forwardedAs="span">
        <div>
          <span>{title}</span>
        </div>
      </TextSpan>
    </RootDiv>
  )
}
