import {WarningOutlineIcon} from '@sanity/icons'
import {type Card, Text} from '@sanity/ui'
import {type ComponentProps, useCallback, useEffect, useState} from 'react'

import {LoadingBlock} from '../../../../components/loadingBlock'
import {useTranslation} from '../../../../i18n'
import {type AssetAccessPolicy} from '../types'
import {ErrorIconWrapper, FlexOverlay, Overlay, RatioBox} from './ImagePreview.styled'

interface ImagePreviewProps {
  alt: string
  accessPolicy?: AssetAccessPolicy
  src?: string
}

export function ImagePreview(props: ComponentProps<typeof Card> & ImagePreviewProps) {
  const {accessPolicy = 'public', src, ...rest} = props
  const [isLoaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    /* set for when the src is being switched when the image input already had a image src
    - meaning it already had an asset */
    setLoaded(false)
    setHasError(false)
  }, [src])

  const onLoadChange = useCallback(() => {
    setLoaded(true)
    setHasError(false)
  }, [])

  const onErrorChange = useCallback(() => {
    setHasError(true)
    setLoaded(false)
  }, [])

  const showAccessWarning = hasError && accessPolicy === 'unknown'
  const showLoading = !isLoaded && !showAccessWarning

  return (
    <RatioBox {...rest} tone="transparent">
      {showAccessWarning && <AccessWarningOverlay />}
      {showLoading && <LoadingOverlay />}

      {src && (
        <img
          src={src}
          data-testid="hotspot-image-input"
          alt={props.alt}
          onLoad={onLoadChange}
          onError={onErrorChange}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </RatioBox>
  )
}

function LoadingOverlay() {
  return (
    <Overlay padding={3} tone="transparent">
      <FlexOverlay direction="column" align="center" justify="center">
        <LoadingBlock showText />
      </FlexOverlay>
    </Overlay>
  )
}

function AccessWarningOverlay() {
  const {t} = useTranslation()

  return (
    <Overlay padding={3} tone="critical" border>
      <FlexOverlay direction="column" align="center" justify="center" gap={2}>
        <ErrorIconWrapper>
          <WarningOutlineIcon />
        </ErrorIconWrapper>
        <Text muted size={1}>
          {t('inputs.image.error.possible-access-restriction')}
        </Text>
      </FlexOverlay>
    </Overlay>
  )
}
