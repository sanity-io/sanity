import React from 'react'
import {DiffComponent, BooleanDiff, DiffAnnotation} from '@sanity/field/diff'
import styles from './BooleanFieldDiff.css'

export const BooleanFieldDiff: DiffComponent<BooleanDiff> = ({diff}) => {
  const {fromValue, toValue} = diff

  return (
    <DiffAnnotation as="div" className={styles.root} diff={diff}>
      {fromValue !== undefined && fromValue !== null && (
        <input type="checkbox" checked={fromValue} readOnly />
      )}
      {diff.action === 'changed' && <span>&rarr;</span>}
      {toValue !== undefined && toValue !== null && (
        <input type="checkbox" checked={toValue} readOnly />
      )}
    </DiffAnnotation>
  )
}
