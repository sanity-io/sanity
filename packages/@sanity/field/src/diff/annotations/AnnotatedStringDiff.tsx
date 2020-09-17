import {useUserColorManager} from '@sanity/base/user-color'
import * as React from 'react'
import {StringDiffSegment, StringDiff} from '../../types'
import {DiffAnnotation} from '../annotations'
import styles from './AnnotatedStringDiff.css'
import {getAnnotationColor} from './helpers'

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

export function AnnotatedStringDiffSegment({
  isFirstSegment,
  isLastSegment,
  segment
}: {
  isFirstSegment: boolean
  isLastSegment: boolean
  segment: StringDiffSegment
}): React.ReactElement {
  const userColorManager = useUserColorManager()

  const text = (
    <FormattedPreviewText
      isFirstSegment={isFirstSegment}
      isLastSegment={isLastSegment}
      text={segment.text}
    />
  )

  if (segment.action === 'added') {
    const color = getAnnotationColor(userColorManager, segment.annotation)

    return (
      <DiffAnnotation
        annotation={segment.annotation}
        as="ins"
        className={styles.add}
        description="Added by"
        style={{background: color.background, color: color.text}}
      >
        {text}
      </DiffAnnotation>
    )
  }

  if (segment.action === 'removed') {
    const color = getAnnotationColor(userColorManager, segment.annotation)

    return (
      <DiffAnnotation
        annotation={segment.annotation}
        as="del"
        className={styles.remove}
        description="Removed by"
        style={{background: color.background, color: color.text}}
      >
        {text}
      </DiffAnnotation>
    )
  }

  return text
}

export function AnnotatedStringDiff({diff}: {diff: StringDiff}) {
  const len = diff.segments.length

  return (
    <>
      {(diff.segments || []).map((segment, segmentIndex) => (
        <AnnotatedStringDiffSegment
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
