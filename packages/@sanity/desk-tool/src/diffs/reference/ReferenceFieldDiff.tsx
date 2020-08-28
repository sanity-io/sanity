import React from 'react'
import {
  DiffComponent,
  ReferenceDiff,
  DiffAnnotationTooltip,
  useDiffAnnotationColor
} from '@sanity/field/diff'
import LinkIcon from 'part:@sanity/base/link-icon'
import {useRefPreview} from '../hooks'
import styles from './ReferenceFieldDiff.css'
import {DiffLayout, MetaInfo as ReferenceDetails} from '../shared'

// TODO: fix hooks error

export const ReferenceFieldDiff: DiffComponent<ReferenceDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const prev = fromValue && useRefPreview(fromValue, schemaType)
  const next = toValue && useRefPreview(toValue, schemaType)
  const color = useDiffAnnotationColor(diff, '_ref')
  const style = color ? {background: color.background, color: color.text} : {}
  return (
    <DiffAnnotationTooltip as="div" diff={diff} path="_ref">
      <DiffLayout
        layout={prev && next ? 'grid' : 'inline'}
        renderFrom={
          prev && (
            <div className={styles.annotation} style={style}>
              <ReferenceDetails
                title={prev.title || 'Untitled'}
                action={prev && next ? 'changed' : 'removed'}
                icon={LinkIcon}
              />
            </div>
          )
        }
        renderTo={
          next && (
            <div className={styles.annotation} style={style}>
              <ReferenceDetails
                title={next.title || 'Untitled'}
                action={prev && next ? 'changed' : 'added'}
                icon={LinkIcon}
              />
            </div>
          )
        }
      />
    </DiffAnnotationTooltip>
  )
}
