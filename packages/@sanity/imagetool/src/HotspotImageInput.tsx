import React, {useEffect, useRef, useState} from 'react'

import {AccessDeniedIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Card, Box, Heading, Text, CardTone} from '@sanity/ui'
import {ImageAsset} from '@sanity/types/src'
import {RatioBox, Overlay, FlexOverlay, MAX_HEIGHT} from './HotspotImageInput.styled'

interface Props {
  readOnly?: boolean | null
  drag: boolean
  assetDocument: ImageAsset
  isRejected: boolean
}

export default function HotspotImageInput(props: Props) {
  const {drag, readOnly, assetDocument, isRejected} = props
  const imageContainer = useRef()
  const [storedHeight, setStoredHeight] = useState(
    window.localStorage.getItem(`imageHeight_${assetDocument._id}`)
  )
  const [tone, setTone] = useState('default' as CardTone)

  useEffect(() => {
    const observer = new ResizeObserver(function (mutations) {
      const storageHeight = window.localStorage.getItem(`imageHeight_${assetDocument._id}`)

      if (storageHeight) {
        setStoredHeight(storedHeight)
        window.localStorage.setItem(
          `imageHeight_${assetDocument._id}`,
          mutations[0].contentRect.height
        )
      } else {
        window.localStorage.setItem(`imageHeight_${assetDocument._id}`, MAX_HEIGHT)
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
      message = 'Can’t upload this file here'
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
          height: storedHeight ? `${storedHeight}px` : '30vh',
        }}
        paddingY={5}
      >
        <Card data-container tone="transparent" sizing="border">
          <img src={assetDocument.url} />
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
