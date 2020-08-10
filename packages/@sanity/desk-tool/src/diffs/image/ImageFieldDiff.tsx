import * as React from 'react'
import {useUserColorManager} from '@sanity/base'
import {ObjectDiff, FieldDiff, StringSegmentChanged, StringDiff} from '@sanity/diff'
import Preview from 'part:@sanity/base/preview?'
import {Annotation} from '../../panes/documentPane/history/types'
import {AnnotationTooltip} from '../annotationTooltip'
import {getAnnotationColor} from '../helpers'
import {DiffComponent} from '../types'

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

export const ImageFieldDiff: DiffComponent<ObjectDiff<Annotation, Image>> = ({
  diff,
  schemaType
}) => {
  const userColorManager = useUserColorManager()
  const {fromValue, toValue} = diff
  const prev = fromValue?.asset?._ref
  const next = toValue?.asset?._ref
  const annotation = getRefFieldAnnotation(diff)

  let color = {bg: '#fcc', fg: '#f00'}
  if (annotation) {
    color = getAnnotationColor(userColorManager, annotation)
  }

  const content = (
    <div className={styles.root} style={{background: color.bg, color: color.fg}}>
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

function getStringFieldAnnotation(field: FieldDiff<Annotation>): Annotation | null {
  if (field.type === 'added' || field.type === 'removed') {
    return field.annotation
  }

  if (field.type === 'changed') {
    const diff = field.diff as StringDiff
    const changed = diff.segments.find(
      (segment): segment is StringSegmentChanged<Annotation> =>
        (segment.type === 'added' || segment.type === 'removed') && Boolean(segment.annotation)
    )

    return changed ? changed.annotation : null
  }

  // Unchanged
  return null
}

function getRefFieldAnnotation(diff: ObjectDiff<Annotation>): Annotation | null {
  const assetFieldDiff = diff.fields.asset
  if (!assetFieldDiff || assetFieldDiff.type === 'unchanged') {
    return null
  }

  if (assetFieldDiff.type === 'added' || assetFieldDiff.type === 'removed') {
    return assetFieldDiff.annotation
  }

  if (assetFieldDiff.diff.type !== 'object') {
    return null
  }

  const refField = assetFieldDiff.diff.fields._ref
  return refField ? getStringFieldAnnotation(refField) : null
}
