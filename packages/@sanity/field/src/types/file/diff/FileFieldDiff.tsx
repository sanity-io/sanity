import * as React from 'react'
import FileIcon from 'part:@sanity/base/file-icon'
import {useRefValue} from '../../../diff/hooks'
import {MetaInfo, ChangeArrow} from '../../../diff/components'
import {
  DiffComponent,
  ObjectDiff,
  useDiffAnnotationColor,
  DiffAnnotationTooltip,
  ChangeList
} from '../../../diff'
import {File, FileAsset} from './types'
import styles from './FileFieldDiff.css'

export const FileFieldDiff: DiffComponent<ObjectDiff<File>> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields} = diff
  const fromAsset = fromValue?.asset
  const toAsset = toValue?.asset
  const prev = useRefValue<FileAsset>(fromAsset?._ref)
  const next = useRefValue<FileAsset>(toAsset?._ref)

  const changedFields = Object.keys(fields).filter(
    name => fields[name].isChanged && name !== '_type'
  )

  const nestedFields = schemaType.fields
    .filter(field => field.name !== 'asset' && changedFields.includes(field.name))
    .map(field => field.name)

  const didAssetChange = changedFields.includes('asset')

  const color = useDiffAnnotationColor(diff, 'asset._ref')
  const style = color ? {background: color.background, color: color.text} : {}

  // Sizes in MB TODO: improve. Apple uses 1000^2
  const prevSize = prev?.size && prev.size / 1000 / 1000
  const nextSize = next?.size && next.size / 1000 / 1000

  const pctDiff = getSizeDiff(prevSize, nextSize)

  const roundedPrevSize = prevSize ? prevSize.toFixed(2) : undefined
  const roundedNextSize = nextSize ? nextSize.toFixed(2) : undefined

  return (
    <div className={styles.root}>
      {didAssetChange && (
        <DiffAnnotationTooltip as="div" diff={diff} path="asset._ref" className={styles.tooltip}>
          <div className={styles.fileDiff} data-diff-layout={prev && next ? 'double' : 'single'}>
            {prev && (
              <div
                className={styles.annotation}
                style={style}
                data-action={didAssetChange ? 'removed' : 'changed'}
              >
                <MetaInfo title={prev.originalFilename || 'Untitled'} icon={FileIcon}>
                  <span>{`${roundedPrevSize}MB`}</span>
                </MetaInfo>
              </div>
            )}
            {prev && next && <ChangeArrow />}
            {next && (
              <div
                className={styles.annotation}
                style={style}
                data-action={didAssetChange ? 'added' : 'changed'}
              >
                <MetaInfo title={next.originalFilename || 'Untitled'} icon={FileIcon}>
                  <span>{`${roundedNextSize}MB`}</span>
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
