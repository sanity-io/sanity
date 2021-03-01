import FileIcon from 'part:@sanity/base/file-icon'
import React from 'react'
import {
  DiffComponent,
  DiffCard,
  DiffTooltip,
  FromTo,
  MetaInfo,
  ChangeList,
  ObjectDiff,
} from '../../../diff'
import {useRefValue} from '../../../diff/hooks'
import {getSizeDiff} from './helpers'
import {File, FileAsset} from './types'

import styles from './FileFieldDiff.css'

export const FileFieldDiff: DiffComponent<ObjectDiff<File>> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields} = diff
  const fromAsset = fromValue?.asset
  const toAsset = toValue?.asset
  const prev = useRefValue<FileAsset>(fromAsset?._ref)
  const next = useRefValue<FileAsset>(toAsset?._ref)

  const changedFields = Object.keys(fields).filter(
    (name) => fields[name].isChanged && name !== '_type'
  )

  const nestedFields = schemaType.fields
    .filter((field) => field.name !== 'asset' && changedFields.includes(field.name))
    .map((field) => field.name)

  const didAssetChange = changedFields.includes('asset')

  // Sizes in MB TODO: improve. Apple uses 1000^2
  const prevSize = prev?.size && prev.size / 1000 / 1000
  const nextSize = next?.size && next.size / 1000 / 1000
  const pctDiff = getSizeDiff(prevSize, nextSize)

  const roundedPrevSize = prevSize ? prevSize.toFixed(2) : undefined
  const roundedNextSize = nextSize ? nextSize.toFixed(2) : undefined

  const from = prev && (
    <DiffCard as="del" className={styles.card} diff={diff} path="asset._ref">
      <MetaInfo title={prev.originalFilename || 'Untitled'} icon={FileIcon}>
        <span>{`${roundedPrevSize}MB`}</span>
      </MetaInfo>
    </DiffCard>
  )

  const to = next && (
    <DiffCard as="ins" className={styles.card} diff={diff} path="asset._ref">
      <MetaInfo title={next.originalFilename || 'Untitled'} icon={FileIcon}>
        <span>{`${roundedNextSize}MB`}</span>
        {pctDiff !== 0 && (
          <div className={styles.sizeDiff} data-number={pctDiff > 0 ? 'positive' : 'negative'}>
            {pctDiff > 0 && '+'}
            {pctDiff}%
          </div>
        )}
      </MetaInfo>
    </DiffCard>
  )

  return (
    <div className={styles.root}>
      {/* Removed only */}
      {from && !to && (
        <DiffTooltip diff={diff} path="asset._ref" description="Removed">
          {from}
        </DiffTooltip>
      )}

      {/* Removed and added */}
      {from && to && (
        <DiffTooltip diff={diff} path="asset._ref">
          <FromTo from={from} layout="grid" to={to} />
        </DiffTooltip>
      )}

      {/* Added only */}
      {!from && to && (
        <DiffTooltip diff={diff} path="asset._ref" description="Added">
          {to}
        </DiffTooltip>
      )}

      {nestedFields.length > 0 && (
        <div className={styles.nestedFields}>
          <ChangeList diff={diff} schemaType={schemaType} fields={nestedFields} />
        </div>
      )}
    </div>
  )
}
