import React, {ComponentProps, useCallback, useEffect, useState} from 'react'

import {AccessDeniedIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Card, Box, Heading, Text} from '@sanity/ui'
import {MAX_HEIGHT, RatioBox, Overlay, FlexOverlay, SpinnerWrapper} from './ImagePreview.styled'

interface Props {
  readOnly?: boolean | null
  drag: boolean
  isRejected: boolean
  src: string
  alt: string
}

export function ImagePreview(props: ComponentProps<typeof Card> & Props) {
  const {drag, readOnly, isRejected, src, ...rest} = props
  const [isLoaded, setLoaded] = useState(false)

  const acceptTone = isRejected || readOnly ? 'critical' : 'primary'
  const tone = drag ? acceptTone : 'default'

  const [useInitialHeight, setUseInitialHeight] = useState(false)

  useEffect(() => {
    /* set for when the src is being switched when the image input already had a image src
    - meaning it already had an asset */
    setLoaded(false)
  }, [src])

  const onLoadChange = useCallback(({target: img}) => {
    const imgHeight = img.offsetWidth
    const maxHeightToPx = (MAX_HEIGHT * document.documentElement.clientHeight) / 100
    // convert from vh to px

    if (imgHeight > maxHeightToPx) {
      setUseInitialHeight(true)
    }

    setLoaded(true)
  }, [])

  return (
    <RatioBox {...rest} style={{height: useInitialHeight ? '30vh' : ''}} tone="transparent">
      <Card data-container tone="inherit">
        {!isLoaded && <OverlayComponent cardTone="transparent" drag content={<SpinnerWrapper />} />}
        <img src={src} data-testid="hotspot-image-input" alt={props.alt} onLoad={onLoadChange} />
      </Card>

      {drag && (
        <OverlayComponent
          cardTone={tone}
          drag={drag}
          content={
            <>
              <Box marginBottom={3}>
                <Heading>
                  <HoverIcon isRejected={isRejected} readOnly={readOnly} />
                </Heading>
              </Box>
              <HoverText isRejected={isRejected} readOnly={readOnly} />
            </>
          }
        />
      )}
    </RatioBox>
  )
}

function HoverIcon({isRejected, readOnly}) {
  if (isRejected) {
    return <AccessDeniedIcon />
  }
  if (readOnly) {
    return <ReadOnlyIcon />
  }
  return <ImageIcon />
}

function HoverText({isRejected, readOnly}) {
  let message = 'Drop image to upload'
  if (isRejected) {
    message = 'Cannot upload this file here'
  }
  if (readOnly) {
    message = 'This field is read only'
  }

  return <Text size={1}>{message}</Text>
}

function OverlayComponent({cardTone, drag, content}) {
  return (
    <Overlay justify="flex-end" padding={3} tone={cardTone} drag={drag}>
      <FlexOverlay direction="column" align="center" justify="center">
        {content}
      </FlexOverlay>
    </Overlay>
  )
}
