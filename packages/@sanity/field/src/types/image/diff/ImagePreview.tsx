import React, {SyntheticEvent} from 'react'
import {useDocumentValues} from '@sanity/base/hooks'
import {getImageDimensions, isDefaultCrop, isDefaultHotspot} from '@sanity/asset-utils'
import imageUrlBuilder from '@sanity/image-url'
import sanityClient from 'part:@sanity/base/client'
import ImageIcon from 'part:@sanity/base/image-icon'
import {MetaInfo} from '../../../diff'
import {getDeviceDpr, simpleHash} from './helpers'
import {HotspotCropSVG} from './HotspotCropSVG'
import {ImagePreviewProps, MinimalAsset} from './types'

import styles from './ImagePreview.css'

const ASSET_FIELDS = ['originalFilename']
const imageBuilder = imageUrlBuilder(sanityClient)

// To trigger error state, change `src` attribute to random string ("foo")
// To trigger slow loading, use a throttling proxy (charles) or browser devtools

// To trigger deleted state, set `id` to valid, non-existant image asset ID,
// eg: 'image-1217bc35db5030739b7be571c79d3c401551911d-300x200-png'

export const NoImagePreview = () => (
  <div className={styles.noImage}>
    <div>(no image)</div>
  </div>
)

export function ImagePreview(props: ImagePreviewProps): React.ReactElement {
  const {id, action, diff, hotspot, crop, is} = props
  const [imageError, setImageError] = React.useState<SyntheticEvent<HTMLImageElement, Event>>()
  const {value: asset} = useDocumentValues<MinimalAsset>(id, ASSET_FIELDS)
  const dimensions = getImageDimensions(id)

  // undefined = still loading, null = its gone
  const assetIsDeleted = asset === null

  const title = (asset && asset.originalFilename) || 'Untitled'
  const imageSource = imageBuilder
    .image(id)
    .height(190) // Should match container max-height
    .dpr(getDeviceDpr())
    .fit('max')

  const assetChanged = diff.fromValue?.asset?._ref !== diff.toValue?.asset?._ref
  const imageWrapperClassName =
    is === 'from' && assetChanged ? styles.imageWrapperChanged : styles.imageWrapper
  const metaAction = action === 'changed' ? undefined : action

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={imageWrapperClassName}>
          {!assetIsDeleted && !imageError && (
            <img
              className={styles.image}
              src={imageSource.toString() || ''}
              alt={title}
              data-action={metaAction}
              onError={setImageError}
              width={dimensions.width}
              height={dimensions.height}
            />
          )}

          {(assetIsDeleted || imageError) && (
            <div className={styles.error}>
              {assetIsDeleted ? 'Image is deleted' : 'Error loading image'}
            </div>
          )}

          <HotspotCropSVG
            className={styles.hotspotCrop}
            crop={crop && !isDefaultCrop(crop) ? crop : undefined}
            diff={diff}
            hash={simpleHash(`${imageSource.toString() || ''}-${is}`)}
            hotspot={hotspot && !isDefaultHotspot(hotspot) ? hotspot : undefined}
            width={dimensions.width}
            height={dimensions.height}
          />
        </div>
      </div>

      <MetaInfo title={title} icon={ImageIcon} markRemoved={assetChanged && is === 'from'}>
        {metaAction ? (
          <div>{metaAction}</div>
        ) : (
          <div>
            {dimensions.width} × {dimensions.height}
          </div>
        )}
      </MetaInfo>
    </div>
  )
}
