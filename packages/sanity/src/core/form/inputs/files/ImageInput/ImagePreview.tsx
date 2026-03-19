import {WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Text} from '@sanity/ui'
import {type ComponentProps, useCallback, useEffect, useState} from 'react'

import {LoadingBlock} from '../../../../components/loadingBlock'
import {useTranslation} from '../../../../i18n'
import {type AssetAccessPolicy} from '../types'
import {errorIconWrapper, flexOverlay, overlay, ratioBox, ratioBoxImage} from './ImagePreview.css'

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
    <Card {...rest} className={ratioBox} tone="transparent" data-ui="ratio-box">
      {showAccessWarning && <AccessWarningOverlay />}
      {showLoading && <LoadingOverlay />}

      {src && (
        <img
          className={ratioBoxImage}
          src={src}
          data-testid="hotspot-image-input"
          alt={props.alt}
          onLoad={onLoadChange}
          onError={onErrorChange}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </Card>
  )
}

function LoadingOverlay() {
  return (
    <Card className={overlay} padding={3} tone="transparent">
      <Flex className={flexOverlay} direction="column" align="center" justify="center">
        <LoadingBlock showText />
      </Flex>
    </Card>
  )
}

function AccessWarningOverlay() {
  const {t} = useTranslation()

  return (
    <Card className={overlay} padding={3} tone="critical" border>
      <Flex className={flexOverlay} direction="column" align="center" justify="center" gap={2}>
        <div className={errorIconWrapper}>
          <WarningOutlineIcon />
        </div>
        <Text muted size={1}>
          {t('inputs.image.error.possible-access-restriction')}
        </Text>
      </Flex>
    </Card>
  )
}
