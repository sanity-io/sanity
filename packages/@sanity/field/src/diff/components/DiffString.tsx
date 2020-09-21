import * as React from 'react'
import {StringDiffSegment, StringDiff} from '../../types'
import {DiffAnnotation} from './DiffAnnotation'

import styles from './DiffString.css'

function FormattedPreviewText({
  isFirstSegment,
  isLastSegment,
  text
}: {
  isFirstSegment: boolean
  isLastSegment: boolean
  text: string
}) {
  const startsWithWhitespace = text.startsWith(' ')
  const endsWithWhitespace = text.endsWith(' ')
  const isWhitespace = text.trim().length === 0 ? styles.empty : false

  return (
    <>
      {isFirstSegment && startsWithWhitespace && <>&nbsp;</>}
      {isWhitespace ? <span className={styles.empty}>{text}</span> : text}
      {isLastSegment && endsWithWhitespace && <>&nbsp;</>}
    </>
  )
}

export function DiffStringSegment({
  isFirstSegment,
  isLastSegment,
  segment
}: {
  isFirstSegment: boolean
  isLastSegment: boolean
  segment: StringDiffSegment
}): React.ReactElement {
  const text = (
    <FormattedPreviewText
      isFirstSegment={isFirstSegment}
      isLastSegment={isLastSegment}
      text={segment.text}
    />
  )

  if (segment.action === 'added') {
    return (
      <DiffAnnotation
        annotation={segment.annotation}
        as="ins"
        className={styles.add}
        description="Added"
      >
        {text}
      </DiffAnnotation>
    )
  }

  if (segment.action === 'removed') {
    return (
      <DiffAnnotation
        annotation={segment.annotation}
        as="del"
        className={styles.remove}
        description="Removed"
      >
        {text}
      </DiffAnnotation>
    )
  }

  return text
}

export function DiffString({diff}: {diff: StringDiff}) {
  const len = diff.segments.length

  return (
    <>
      {(diff.segments || []).map((segment, segmentIndex) => (
        <DiffStringSegment
          isFirstSegment={segmentIndex === 0}
          isLastSegment={segmentIndex === len - 1}
          // eslint-disable-next-line react/no-array-index-key
          key={segmentIndex}
          segment={segment}
        />
      ))}
    </>
  )
}
