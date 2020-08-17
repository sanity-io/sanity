import {useUserColorManager} from '@sanity/base/user-color'
import React from 'react'
import {DiffComponent, BooleanDiff} from '@sanity/field/diff'
import {AnnotationTooltip} from '../annotationTooltip'
import {getAnnotationColor} from '../helpers'

import styles from './BooleanFieldDiff.css'

export const BooleanFieldDiff: DiffComponent<BooleanDiff> = ({diff}) => {
  const userColorManager = useUserColorManager()
  const {fromValue, toValue} = diff
  const annotation = diff.isChanged ? diff.annotation : null
  const color = getAnnotationColor(userColorManager, annotation)

  return (
    <AnnotationTooltip annotation={annotation}>
      <div className={styles.root} style={{background: color.bg, color: color.fg}}>
        {fromValue !== undefined && fromValue !== null && (
          <input type="checkbox" checked={fromValue} readOnly />
        )}
        {diff.action === 'changed' && <span>&rarr;</span>}
        {toValue !== undefined && toValue !== null && (
          <input type="checkbox" checked={toValue} readOnly />
        )}
      </div>
    </AnnotationTooltip>
  )
}
