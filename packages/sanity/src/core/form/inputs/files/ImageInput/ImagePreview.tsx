import React, {ComponentProps, useCallback, useEffect, useState} from 'react'

import {AccessDeniedIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Box, Card, CardTone, Heading, Text, useElementRect} from '@sanity/ui'
import {useTranslation} from '../../../../i18n'
import {
  MAX_DEFAULT_HEIGHT,
  RatioBox,
  Overlay,
  FlexOverlay,
  SpinnerWrapper,
} from './ImagePreview.styled'

interface Props {
  readOnly?: boolean | null
  drag: boolean
  isRejected: boolean
  src: string
  alt: string
}

/*
  Used for setting the initial image height - specifically for images
  that are small and so can take less space in the document
*/
const getImageSize = (src: string): number[] => {
  const imageUrlParams = new URLSearchParams(src.split('?')[1])
  const rect = imageUrlParams.get('rect')

  if (rect) {
    return [rect.split(',')[2], rect.split(',')[3]].map(Number)
  }

  return src.split('-')[1].split('.')[0].split('x').map(Number)
}

export function ImagePreview(props: ComponentProps<typeof Card> & Props) {
  const {drag, readOnly, isRejected, src, ...rest} = props
  const [isLoaded, setLoaded] = useState(false)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const rootRect = useElementRect(rootElement)
  const rootWidth = rootRect?.width || 0
  const acceptTone = isRejected || readOnly ? 'critical' : 'primary'
  const tone = drag ? acceptTone : 'default'

  const maxHeightToPx = (MAX_DEFAULT_HEIGHT * document.documentElement.clientHeight) / 100 // convert from vh to px, max height of the input

  const [imageWidth, imageHeight] = getImageSize(src)

  const imageRatio = imageWidth / imageHeight

  // is the image wider than root? if so calculate the resized height
  const renderedImageHeight = imageWidth > rootWidth ? rootWidth / imageRatio : imageHeight

  /*
    if the rendered image is smaller than the max height then it doesn't require a height set
    otherwise, set the max height (to prevent a large image in the document)
  */
  const rootHeight = renderedImageHeight < maxHeightToPx ? null : `${MAX_DEFAULT_HEIGHT}vh`

  useEffect(() => {
    /* set for when the src is being switched when the image input already had a image src
    - meaning it already had an asset */
    setLoaded(false)
  }, [src])

  const onLoadChange = useCallback(() => {
    setLoaded(true)
  }, [])

  const {t} = useTranslation()
  return (
    <RatioBox {...rest} ref={setRootElement} style={{height: rootHeight}} tone="transparent">
      <Card data-container tone="inherit">
        {!isLoaded && <OverlayComponent cardTone="transparent" drag content={<SpinnerWrapper />} />}
        <img
          src={src}
          data-testid="hotspot-image-input"
          alt={props.alt}
          onLoad={onLoadChange}
          referrerPolicy="strict-origin-when-cross-origin"
        />
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
              <Text size={1}>{t(getHoverTextTranslationKey({isRejected, readOnly}))}</Text>
            </>
          }
        />
      )}
    </RatioBox>
  )
}

function HoverIcon({isRejected, readOnly}: {isRejected: boolean; readOnly?: boolean}) {
  if (isRejected) {
    return <AccessDeniedIcon />
  }
  if (readOnly) {
    return <ReadOnlyIcon />
  }
  return <ImageIcon />
}

function getHoverTextTranslationKey({
  isRejected,
  readOnly,
}: {
  isRejected: boolean
  readOnly?: boolean
}) {
  if (isRejected) {
    return 'inputs.image.drag-overlay.this-field-is-read-only'
  }
  return readOnly
    ? 'inputs.image.drag-overlay.cannot-upload-here'
    : 'inputs.image.drag-overlay.drop-to-upload-image'
}

function OverlayComponent({
  cardTone,
  drag,
  content,
}: {
  cardTone: Exclude<CardTone, 'inherit'>
  drag: boolean
  content: React.ReactNode
}) {
  return (
    <Overlay justify="flex-end" padding={3} $drag={drag} $tone={cardTone}>
      <FlexOverlay direction="column" align="center" justify="center">
        {content}
      </FlexOverlay>
    </Overlay>
  )
}
