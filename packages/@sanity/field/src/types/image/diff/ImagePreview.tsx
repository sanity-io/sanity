import React from 'react'
import imageUrlBuilder from '@sanity/image-url'
import sanityClient from 'part:@sanity/base/client'
import ImageIcon from 'part:@sanity/base/image-icon'
import {DiffAnnotationTooltip, useDiffAnnotationColor, MetaInfo} from '../../../diff'
import styles from './ImagePreview.css'
import {Crop, Hotspot, ImagePreviewProps} from './types'

const imageBuilder = imageUrlBuilder(sanityClient)

export default function ImagePreview({
  asset,
  action,
  diff,
  hotspot,
  crop,
  is
}: ImagePreviewProps): React.ReactElement {
  const title = asset.originalFilename || 'Untitled'
  const dimensions = asset.metadata?.dimensions
  const imageSource = imageBuilder
    .image(asset)
    .height(300)
    .fit('max')

  const assetChanged = diff.fromValue?.asset?._ref !== diff.toValue?.asset?._ref
  const cropColor = useDiffAnnotationColor(diff, 'crop')
  const hotspotColor = useDiffAnnotationColor(diff, 'hotspot')
  const className = is === 'from' && assetChanged ? styles.imageWrapperChanged : styles.imageWrapper
  const metaAction = action === 'changed' ? undefined : action

  return (
    <div className={styles.root}>
      <div className={className}>
        <img
          className={styles.image}
          src={imageSource.toString() || ''}
          alt={title}
          data-action={metaAction}
        />
        {crop && !isDefaultCrop(crop) && (
          <DiffAnnotationTooltip
            diff={diff}
            path="crop"
            description="Crop changed by"
            className={styles.crop}
            style={{
              borderColor: cropColor.border,
              backgroundColor: hexToRgba(cropColor.background, 0.2),
              ...getCropParams(crop)
            }}
          />
        )}
        {hotspot && !isDefaultHotspot(hotspot) && (
          <DiffAnnotationTooltip
            diff={diff}
            path="hotspot"
            description="Hotspot changed by"
            className={styles.hotspot}
            style={{
              borderColor: hotspotColor.border,
              backgroundColor: hexToRgba(hotspotColor.background, 0.2),
              ...getHotspotParams(hotspot)
            }}
          />
        )}
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

function isDefaultCrop(crop: Crop) {
  const {top, right, left, bottom} = crop
  return top === 0 && right === 0 && left === 0 && bottom === 0
}

function getCropParams(crop: Crop): React.CSSProperties | undefined {
  const {top, right, left, bottom} = crop
  return {
    top: prct(top),
    right: prct(right),
    left: prct(left),
    bottom: prct(bottom)
  }
}

function isDefaultHotspot(hotspot: Hotspot) {
  const {x, y, width, height} = hotspot
  return x === 0.5 && y === 0.5 && width === 1 && height === 1
}

function getHotspotParams(hotspot: Hotspot): React.CSSProperties | undefined {
  const {x, y, width, height} = hotspot
  const top = y - height / 2
  const left = x - width / 2

  return {
    top: prct(top),
    left: prct(left),
    width: prct(width),
    height: prct(height),
    borderRadius: '50%'
  }
}

function prct(num: number): string {
  return `${num * 100}%`
}

function hexToRgba(hex: string, opacity: number): string {
  const rgba = (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || ([] as string[]))
    .slice(1)
    .map(num => parseInt(num, 16))
    .concat(opacity)
  return `rgba(${rgba.join(', ')})`
}
