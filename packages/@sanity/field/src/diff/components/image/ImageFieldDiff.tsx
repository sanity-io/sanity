import * as React from 'react'
import {DiffComponent, ObjectDiff} from '../../types'
import {DiffAnnotationTooltip, useDiffAnnotationColor} from '../../annotations'
import {DiffArrow} from '../shared'
import {getRefValue} from '../hooks'
import ImagePreview from './ImagePreview'
import styles from './ImageFieldDiff.css'
import {Image} from './types'
import {ChangeList} from '../../changes'

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
  const didMetaChange = changedFields.some(field => IMAGE_META_FIELDS.includes(field))
  const showImageDiff = didAssetChange || didMetaChange

  const color = useDiffAnnotationColor(diff, 'asset._ref')
  const style = color ? {background: color.background, color: color.text} : {}

  return (
    <div className={styles.root}>
      {showImageDiff && (
        <DiffAnnotationTooltip diff={diff} path="asset._ref">
          <div className={styles.imageDiff} data-diff-layout={prev && next ? 'double' : 'single'}>
            {prev && (
              <div className={styles.annotation} style={style}>
                <ImagePreview
                  value={prev}
                  action={didAssetChange ? 'removed' : 'changed'}
                  hotspot={didMetaChange && fromValue!.hotspot}
                  crop={didMetaChange && fromValue!.crop}
                />
              </div>
            )}
            {prev && next && <DiffArrow />}
            {next && (
              <div className={styles.annotation} style={style}>
                <ImagePreview
                  value={next}
                  action={didAssetChange ? 'added' : 'changed'}
                  hotspot={didMetaChange && toValue!.hotspot}
                  crop={didMetaChange && toValue!.crop}
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
