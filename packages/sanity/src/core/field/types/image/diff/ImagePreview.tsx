import React, {SyntheticEvent, useMemo} from 'react'
import {getImageDimensions, isDefaultCrop, isDefaultHotspot} from '@sanity/asset-utils'
import imageUrlBuilder from '@sanity/image-url'
import {ImageIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'
import styled from 'styled-components'
import {hues} from '@sanity/color'
import {useClient} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {MetaInfo} from '../../../diff'
import {useDocumentValues} from '../../../../store'
import {getDeviceDpr, simpleHash} from './helpers'
import {HotspotCropSVG} from './HotspotCropSVG'
import type {ImagePreviewProps, MinimalAsset} from './types'

const ASSET_FIELDS = ['originalFilename']

// To trigger error state, change `src` attribute to random string ("foo")
// To trigger slow loading, use a throttling proxy (charles) or browser devtools

// To trigger deleted state, set `id` to valid, non-existant image asset ID,
// eg: 'image-1217bc35db5030739b7be571c79d3c401551911d-300x200-png'

export const NoImagePreview = () => {
  const {t} = useTranslation()
  return (
    <Card flex={1} tone="transparent" padding={4} radius={2} height="stretch">
      <Flex align="center" justify="center" height="fill">
        <Text size={1} muted>
          {t('changes.image.no-image-placeholder')}
        </Text>
      </Flex>
    </Card>
  )
}

const ImageWrapper = styled.div`
  height: 100%;
  max-height: 190px;
  position: relative;

  /* Ideally the checkerboard component currently in the form builder should be made available and used here */
  background-color: ${hues.gray[100].hex};
  background-image: linear-gradient(45deg, ${hues.gray[50].hex} 25%, transparent 25%),
    linear-gradient(-45deg, ${hues.gray[50].hex} 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, ${hues.gray[50].hex} 75%),
    linear-gradient(-45deg, transparent 75%, ${hues.gray[50].hex} 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;

  &::after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 0 1px var(--card-border-color);
    pointer-events: none;
  }

  &[data-changed] {
    opacity: 0.45;
  }
`

const Image = styled.img`
  display: block;
  flex: 1;
  min-height: 0;
  object-fit: contain;
  width: 100%;
  height: 100%;

  &[data-action='removed'] {
    opacity: 0.45;
  }
`

const HotspotDiff = styled.div`
  svg {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`

export function ImagePreview(props: ImagePreviewProps): React.ReactElement {
  const {id, action, diff, hotspot, crop, is} = props
  const {t} = useTranslation()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [imageError, setImageError] = React.useState<SyntheticEvent<HTMLImageElement, Event>>()
  const {value: asset} = useDocumentValues<MinimalAsset>(id, ASSET_FIELDS)
  const dimensions = getImageDimensions(id)
  const imageBuilder = useMemo(() => imageUrlBuilder(client), [client])

  // undefined = still loading, null = its gone
  const assetIsDeleted = asset === null

  const title = asset && asset.originalFilename
  const imageSource = imageBuilder
    .image(id)
    .height(190) // Should match container max-height
    .dpr(getDeviceDpr())
    .fit('max')

  const assetChanged = diff.fromValue?.asset?._ref !== diff.toValue?.asset?._ref

  let printAction
  if (action && action !== 'changed') {
    printAction = t(action === 'added' ? 'changes.added-label' : 'changes.removed-label')
  }

  const metaAction = action === 'changed' ? undefined : action

  return (
    <Flex direction="column" height="fill" flex={1}>
      <Box flex={1} padding={2} paddingBottom={0}>
        <Flex
          as={ImageWrapper}
          direction="column"
          data-changed={is === 'from' && assetChanged ? '' : undefined}
          data-error={imageError ? '' : undefined}
        >
          {!assetIsDeleted && !imageError && (
            <Image
              src={imageSource.toString() || ''}
              alt={title}
              data-action={metaAction}
              onError={setImageError}
              width={dimensions.width}
              height={dimensions.height}
            />
          )}

          {(assetIsDeleted || imageError) && (
            <Box paddingY={5}>
              <Text size={1} muted align="center">
                {t(assetIsDeleted ? 'changes.image.deleted' : 'changes.image.error-loading-image')}
              </Text>
            </Box>
          )}

          <HotspotDiff>
            <HotspotCropSVG
              crop={crop && !isDefaultCrop(crop) ? crop : undefined}
              diff={diff}
              hash={simpleHash(`${imageSource.toString() || ''}-${is}`)}
              hotspot={hotspot && !isDefaultHotspot(hotspot) ? hotspot : undefined}
              width={dimensions.width}
              height={dimensions.height}
            />
          </HotspotDiff>
        </Flex>
      </Box>

      <MetaInfo
        title={title || t('changes.image.meta-info-fallback-title')}
        icon={ImageIcon}
        markRemoved={assetChanged && is === 'from'}
      >
        {printAction ? (
          <div>{printAction}</div>
        ) : (
          <div>
            {dimensions.width} × {dimensions.height}
          </div>
        )}
      </MetaInfo>
    </Flex>
  )
}
