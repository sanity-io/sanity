import * as React from 'react'
import {useUserColorManager} from '@sanity/base/user-color'
import {
  Annotation,
  DiffComponent,
  ObjectDiff,
  ReferenceDiff,
  StringDiff,
  StringSegmentChanged
} from '@sanity/field/diff'
import Preview from 'part:@sanity/base/preview?'
import {AnnotationTooltip} from '../annotationTooltip'
import {getAnnotationColor} from '../helpers'

import styles from './ImageFieldDiff.css'

interface Image {
  asset?: {
    _ref: string
  }
  hotspot: {
    height: number
    width: number
    x: number
    y: number
  }
  crop: {
    bottom: number
    left: number
    right: number
    top: number
  }
}

/**
 * Todo:
 * - Indicate hotspot/crop changes
 * - Show diffs for metadata fields
 */

export const ImageFieldDiff: DiffComponent<ObjectDiff<Image>> = ({diff, schemaType}) => {
  if (diff.action !== 'changed') {
    return (
      <div>
        Image was <pre>{diff.action}</pre>
      </div>
    )
  }

  const userColorManager = useUserColorManager()
  const {fromValue, toValue} = diff
  const prev = fromValue?.asset?._ref
  const next = toValue?.asset?._ref
  const annotation = getRefFieldAnnotation(diff)
  const color = getAnnotationColor(userColorManager, annotation)

  const content = (
    <div className={styles.root} style={{background: color.background, color: color.text}}>
      {prev && (
        <div className={styles.removed}>
          <Preview type={schemaType} value={fromValue} layout="card" />
        </div>
      )}

      {prev && <div>⇩</div>}

      {next && <Preview type={schemaType} value={toValue} layout="card" />}
    </div>
  )

  return annotation ? (
    <AnnotationTooltip annotation={annotation}>{content}</AnnotationTooltip>
  ) : (
    content
  )
}

function getStringFieldAnnotation(diff: StringDiff): Annotation | null {
  const changed = diff.segments.find(
    (segment): segment is StringSegmentChanged =>
      (segment.type === 'added' || segment.type === 'removed') && Boolean(segment.annotation)
  )

  return changed ? changed.annotation : null
}

function getRefFieldAnnotation(diff: ObjectDiff<Image>): Annotation | null {
  const assetFieldDiff = diff.fields.asset as ReferenceDiff
  if (!assetFieldDiff || assetFieldDiff.action === 'unchanged') {
    return null
  }

  if (assetFieldDiff.type !== 'object') {
    return null
  }

  const refField = assetFieldDiff.fields._ref
  if (!refField || refField.type !== 'string') {
    return null
  }

  return getStringFieldAnnotation(refField)
}
