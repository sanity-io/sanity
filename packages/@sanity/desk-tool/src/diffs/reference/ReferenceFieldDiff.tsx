import React from 'react'
import {DiffComponent, ReferenceDiff, DiffAnnotation} from '@sanity/field/diff'
import LinkIcon from 'part:@sanity/base/link-icon'
import ArrowIcon from 'part:@sanity/base/arrow-right'
import {useRefPreview} from '../hooks'
import styles from './ReferenceFieldDiff.css'

const ReferenceDetails = ({diff, title, action}) => {
  return (
    <DiffAnnotation as="div" diff={diff} path="_ref" className={styles.meta} data-action={action}>
      <div className={styles.icon}>
        <LinkIcon />
      </div>
      <div className={styles.info}>
        <h3 className={styles.title} title={title}>
          {title}
        </h3>
        <div>{action}</div>
      </div>
    </DiffAnnotation>
  )
}

export const ReferenceFieldDiff: DiffComponent<ReferenceDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const prev = fromValue && useRefPreview(fromValue, schemaType)
  const next = toValue && useRefPreview(toValue, schemaType)

  return (
    <div className={styles.root} data-diff-layout={prev && next ? 'double' : 'single'}>
      {prev && (
        <ReferenceDetails
          diff={diff}
          title={prev.title || 'Untitled'}
          action={prev && next ? 'changed' : 'removed'}
        />
      )}

      {prev && next && (
        <div className={styles.arrow}>
          <ArrowIcon />
        </div>
      )}

      {next && (
        <ReferenceDetails
          diff={diff}
          title={next.title || 'Untitled'}
          action={prev && next ? 'changed' : 'added'}
        />
      )}
    </div>
  )
}
