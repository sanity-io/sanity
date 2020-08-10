import {useUserColorManager} from '@sanity/base'
import {ItemDiff} from '@sanity/diff'
import React from 'react'
import {Annotation} from '../../panes/documentPane/history/types'
import {getAnnotationColor} from '../helpers'
import {isPTSchemaType, PTDiff} from '../portableText'
import {ArrayDiffProps} from './types'

import styles from './arrayFieldDiff.css'

export function ArrayFieldDiff(props: ArrayDiffProps) {
  const userColorManager = useUserColorManager()

  if (isPTSchemaType(props.schemaType)) {
    return <PTDiff diff={props.diff} items={props.items} schemaType={props.schemaType} />
  }

  return (
    <div className={styles.root}>
      <div className={styles.itemList}>
        {props.diff.items.map((diffItem, diffItemIndex) => {
          const color =
            diffItem.type === 'added' || diffItem.type === 'removed'
              ? getAnnotationColor(userColorManager, diffItem.annotation)
              : null

          return (
            <div className={styles.diffItemContainer} key={diffItemIndex}>
              <div
                className={styles.diffItemIndexes}
                style={color ? {background: color.bg, color: color.fg} : {}}
              >
                <ArrayDiffIndexes fromIndex={diffItem.fromIndex} toIndex={diffItem.toIndex} />
              </div>
              <div className={styles.diffItemBox}>
                <DefaultArrayDiffItem
                  diff={diffItem}
                  metadata={props.items && props.items[diffItemIndex]}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// eslint-disable-next-line complexity
function ArrayDiffIndexes({fromIndex, toIndex}: {fromIndex?: number; toIndex?: number}) {
  if (fromIndex === undefined && toIndex === undefined) {
    // neither `fromIndex` nor `toIndex`
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

  if (fromIndex === toIndex) {
    // unchanged
    return (
      <span className={styles.arrayDiffIndexes}>
        <span>{fromIndex}</span>
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

// eslint-disable-next-line complexity
function DefaultArrayDiffItem(props: {
  diff: ItemDiff<Annotation>
  metadata?: {fromType?: {name: string}; toType?: {name: string}}
}) {
  const {diff} = props
  const metadata = props.metadata || {fromType: undefined, toType: undefined}

  if (diff.type === 'added') {
    return (
      <pre className={styles.addedItem}>
        Added array item ({metadata.toType && metadata.toType.name}):{' '}
        {JSON.stringify(diff, null, 2)}
      </pre>
    )
  }

  if (diff.type === 'changed') {
    return (
      <pre className={styles.changedItem}>
        Changed array item ({metadata.fromType && metadata.fromType.name}&rarr;
        {metadata.toType && metadata.toType.name}): {JSON.stringify(diff, null, 2)}
      </pre>
    )
  }

  if (diff.type === 'removed') {
    return (
      <pre className={styles.removedItem}>
        Removed array item ({metadata.fromType && metadata.fromType.name}):{' '}
        {JSON.stringify(diff, null, 2)}
      </pre>
    )
  }

  // @todo: render moved items?
  return (
    <pre className={styles.item}>
      Unchanged item ({metadata.toType && metadata.toType.name}): {JSON.stringify(diff, null, 2)}
    </pre>
  )
}
