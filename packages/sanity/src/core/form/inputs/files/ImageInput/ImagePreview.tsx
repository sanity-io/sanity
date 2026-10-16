import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type Card, Text} from '@sanity/ui'
import {type ComponentProps, type SyntheticEvent, useCallback, useState} from 'react'

import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type AssetAccessPolicy} from '../types'
import {ErrorIconWrapper, FlexOverlay, Overlay, RatioBox} from './ImagePreview.styled'

interface ImagePreviewProps {
  alt: string
  accessPolicy?: AssetAccessPolicy
  src?: string
}

export function ImagePreview(props: ComponentProps<typeof Card> & ImagePreviewProps) {
  const {accessPolicy = 'public', src, ...rest} = props
  // The outcome is recorded against the `src` it belongs to, so switching to another image
  // starts over without an effect. An effect that reset the state on mount would run again each
  // time an `<Activity>` boundary shows the input, and an image that is already complete does
  // not fire `load` again, leaving the loading overlay over it for good.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)
  const isLoaded = Boolean(src) && loadedSrc === src
  const hasError = Boolean(src) && erroredSrc === src

  // The attribute is the `src` as rendered; the `src` property is the resolved absolute URL,
  // which a relative `src` prop would never equal.
  const onLoadChange = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    setLoadedSrc(event.currentTarget.getAttribute('src'))
    setErroredSrc(null)
  }, [])

  const onErrorChange = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    setErroredSrc(event.currentTarget.getAttribute('src'))
    setLoadedSrc(null)
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
      <FlexOverlay flexDirection="column" alignItems="center" justifyContent="center">
        <LoadingBlock showText />
      </FlexOverlay>
    </Overlay>
  )
}

function AccessWarningOverlay() {
  const {t} = useTranslation()

  return (
    <Overlay padding={3} tone="critical" border>
      <FlexOverlay flexDirection="column" alignItems="center" justifyContent="center" gap={2}>
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
