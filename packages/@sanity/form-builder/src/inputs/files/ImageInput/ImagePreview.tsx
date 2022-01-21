import React, {ComponentProps, useCallback, useState} from 'react'

import {AccessDeniedIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Card, Box, Heading, Text} from '@sanity/ui'
import {RatioBox, Overlay, FlexOverlay, SpinnerWrapper} from './ImagePreview.styled'

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

  const onLoadChange = useCallback(() => {
    setLoaded(true)
  }, [setLoaded])

  return (
    <RatioBox {...rest} style={{height: '30vh'}} tone="transparent">
      <Card data-container tone="inherit">
        {!isLoaded && <SpinnerWrapper muted />}
        <img src={src} data-testid="hotspot-image-input" alt={props.alt} onLoad={onLoadChange} />
      </Card>
      <Overlay justify="flex-end" padding={3} tone={tone} drag={drag}>
        {drag && (
          <FlexOverlay direction="column" align="center" justify="center">
            <Box marginBottom={3}>
              <Heading>
                <HoverIcon isRejected={isRejected} readOnly={readOnly} />
              </Heading>
            </Box>
            <HoverText isRejected={isRejected} readOnly={readOnly} />
          </FlexOverlay>
        )}
      </Overlay>
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
