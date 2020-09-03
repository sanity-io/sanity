import * as React from 'react'
import {StringDiffSegment, StringDiff} from '../../types'
import {DiffAnnotation} from '../annotations'
import styles from './AnnotatedStringDiff.css'

export function AnnotatedStringDiffSegment({
  segment
}: {
  segment: StringDiffSegment
}): React.ReactElement {
  if (segment.type === 'added') {
    return (
      <DiffAnnotation annotation={segment.annotation} as="ins" className={styles.add}>
        {segment.text}
      </DiffAnnotation>
    )
  }

  if (segment.type === 'removed') {
    return (
      <DiffAnnotation annotation={segment.annotation} as="del" className={styles.remove}>
        {segment.text}
      </DiffAnnotation>
    )
  }

  return <>{segment.text}</>
}

export function AnnotatedStringDiff({diff}: {diff: StringDiff}) {
  return (
    <>
      {(diff.segments || []).map((segment, idx) => (
        <AnnotatedStringDiffSegment key={String(idx)} segment={segment} />
      ))}
    </>
  )
}
