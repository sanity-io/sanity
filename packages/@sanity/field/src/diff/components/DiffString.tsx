import * as React from 'react'
import {StringDiffSegment, StringDiff} from '../../types'
import {DiffCard} from './DiffCard'

import styles from './DiffString.css'

export function DiffStringSegment({segment}: {segment: StringDiffSegment}): React.ReactElement {
  const {text} = segment

  if (segment.action === 'added') {
    return (
      <DiffCard
        annotation={segment.annotation}
        as="ins"
        className={styles.changedSegment}
        disableHoverEffect
        tooltip={{description: 'Added'}}
      >
        {text}
      </DiffCard>
    )
  }

  if (segment.action === 'removed') {
    return (
      <DiffCard
        annotation={segment.annotation}
        as="del"
        className={styles.changedSegment}
        disableHoverEffect
        tooltip={{description: 'Removed'}}
      >
        {text}
      </DiffCard>
    )
  }

  return <span className={styles.segment}>{text}</span>
}

export function DiffString({diff}: {diff: StringDiff}) {
  return (
    <>
      {(diff.segments || []).map((segment, segmentIndex) => (
        <DiffStringSegment
          // eslint-disable-next-line react/no-array-index-key
          key={segmentIndex}
          segment={segment}
        />
      ))}
    </>
  )
}
