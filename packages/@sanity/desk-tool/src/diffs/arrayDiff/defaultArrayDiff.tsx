import {ItemDiff} from '@sanity/diff'
import React from 'react'
import {Annotation} from '../../panes/documentPane/history/types'
import {ArrayDiffProps} from './types'

import styles from './defaultArrayDiff.css'

export function DefaultArrayDiff(props: ArrayDiffProps) {
  return (
    <div className={styles.root}>
      <div className={styles.itemList}>
        {props.diff.items.map((diffItem, diffItemIndex) => (
          <div className={styles.diffItemContainer} key={diffItemIndex}>
            <div className={styles.diffItemIndexes}>
              <ArrayDiffIndexes fromIndex={diffItem.fromIndex} toIndex={diffItem.toIndex} />
            </div>
            <div className={styles.diffItemBox}>
              <DefaultArrayDiffItem
                diff={diffItem}
                metadata={props.items && props.items[diffItemIndex]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// eslint-disable-next-line complexity
function ArrayDiffIndexes({fromIndex, toIndex}: {fromIndex?: number; toIndex?: number}) {
  if (fromIndex === undefined && toIndex === undefined) {
    return <span className={styles.arrayDiffIndexes} />
  }

  if (fromIndex !== undefined && toIndex === undefined) {
    // `fromIndex` only (removed)
    return (
      <span className={styles.arrayDiffIndexes}>
        <span>{fromIndex}</span>
      </span>
    )
  }

  if (fromIndex === undefined && toIndex !== undefined) {
    // `toIndex` only
    return (
      <span className={styles.arrayDiffIndexes}>
        <span>{toIndex}</span>
      </span>
    )
  }

  if (fromIndex !== undefined && toIndex !== undefined && fromIndex < toIndex) {
    return (
      <span className={styles.arrayDiffIndexes}>
        <span>{fromIndex}</span>
        <span>&darr;</span>
        <span>{toIndex}</span>
      </span>
    )
  }

  return (
    <span className={styles.arrayDiffIndexes}>
      <span>{toIndex}</span>
      <span>&uarr;</span>
      <span>{fromIndex}</span>
    </span>
  )
}

function DefaultArrayDiffItem(props: {
  diff: ItemDiff<Annotation>
  metadata?: {fromType?: string; toType?: string}
}) {
  const {diff} = props
  const metadata = props.metadata || {fromType: undefined, toType: undefined}

  if (diff.type === 'added') {
    return (
      <pre className={styles.addedItem}>
        Added array item ({metadata.toType}): {JSON.stringify(diff, null, 2)}
      </pre>
    )
  }

  if (diff.type === 'removed') {
    return (
      <pre className={styles.removedItem}>
        Removed array item ({metadata.fromType}): {JSON.stringify(diff, null, 2)}
      </pre>
    )
  }

  // @todo: render moved items?
  return (
    <pre className={styles.item}>
      Unchanged item ({metadata.toType}): {JSON.stringify(diff, null, 2)}
    </pre>
  )

  // return null
}
