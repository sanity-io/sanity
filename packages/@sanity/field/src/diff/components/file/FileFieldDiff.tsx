import * as React from 'react'
import FileIcon from 'part:@sanity/base/file-icon'
import {DiffComponent, ObjectDiff} from '../../types'
import {DiffArrow, MetaInfo} from '../shared'
import {getRefValue} from '../hooks'
import styles from './FileFieldDiff.css'
import {useDiffAnnotationColor, DiffAnnotationTooltip} from '../../annotations'

function getSizeDiff(prev, next) {
  if (!prev || !next) {
    return 0
  }
  const increase = next - prev
  const pct = Math.round((increase / prev) * 100)
  return pct
}

export const FileFieldDiff: DiffComponent<ObjectDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields} = diff
  const fromAsset = fromValue?.asset
  const toAsset = toValue?.asset
  const prev: any = getRefValue(fromAsset?._ref)
  const next: any = getRefValue(toAsset?._ref)

  // Size in MB TODO: improve
  const prevSize = prev?.size && Math.round(prev.size / 1024)
  const nextSize = next?.size && Math.round(next.size / 1024)

  const changedFields = Object.keys(fields)
    .map(field => ({
      name: field,
      ...diff.fields[field]
    }))
    .filter(field => field.isChanged && field.name !== '_type')

  const changedFieldNames = changedFields.map(f => f.name)
  const didAssetChange = changedFieldNames.some(field => field === 'asset')

  const color = useDiffAnnotationColor(diff, 'asset._ref')
  const style = color ? {background: color.background, color: color.text} : {}
  const pctDiff = getSizeDiff(prevSize, nextSize)

  return (
    <div className={styles.root}>
      {didAssetChange && (
        <DiffAnnotationTooltip as="div" diff={diff} path="asset._ref" className={styles.tooltip}>
          <div className={styles.fileDiff} data-diff-layout={prev && next ? 'double' : 'single'}>
            {prev && (
              <div className={styles.annotation} style={style}>
                <MetaInfo
                  title={prev.originalFilename || 'Untitled'}
                  icon={FileIcon}
                  action={didAssetChange ? 'removed' : 'changed'}
                ></MetaInfo>
              </div>
            )}
            {prev && next && <DiffArrow />}
            {next && (
              <div className={styles.annotation} style={style}>
                <MetaInfo title={next.originalFilename || 'Untitled'} icon={FileIcon}>
                  <span>{didAssetChange ? 'added' : 'changed'}</span>
                  {pctDiff !== 0 && (
                    <div
                      className={styles.sizeDiff}
                      data-number={pctDiff > 0 ? 'positive' : 'negative'}
                    >
                      {pctDiff > 0 && '+'}
                      {pctDiff}%
                    </div>
                  )}
                </MetaInfo>
              </div>
            )}
          </div>
        </DiffAnnotationTooltip>
      )}
    </div>
  )
}

/*
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
      )}*/
