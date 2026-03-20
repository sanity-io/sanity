import {getImageDimensions, isDefaultCrop, isDefaultHotspot} from '@sanity/asset-utils'
import {ImageIcon} from '@sanity/icons'
import {createImageUrlBuilder} from '@sanity/image-url'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {type SyntheticEvent, useMemo, useState} from 'react'

import {useClient} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {useDocumentValues} from '../../../../store'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {MetaInfo} from '../../../diff'
import {getDeviceDpr, simpleHash} from './helpers'
import {HotspotCropSVG} from './HotspotCropSVG'
import {hotspotDiff, image, imageWrapper} from './ImagePreview.css'
import {type ImagePreviewProps, type MinimalAsset} from './types'

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

export function ImagePreview(props: ImagePreviewProps): React.JSX.Element {
  const {id, action, diff, hotspot, crop, is} = props
  const {t} = useTranslation()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [imageError, setImageError] = useState<SyntheticEvent<HTMLImageElement>>()
  const {value: asset} = useDocumentValues<MinimalAsset>(id, ASSET_FIELDS)
  const dimensions = getImageDimensions(id)
  const imageBuilder = useMemo(() => createImageUrlBuilder(client), [client])

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
          className={imageWrapper}
          direction="column"
          data-changed={is === 'from' && assetChanged ? '' : undefined}
          data-error={imageError ? '' : undefined}
        >
          {!assetIsDeleted && !imageError && (
            <img
              className={image}
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

          <div className={hotspotDiff}>
            <HotspotCropSVG
              crop={crop && !isDefaultCrop(crop) ? crop : undefined}
              diff={diff}
              hash={simpleHash(`${imageSource.toString() || ''}-${is}`)}
              hotspot={hotspot && !isDefaultHotspot(hotspot) ? hotspot : undefined}
              width={dimensions.width}
              height={dimensions.height}
            />
          </div>
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
