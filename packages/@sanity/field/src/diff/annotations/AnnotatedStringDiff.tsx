import * as React from 'react'
import {StringDiffSegment, StringDiff} from '../../types'
import {DiffAnnotation} from '../annotations'
import styles from './AnnotatedStringDiff.css'

export function AnnotatedStringDiffSegment({
  segment
}: {
  segment: StringDiffSegment
}): React.ReactElement {
  if (segment.action === 'added') {
    return (
      <DiffAnnotation
        annotation={segment.annotation}
        as="ins"
        className={styles.add}
        description="Added by"
      >
        {segment.text}
      </DiffAnnotation>
    )
  }

  if (segment.action === 'removed') {
    return (
      <DiffAnnotation
        annotation={segment.annotation}
        as="del"
        className={styles.remove}
        description="Removed by"
      >
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
