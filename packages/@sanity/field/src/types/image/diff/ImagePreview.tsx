import React from 'react'
import imageUrlBuilder from '@sanity/image-url'
import sanityClient from 'part:@sanity/base/client'
import ImageIcon from 'part:@sanity/base/image-icon'
import {MetaInfo} from '../../../diff'
import {isDefaultCrop, isDefaultHotspot, simpleHash} from './helpers'
import {HotspotCropSVG} from './HotspotCropSVG'
import {ImagePreviewProps} from './types'

import styles from './ImagePreview.css'

const imageBuilder = imageUrlBuilder(sanityClient)

export default function ImagePreview(props: ImagePreviewProps): React.ReactElement {
  const {asset, action, diff, hotspot, crop, is} = props
  const title = asset.originalFilename || 'Untitled'
  const dimensions = asset.metadata?.dimensions
  const imageSource = imageBuilder
    .image(asset)
    .height(300)
    .fit('max')

  const assetChanged = diff.fromValue?.asset?._ref !== diff.toValue?.asset?._ref
  const imageWrapperClassName =
    is === 'from' && assetChanged ? styles.imageWrapperChanged : styles.imageWrapper
  const metaAction = action === 'changed' ? undefined : action

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={imageWrapperClassName}>
          <img
            className={styles.image}
            src={imageSource.toString() || ''}
            alt={title}
            data-action={metaAction}
          />

          <HotspotCropSVG
            className={styles.hotspotCrop}
            crop={crop && !isDefaultCrop(crop) ? crop : undefined}
            diff={diff}
            hash={simpleHash(`${imageSource.toString() || ''}-${is}`)}
            hotspot={hotspot && !isDefaultHotspot(hotspot) ? hotspot : undefined}
            width={dimensions?.width}
            height={dimensions?.height}
          />
        </div>
      </div>

      <MetaInfo title={title} icon={ImageIcon} markRemoved={assetChanged && is === 'from'}>
        {metaAction ? (
          <div>{metaAction}</div>
        ) : (
          <div>
            {dimensions.height} × {dimensions.width}
          </div>
        )}
      </MetaInfo>
    </div>
  )
}
