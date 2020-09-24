import React from 'react'
import {DiffCard, ObjectDiff} from '../../../../diff'
import styles from './Annotation.css'

export default function Annotation({diff, children}: {diff?: ObjectDiff; children: JSX.Element}) {
  let returned = children
  returned = (
    <span className={styles.root}>
      {diff && diff.action !== 'unchanged' ? (
        <DiffCard
          annotation={diff.annotation}
          as="ins"
          tooltip={{description: `Annotation ${diff.action} by`}}
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
