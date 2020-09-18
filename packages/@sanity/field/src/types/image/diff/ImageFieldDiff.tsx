import * as React from 'react'
import {
  DiffComponent,
  ObjectDiff,
  DiffAnnotationTooltip,
  DiffAnnotationCard,
  ChangeList,
  getAnnotationAtPath
} from '../../../diff'
import {useRefValue} from '../../../diff/hooks'
import {ChangeArrow} from '../../../diff/components'
import ImagePreview from './ImagePreview'
import styles from './ImageFieldDiff.css'
import {Image, SanityImageAsset} from './types'

const IMAGE_META_FIELDS = ['crop', 'hotspot']
const BASE_IMAGE_FIELDS = ['asset', ...IMAGE_META_FIELDS]

export const ImageFieldDiff: DiffComponent<ObjectDiff<Image>> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields, isChanged} = diff
  const fromRef = fromValue?.asset?._ref
  const toRef = toValue?.asset?._ref
  const prev = useRefValue<SanityImageAsset>(fromRef)
  const next = useRefValue<SanityImageAsset>(toRef)
  const assetAnnotation = getAnnotationAtPath(diff, ['asset', '_ref'])

  if (!isChanged) {
    return next ? (
      <DiffAnnotationCard className={styles.annotation} annotation={assetAnnotation}>
        <ImagePreview is="to" asset={next} diff={diff} />
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
    <div className={styles.imageDiff} data-diff-layout={prev && next ? 'double' : 'single'}>
      {prev && fromValue && (
        <DiffAnnotationCard className={styles.annotation} annotation={assetAnnotation}>
          <ImagePreview
            is="from"
            asset={prev}
            diff={diff}
            action={assetAction}
            hotspot={showMetaChange && didHotspotChange ? fromValue.hotspot : undefined}
            crop={showMetaChange && didCropChange ? fromValue.crop : undefined}
          />
        </DiffAnnotationCard>
      )}
      {prev && next && <ChangeArrow />}
      {next && toValue && (
        <DiffAnnotationCard className={styles.annotation} annotation={assetAnnotation}>
          <ImagePreview
            is="to"
            asset={next}
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
          <DiffAnnotationTooltip
            annotation={assetAnnotation}
            description={`${assetAction[0].toUpperCase()}${assetAction.slice(1)}`}
          >
            {imageDiff}
          </DiffAnnotationTooltip>
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
