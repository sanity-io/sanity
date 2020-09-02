import React from 'react'
import LinkIcon from 'part:@sanity/base/link-icon'
import {DiffAnnotationCard, DiffAnnotationTooltip} from '../../annotations'
import {DiffComponent, ReferenceDiff} from '../../types'
import {DiffLayout, MetaInfo as ReferenceDetails} from '../shared'
import {useRefPreview} from '../hooks'
import styles from './ReferenceFieldDiff.css'

// TODO: fix hooks error

export const ReferenceFieldDiff: DiffComponent<ReferenceDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const prev = fromValue && useRefPreview(fromValue, schemaType)
  const next = toValue && useRefPreview(toValue, schemaType)

  return (
    <DiffAnnotationTooltip as="div" diff={diff} path="_ref">
      <DiffLayout
        layout={prev && next ? 'grid' : 'inline'}
        renderFrom={
          prev && (
            <DiffAnnotationCard className={styles.annotation} diff={diff} path="_ref">
              <ReferenceDetails
                title={prev.title || 'Untitled'}
                action={prev && next ? 'changed' : 'removed'}
                icon={LinkIcon}
              />
            </DiffAnnotationCard>
          )
        }
        renderTo={
          next && (
            <DiffAnnotationCard className={styles.annotation} diff={diff} path="_ref">
              <ReferenceDetails
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
