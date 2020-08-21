import * as React from 'react'
import {DiffComponent, ObjectDiff, DiffAnnotation} from '@sanity/field/diff'
import ArrowIcon from 'part:@sanity/base/arrow-right'
import {resolveDiffComponent} from '../resolveDiffComponent'
import {FallbackDiff} from '../_fallback/FallbackDiff'
import {getRefValue} from '../hooks'
import styles from './FileFieldDiff.css'
import FilePreview from './FilePreview'

export const FileFieldDiff: DiffComponent<ObjectDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields} = diff
  const fromAsset = fromValue?.asset
  const toAsset = toValue?.asset
  const prev = getRefValue(fromAsset?._ref)
  const next = getRefValue(toAsset?._ref)

  const changedFields = Object.keys(fields)
    .map(field => ({
      name: field,
      ...diff.fields[field]
    }))
    .filter(field => field.isChanged && field.name !== '_type')

  const changedFieldNames = changedFields.map(f => f.name)
  const didAssetChange = changedFieldNames.some(field => field === 'asset')

  const nestedFields = schemaType.fields
    .filter(
      field => changedFields.some(f => f.name === field.name) && !['asset'].includes(field.name)
    )
    .map(field => ({name: field.name, schemaType: field.type, diff: fields[field.name]}))
  return (
    <div className={styles.root}>
      {didAssetChange && (
        <div className={styles.fileDiff} data-diff-layout={prev && next ? 'double' : 'single'}>
          {prev && (
            <DiffAnnotation diff={diff} path="asset._ref">
              <FilePreview value={prev} action={didAssetChange ? 'removed' : 'changed'} />
            </DiffAnnotation>
          )}
          {prev && next && (
            <div className={styles.arrow}>
              <ArrowIcon />
            </div>
          )}
          {next && (
            <DiffAnnotation diff={diff} path="asset._ref">
              <FilePreview value={next} action={didAssetChange ? 'added' : 'changed'} />
            </DiffAnnotation>
          )}
        </div>
      )}
      {nestedFields.length > 0 && (
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
      )}
    </div>
  )
}
