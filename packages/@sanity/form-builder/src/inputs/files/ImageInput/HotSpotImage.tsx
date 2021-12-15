import React, {useEffect, useRef, useState} from 'react'

import {ImageIcon} from '@sanity/icons'
import {Card, Flex, studioTheme, rgba, Box, Heading, Text} from '@sanity/ui'
import styled from 'styled-components'
import {ImageAsset} from '@sanity/types/src'
import {RatioBox, Overlay, MAX_HEIGHT} from './HotSpotImage.styled'

interface Props {
  id: string
  readOnly?: boolean | null
  drag: boolean
  assetDocument: ImageAsset
}

export function HotspotImage(props: Props) {
  const {id, drag, readOnly, assetDocument} = props
  const imageContainer = useRef()
  const storedHeight = window.localStorage.getItem(`imageHeight_${id}`)

  useEffect(() => {
    const observer = new ResizeObserver(function (mutations) {
      const storageHeight = window.localStorage.getItem(`imageHeight_${id}`)

      if (storageHeight) {
        window.localStorage.setItem(`imageHeight_${id}`, mutations[0].contentRect.height)
      } else {
        window.localStorage.setItem(`imageHeight_${id}`, storageHeight)
      }
    })

    if (imageContainer.current) {
      observer.observe(imageContainer.current)
    }

    return () => {
      window.localStorage.removeItem(`imageHeight_${id}`)

      return observer.disconnect()
    }
  }, [])

  return (
    <Card border tabIndex={0} tone={drag ? 'primary' : 'default'}>
      <RatioBox
        ref={imageContainer}
        style={{
          maxHeight: storedHeight ? 'unset' : MAX_HEIGHT,
          height: storedHeight ? `${storedHeight}px` : '30vh',
        }}
        //onResize={handleResize}
        paddingY={5}
      >
        <Card data-container tone="transparent" sizing="border">
          <img src={assetDocument.url} />
        </Card>
        <Overlay justify="flex-end" padding={3} drag={drag && !readOnly}>
          {drag && !readOnly && (
            <Flex
              direction="column"
              align="center"
              justify="center"
              style={{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0}}
            >
              <Box marginBottom={3}>
                <Heading>
                  <ImageIcon />
                </Heading>
              </Box>
              <Text size={1}>Drop image to upload</Text>
            </Flex>
          )}
        </Overlay>
      </RatioBox>
    </Card>
  )
}
