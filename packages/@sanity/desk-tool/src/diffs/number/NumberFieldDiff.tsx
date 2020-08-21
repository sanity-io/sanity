import React from 'react'
import {DiffComponent, NumberDiff, DiffAnnotation} from '@sanity/field/diff'

import styles from './NumberFieldDiff.css'

export const NumberFieldDiff: DiffComponent<NumberDiff> = ({diff}) => {
  const {fromValue, toValue} = diff

  return (
    <DiffAnnotation as="div" className={styles.root} diff={diff}>
      {fromValue !== undefined && (
        <>
          <del>{fromValue}</del>
          <span>&rarr;</span>
        </>
      )}
      <ins>{toValue}</ins>
    </DiffAnnotation>
  )
}
