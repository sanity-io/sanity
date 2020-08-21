import * as React from 'react'
import Preview from 'part:@sanity/base/preview?'
import {DiffComponent, ReferenceDiff, DiffAnnotation} from '@sanity/field/diff'
import styles from './ReferenceFieldDiff.css'

export const ReferenceFieldDiff: DiffComponent<ReferenceDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const prev = fromValue && fromValue._ref
  const next = toValue && toValue._ref

  return (
    <DiffAnnotation as="div" className={styles.root} diff={diff} path="_ref">
      {prev && (
        <div className={styles.removed}>
          <Preview type={schemaType} value={fromValue} layout="default" />
        </div>
      )}

      {prev && <div>⇩</div>}

      {next && <Preview type={schemaType} value={toValue} layout="default" />}
    </DiffAnnotation>
  )
}
