import React from 'react'
import {DiffCard, ObjectDiff} from '../../../../diff'
import styles from './Annotation.css'

export default function Annotation({
  diff,
  mark,
  children
}: {
  diff: ObjectDiff
  mark: string
  children: JSX.Element
}) {
  let returned = children
  const annotationDiff =
    diff.fields.markDefs &&
    diff.fields.markDefs.isChanged &&
    diff.fields.markDefs.type === 'array' &&
    diff.fields.markDefs.items.find(
      item =>
        item.diff &&
        item.diff.type === 'object' &&
        item.diff.toValue &&
        item.diff.toValue._key &&
        item.diff.toValue._key === mark
    )?.diff
  returned = (
    <span className={styles.root}>
      {annotationDiff && annotationDiff.action !== 'unchanged' ? (
        <DiffCard
          annotation={annotationDiff.annotation}
          as="ins"
          tooltip={{description: `Annotation ${annotationDiff.action} by`}}
        >
          {returned}
        </DiffCard>
      ) : (
        returned
      )}
    </span>
  )
  return returned
}
