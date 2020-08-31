import * as React from 'react'
import FileIcon from 'part:@sanity/base/file-icon'
import {ChangeList} from '../../changes'
import {useDiffAnnotationColor, DiffAnnotationTooltip} from '../../annotations'
import {DiffComponent, ObjectDiff} from '../../types'
import {DiffArrow, MetaInfo} from '../shared'
import {getRefValue} from '../hooks'
import {File, FileAsset} from './types'
import styles from './FileFieldDiff.css'

export const FileFieldDiff: DiffComponent<ObjectDiff<File>> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields} = diff
  const fromAsset = fromValue?.asset
  const toAsset = toValue?.asset
  const prev = getRefValue<FileAsset>(fromAsset?._ref)
  const next = getRefValue<FileAsset>(toAsset?._ref)

  // Size in MB TODO: improve
  const prevSize = prev?.size && Math.round(prev.size / 1024)
  const nextSize = next?.size && Math.round(next.size / 1024)

  const changedFields = Object.keys(fields).filter(
    name => fields[name].isChanged && name !== '_type'
  )

  const nestedFields = schemaType.fields
    .filter(field => field.name !== 'asset' && changedFields.includes(field.name))
    .map(field => field.name)

  const didAssetChange = changedFields.includes('asset')

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
                />
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

      {nestedFields.length > 0 && (
        <div className={styles.nestedFields}>
          <ChangeList diff={diff} schemaType={schemaType} fields={nestedFields} />
        </div>
      )}
    </div>
  )
}

function getSizeDiff(prev: number | undefined, next: number | undefined): number {
  if (!prev || !next) {
    return 0
  }

  const increase = next - prev
  const pct = Math.round((increase / prev) * 100)
  return pct
}
