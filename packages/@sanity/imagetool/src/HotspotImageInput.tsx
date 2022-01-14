import React, {useEffect, useRef, useState} from 'react'

import {AccessDeniedIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Card, Box, Heading, Text, CardTone} from '@sanity/ui'
import {RatioBox, Overlay, FlexOverlay} from './HotspotImageInput.styled'

interface Props {
  readOnly?: boolean | null
  drag: boolean
  isRejected: boolean
  src: string
}

export default function HotspotImageInput(props: Props) {
  const {drag, readOnly, isRejected, src} = props
  const imageContainer = useRef()
  const [tone, setTone] = useState('default' as CardTone)

  useEffect(() => {
    const acceptTone = isRejected || readOnly ? 'critical' : 'primary'
    setTone(drag ? acceptTone : 'default')

    return undefined
  }, [drag, isRejected, readOnly, tone])

  function HoverIcon() {
    if (isRejected) {
      return <AccessDeniedIcon />
    }
    if (readOnly) {
      return <ReadOnlyIcon />
    }
    return <ImageIcon />
  }

  function HoverText() {
    let message = 'Drop image to upload'
    if (isRejected) {
      message = 'Cannot upload this file here'
    }
    if (readOnly) {
      message = 'This field is read only'
    }

    return <Text size={1}>{message}</Text>
  }

  return (
    <Card border tabIndex={0} tone={tone}>
      <RatioBox ref={imageContainer} style={{height: '30vh'}} paddingY={5}>
        <Card data-container tone="transparent" sizing="border">
          <img src={src} data-testid="hotspot-image-input" />
        </Card>
        <Overlay justify="flex-end" padding={3} tone={tone} drag={drag}>
          {drag && (
            <FlexOverlay direction="column" align="center" justify="center">
              <Box marginBottom={3}>
                <Heading>
                  <HoverIcon />
                </Heading>
              </Box>
              <HoverText />
            </FlexOverlay>
          )}
        </Overlay>
      </RatioBox>
    </Card>
  )
}
