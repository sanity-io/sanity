import * as React from 'react'
import {ChangeList} from '../../changes'
import {DiffComponent, ObjectDiff} from '../../types'
import {DiffAnnotationTooltip, useDiffAnnotationColor} from '../../annotations'
import {DiffArrow} from '../shared'
import {getRefValue} from '../hooks'
import ImagePreview from './ImagePreview'
import styles from './ImageFieldDiff.css'
import {Image} from './types'

/* TODO:
  - Correct annotation for hotspot/crop changes
  - Visualising hotspot/crop changes
*/

const IMAGE_META_FIELDS = ['crop', 'hotspot']
const BASE_IMAGE_FIELDS = ['asset', ...IMAGE_META_FIELDS]

export const ImageFieldDiff: DiffComponent<ObjectDiff<Image>> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields} = diff
  const fromAsset = fromValue?.asset
  const toAsset = toValue?.asset
  const prev = getRefValue(fromAsset?._ref)
  const next = getRefValue(toAsset?._ref)

  // Get all the changed fields within this image field
  const changedFields = Object.keys(fields).filter(
    name => fields[name].isChanged && name !== '_type'
  )

  const nestedFields = schemaType.fields
    .filter(field => !BASE_IMAGE_FIELDS.includes(field.name) && changedFields.includes(field.name))
    .map(field => field.name)

  const didAssetChange = changedFields.includes('asset')
  const didCropChange = changedFields.includes('crop')
  const didHotspotChange = changedFields.includes('hotspot')
  const didMetaChange = didCropChange || didHotspotChange
  const showImageDiff = didAssetChange || didMetaChange

  const annotationPath = getAnnotationPath({didAssetChange, didCropChange, didHotspotChange})
  const color = useDiffAnnotationColor(diff, annotationPath)
  const style = color ? {background: color.background, color: color.text} : {}

  return (
    <div className={styles.root}>
      {showImageDiff && (
        <DiffAnnotationTooltip diff={diff} path={annotationPath}>
          <div className={styles.imageDiff} data-diff-layout={prev && next ? 'double' : 'single'}>
            {prev && (
              <div
                className={styles.annotation}
                style={style}
                data-action={didAssetChange ? 'removed' : 'changed'}
              >
                <ImagePreview
                  value={prev}
                  action={didAssetChange ? 'removed' : 'changed'}
                  hotspot={didMetaChange ? fromValue!.hotspot : undefined}
                  crop={didMetaChange ? fromValue!.crop : undefined}
                />
              </div>
            )}
            {prev && next && <DiffArrow />}
            {next && (
              <div
                className={styles.annotation}
                style={style}
                data-action={didAssetChange ? 'added' : 'changed'}
              >
                <ImagePreview
                  value={next}
                  action={didAssetChange ? 'added' : 'changed'}
                  hotspot={didMetaChange ? toValue!.hotspot : undefined}
                  crop={didMetaChange ? toValue!.crop : undefined}
                />
              </div>
            )}
          </div>
        </DiffAnnotationTooltip>
      )}

      {nestedFields.length > 0 && (
        <div className={styles.nestedFields}>
          <ChangeList diff={diff} schemaType={schemaType} fields={nestedFields} />
        </div>
      )}
    </div>
  )
}

function getAnnotationPath(changes: {
  didCropChange: boolean
  didHotspotChange: boolean
  didAssetChange: boolean
}): string | undefined {
  const {didAssetChange, didCropChange, didHotspotChange} = changes

  if (didAssetChange) {
    return 'asset._ref'
  }

  if (didCropChange) {
    return 'crop'
  }

  if (didHotspotChange) {
    return 'hotspot'
  }

  return undefined
}
