import React from 'react'
import {useUserColorManager} from '@sanity/base/user-color'
import {DiffComponent as SanityDiffComponent, ArrayDiff, ItemDiff} from '@sanity/field/diff'
import {FallbackDiff} from '../_fallback/FallbackDiff'
import {resolveDiffComponent} from '../resolveDiffComponent'
import {getAnnotationColor} from '../helpers'
import {isPTSchemaType, PTDiff} from '../portableText'

import styles from './arrayFieldDiff.css'

export const ArrayFieldDiff: SanityDiffComponent<ArrayDiff> = function ArrayFieldDiff(props) {
  const userColorManager = useUserColorManager()

  if (isPTSchemaType(props.schemaType)) {
    return <PTDiff diff={props.diff} schemaType={props.schemaType} />
  }

  return (
    <div className={styles.root}>
      <div className={styles.itemList}>
        {props.diff.items.map((diffItem, diffItemIndex) => {
          const color = diffItem.diff.isChanged
            ? getAnnotationColor(userColorManager, diffItem.diff.annotation)
            : null

          return (
            <div className={styles.diffItemContainer} key={diffItemIndex}>
              <div
                className={styles.diffItemIndexes}
                style={color ? {background: color.bg, color: color.fg} : {}}
              >
                <ArrayDiffIndexes
                  fromIndex={diffItem.fromIndex}
                  toIndex={diffItem.toIndex}
                  hasMoved={diffItem.hasMoved}
                />
              </div>
              <div className={styles.diffItemBox}>
                <ArrayFieldDiffItem
                  itemDiff={diffItem}
                  //metadata={props.items && props.items[diffItemIndex]}
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
function ArrayDiffIndexes({
  fromIndex,
  toIndex,
  hasMoved
}: {
  fromIndex?: number
  toIndex?: number
  hasMoved: boolean
}) {
  if (!hasMoved) {
    return (
      <span className={styles.arrayDiffIndexes}>
        <span>{toIndex}</span>
      </span>
    )
  }

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

  if (fromIndex === toIndex) {
    // unchanged
    return (
      <span className={styles.arrayDiffIndexes}>
        <span>{fromIndex}</span>
      </span>
    )
  }

  if (typeof fromIndex === 'undefined' || typeof toIndex === 'undefined') {
    return null
  }

  return fromIndex < toIndex ? (
    <span className={styles.arrayDiffIndexes}>
      <span>{fromIndex}</span>
      <span>&darr;</span>
      <span>{toIndex}</span>
    </span>
  ) : (
    <span className={styles.arrayDiffIndexes}>
      <span>{toIndex}</span>
      <span>&uarr;</span>
      <span>{fromIndex}</span>
    </span>
  )
}

// eslint-disable-next-line complexity
function ArrayFieldDiffItem(props: {
  itemDiff: ItemDiff
  metadata?: {fromType?: {name: string}; toType?: {name: string}}
}) {
  const {itemDiff, metadata = {}} = props
  const diff = itemDiff.diff

  if (diff.action === 'added') {
    const schemaType: any = metadata.toType
    const DiffComponent = (schemaType && resolveDiffComponent(schemaType)) || FallbackDiff

    return <DiffComponent diff={diff} schemaType={schemaType} />
  }

  if (diff.action === 'changed') {
    const schemaType: any = metadata.toType
    const DiffComponent = (schemaType && resolveDiffComponent(schemaType)) || FallbackDiff

    return <DiffComponent diff={diff} schemaType={schemaType} />
  }

  if (diff.action === 'removed') {
    const schemaType: any = metadata.fromType || metadata.toType
    const DiffComponent = (schemaType && resolveDiffComponent(schemaType)) || FallbackDiff

    return <DiffComponent diff={diff} schemaType={schemaType} />
  }

  // @todo: render unchanged items?
  return <div>[unchanged]</div>
  // return (
  //   <pre className={styles.item}>
  //     Unchanged item ({metadata.toType && metadata.toType.name}): {JSON.stringify(diff, null, 2)}
  //   </pre>
  // )
}
