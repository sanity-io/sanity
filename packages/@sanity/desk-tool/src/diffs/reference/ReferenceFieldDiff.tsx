import * as React from 'react'
import {useUserColorManager} from '@sanity/base'
import {ObjectDiff, StringSegmentChanged, StringDiff} from '@sanity/diff'
import Preview from 'part:@sanity/base/preview?'
import {Annotation} from '../../panes/documentPane/history/types'
import {AnnotationTooltip} from '../annotationTooltip'
import {getAnnotationColor} from '../helpers'
import {DiffComponent} from '../types'

import styles from './ReferenceFieldDiff.css'

interface Reference {
  _ref?: string
}

export const ReferenceFieldDiff: DiffComponent<ObjectDiff<Annotation>> = ({diff, schemaType}) => {
  const userColorManager = useUserColorManager()
  const {fromValue, toValue} = diff
  const prev = fromValue && fromValue._ref
  const next = toValue && toValue._ref
  const annotation = getAnnotation(diff)

  let color = {bg: '#fcc', fg: '#f00'}
  if (annotation) {
    color = getAnnotationColor(userColorManager, annotation)
  }

  const content = (
    <div className={styles.root} style={{background: color.bg, color: color.fg}}>
      {prev && (
        <div className={styles.removed}>
          <Preview type={schemaType} value={fromValue} layout="default" />
        </div>
      )}

      {prev && <div>⇩</div>}

      {next && <Preview type={schemaType} value={toValue} layout="default" />}
    </div>
  )

  return annotation ? (
    <AnnotationTooltip annotation={annotation}>{content}</AnnotationTooltip>
  ) : (
    content
  )
}

function getAnnotation(diff: ObjectDiff<Annotation>): Annotation {
  const refChange = diff.fields._ref
  if (refChange && refChange.type === 'string') {
    return getStringFieldAnnotation(refChange)
  }

  // Fall back to other fields if _ref field was not changed (eg, weak was changed)
  const modified = Object.values(diff.fields).find(
    fieldDiff => fieldDiff.action !== 'unchanged' && fieldDiff.type === 'string'
  )

  return modified ? getStringFieldAnnotation(modified as StringDiff<Annotation>) : null
}

function getStringFieldAnnotation(diff: StringDiff<Annotation>): Annotation | null {
  const changed = diff.segments.find(
    (segment): segment is StringSegmentChanged<Annotation> =>
      (segment.type === 'added' || segment.type === 'removed') && Boolean(segment.annotation)
  )

  return changed ? changed.annotation : null
}
