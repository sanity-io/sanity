import {AccessDeniedIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Box, type Card, type CardTone, Heading, Text} from '@sanity/ui'
import {type ComponentProps, type ReactNode, useCallback, useEffect, useState} from 'react'

import {LoadingBlock} from '../../../../components/loadingBlock'
import {useTranslation} from '../../../../i18n'
import {FlexOverlay, Overlay, RatioBox} from './ImagePreview.styled'

interface Props {
  alt: string
  drag: boolean
  isRejected: boolean
  readOnly?: boolean | null
  src: string
}

export function ImagePreview(props: ComponentProps<typeof Card> & Props) {
  const {drag, readOnly, isRejected, src, ...rest} = props
  const [isLoaded, setLoaded] = useState(false)
  const acceptTone = isRejected || readOnly ? 'critical' : 'primary'
  const tone = drag ? acceptTone : 'default'

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
    <RatioBox {...rest} tone="transparent">
      {!isLoaded && <OverlayComponent cardTone="transparent" content={<LoadingBlock showText />} />}
      <img
        src={src}
        data-testid="hotspot-image-input"
        alt={props.alt}
        onLoad={onLoadChange}
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {drag && (
        <OverlayComponent
          cardTone={tone}
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
