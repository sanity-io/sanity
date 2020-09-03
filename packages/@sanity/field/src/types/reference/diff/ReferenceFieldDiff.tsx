import React from 'react'
import LinkIcon from 'part:@sanity/base/link-icon'
import {
  DiffComponent,
  ReferenceDiff,
  DiffAnnotationTooltip,
  DiffAnnotationCard
} from '../../../diff'
import styles from './ReferenceFieldDiff.css'
import {useRefPreview} from '../../../diff/hooks'
import {DiffLayout, MetaInfo} from '../../../diff/components'

// TODO: fix hooks error

export const ReferenceFieldDiff: DiffComponent<ReferenceDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const prev = fromValue && useRefPreview(fromValue, schemaType)
  const next = toValue && useRefPreview(toValue, schemaType)

  return (
    <DiffAnnotationTooltip as="div" diff={diff} path="_ref">
      <DiffLayout
        layout={prev && next ? 'grid' : 'inline'}
        from={
          prev && (
            <DiffAnnotationCard className={styles.annotation} diff={diff} path="_ref">
              <MetaInfo
                title={prev.title || 'Untitled'}
                action={prev && next ? 'changed' : 'removed'}
                icon={LinkIcon}
              />
            </DiffAnnotationCard>
          )
        }
        to={
          next && (
            <DiffAnnotationCard className={styles.annotation} diff={diff} path="_ref">
              <MetaInfo
                title={next.title || 'Untitled'}
                action={prev && next ? 'changed' : 'added'}
                icon={LinkIcon}
              />
            </DiffAnnotationCard>
          )
        }
      />
    </DiffAnnotationTooltip>
  )
}
