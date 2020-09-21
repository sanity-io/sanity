import {Image} from '@sanity/types'
import * as React from 'react'
import {
  DiffAnnotationCard,
  DiffComponent,
  DiffTooltip,
  ObjectDiff,
  ChangeList,
  getAnnotationAtPath
} from '../../../diff'
import {FromToArrow} from '../../../diff/components'
import ImagePreview from './ImagePreview'
import styles from './ImageFieldDiff.css'

const IMAGE_META_FIELDS = ['crop', 'hotspot']
const BASE_IMAGE_FIELDS = ['asset', ...IMAGE_META_FIELDS]

export const ImageFieldDiff: DiffComponent<ObjectDiff<Image>> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields, isChanged} = diff
  const fromRef = fromValue?.asset?._ref
  const toRef = toValue?.asset?._ref
  const assetAnnotation = getAnnotationAtPath(diff, ['asset', '_ref'])

  if (!isChanged) {
    return toRef ? (
      <DiffAnnotationCard className={styles.annotation} annotation={assetAnnotation}>
        <ImagePreview id={toRef} is="to" diff={diff} />
      </DiffAnnotationCard>
    ) : null
  }

  // Get all the changed fields within this image field
  const changedFields = Object.keys(fields).filter(
    name => fields[name].isChanged && name !== '_type'
  )

  const nestedFields = schemaType.fields
    .filter(field => !BASE_IMAGE_FIELDS.includes(field.name) && changedFields.includes(field.name))
    .map(field => field.name)

  let assetAction: 'changed' | 'added' | 'removed' = 'changed'
  if (!fromRef && toRef) {
    assetAction = 'added'
  } else if (!toRef && fromRef) {
    assetAction = 'removed'
  }

  const didAssetChange = changedFields.includes('asset')
  const didCropChange = changedFields.includes('crop')
  const didHotspotChange = changedFields.includes('hotspot')
  const didMetaChange = didCropChange || didHotspotChange
  const showImageDiff = didAssetChange || didMetaChange
  const showMetaChange = didMetaChange && !didAssetChange

  const imageDiff = (
    <div className={styles.imageDiff} data-diff-layout={fromRef && toRef ? 'double' : 'single'}>
      {fromValue && fromRef && (
        <DiffAnnotationCard className={styles.annotation} annotation={assetAnnotation}>
          <ImagePreview
            is="from"
            id={fromRef}
            diff={diff}
            action={assetAction}
            hotspot={showMetaChange && didHotspotChange ? fromValue.hotspot : undefined}
            crop={showMetaChange && didCropChange ? fromValue.crop : undefined}
          />
        </DiffAnnotationCard>
      )}
      {fromRef && toRef && <FromToArrow />}
      {toValue && toRef && (
        <DiffAnnotationCard className={styles.annotation} annotation={assetAnnotation}>
          <ImagePreview
            is="to"
            id={toRef}
            diff={diff}
            hotspot={showMetaChange && didHotspotChange ? toValue.hotspot : undefined}
            crop={showMetaChange && didCropChange ? toValue.crop : undefined}
          />
        </DiffAnnotationCard>
      )}
    </div>
  )

  return (
    <div className={styles.root}>
      {showImageDiff &&
        (didAssetChange ? (
          <DiffTooltip
            annotation={assetAnnotation}
            description={`${assetAction[0].toUpperCase()}${assetAction.slice(1)}`}
          >
            {imageDiff}
          </DiffTooltip>
        ) : (
          imageDiff
        ))}

      {nestedFields.length > 0 && (
        <div className={styles.nestedFields}>
          <ChangeList diff={diff} schemaType={schemaType} fields={nestedFields} />
        </div>
      )}
    </div>
  )
}
