import * as React from 'react'
import {DiffComponent, ObjectDiff} from '../../types'
import {DiffArrow} from '../shared'
import {getRefValue} from '../hooks'
import ImagePreview from './ImagePreview'
import styles from './ImageFieldDiff.css'
import {DiffAnnotationTooltip, useDiffAnnotationColor} from '../../annotations'

/* TODO:
  - Correct annotation for hotspot/crop changes
  - Visualising hotspott/crop changes
*/

export const ImageFieldDiff: DiffComponent<ObjectDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields} = diff
  const fromAsset = fromValue?.asset
  const toAsset = toValue?.asset
  const prev = getRefValue(fromAsset?._ref)
  const next = getRefValue(toAsset?._ref)

  // Get all the changed fields within this image field
  const changedFields = Object.keys(fields)
    .map(field => ({
      name: field,
      ...diff.fields[field]
    }))
    .filter(field => field.isChanged && field.name !== '_type')

  // An array of names of the fields that changed
  const changedFieldNames = changedFields.map(f => f.name)

  const didAssetChange = changedFieldNames.some(field => field === 'asset')
  const imageMeta = ['crop', 'hotspot']
  const didMetaChange = changedFieldNames.some(field => imageMeta.includes(field))
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
    </div>
  )
}

/* {nestedFields.length > 0 && (
  <div className={styles.nestedFields}>
    {nestedFields.map(field => {
      const MetaDiffComponent = resolveDiffComponent(field.schemaType) || FallbackDiff
      return (
        <div className={styles.field} key={field.name}>
          <div className={styles.title}>{field.schemaType.title}</div>
          <MetaDiffComponent diff={field.diff} schemaType={field.schemaType} />
        </div>
      )
    })}
  </div>
)} */
