import React, {useEffect, useRef, useState} from 'react'

import {AccessDeniedIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Card, Box, Heading, Text, CardTone} from '@sanity/ui'
import {RatioBox, Overlay, FlexOverlay} from './HotspotImageInput.styled'

interface Props {
  readOnly?: boolean | null
  drag: boolean
  isRejected: boolean
  path: string[]
  src: string
}

export default function HotspotImageInput(props: Props) {
  const {drag, readOnly, isRejected, path, src} = props
  const imageContainer = useRef()
  const pathId = path.join('_')
  const [storedHeight, setStoredHeight] = useState(
    window.localStorage.getItem(`imageHeight_${pathId}`)
  )
  const [tone, setTone] = useState('default' as CardTone)

  useEffect(() => {
    const observer = new ResizeObserver(function (mutations) {
      const storageHeight = window.localStorage.getItem(`imageHeight_${pathId}`)

      if (storageHeight) {
        setStoredHeight(storedHeight)
        window.localStorage.setItem(`imageHeight_${pathId}`, `${mutations[0].contentRect.height}px`)
      } else {
        window.localStorage.setItem(`imageHeight_${pathId}`, '30vh')
      }
    })

    if (imageContainer.current) {
      observer.observe(imageContainer.current)
    }

    return () => {
      return observer.disconnect()
    }
  })

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
      <RatioBox
        ref={imageContainer}
        style={{
          height: storedHeight ? `${storedHeight}` : '30vh',
        }}
        paddingY={5}
      >
        <Card data-container tone="transparent" sizing="border">
          <img src={src} />
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
