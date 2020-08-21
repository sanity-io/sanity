import * as React from 'react'
import {DiffComponent, ObjectDiff, DiffAnnotation} from '@sanity/field/diff'
import Preview from 'part:@sanity/base/preview?'
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

  const {fromValue, toValue} = diff
  const prev = fromValue?.asset?._ref
  const next = toValue?.asset?._ref

  return (
    <DiffAnnotation as="div" className={styles.root} diff={diff} path="asset._ref">
      {prev && (
        <div className={styles.removed}>
          <Preview type={schemaType} value={fromValue} layout="card" />
        </div>
      )}

      {prev && <div>⇩</div>}

      {next && <Preview type={schemaType} value={toValue} layout="card" />}
    </DiffAnnotation>
  )
}
