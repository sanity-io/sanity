import {type Card, type CardTone} from '@sanity/ui'
import {type ComponentProps, type ReactNode, useCallback, useEffect, useState} from 'react'

import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {FlexOverlay, Overlay, RatioBox} from './ImagePreview.styled'

interface Props {
  alt: string
  src?: string
}

export function ImagePreview(props: ComponentProps<typeof Card> & Props) {
  const {src, ...rest} = props
  const [isLoaded, setLoaded] = useState(false)

  useEffect(() => {
    /* set for when the src is being switched when the image input already had a image src
    - meaning it already had an asset */
    setLoaded(false)
  }, [src])

  const onLoadChange = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <RatioBox {...rest} tone="transparent">
      {!isLoaded && <OverlayComponent cardTone="transparent" content={<LoadingBlock showText />} />}
      {src && (
        <img
          src={src}
          data-testid="hotspot-image-input"
          alt={props.alt}
          onLoad={onLoadChange}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </RatioBox>
  )
}

function OverlayComponent({
  cardTone,
  content,
}: {
  cardTone: Exclude<CardTone, 'inherit'>
  content: ReactNode
}) {
  return (
    <Overlay padding={3} tone={cardTone}>
      <FlexOverlay direction="column" align="center" justify="center">
        {content}
      </FlexOverlay>
    </Overlay>
  )
}
