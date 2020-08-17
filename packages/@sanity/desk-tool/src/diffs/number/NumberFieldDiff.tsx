import React from 'react'
import {useUserColorManager} from '@sanity/base/user-color'
import {DiffComponent, NumberDiff} from '@sanity/field/diff'
import {AnnotationTooltip} from '../annotationTooltip'
import {getAnnotationColor} from '../helpers'

import styles from './NumberFieldDiff.css'

export const NumberFieldDiff: DiffComponent<NumberDiff> = ({diff}) => {
  const userColorManager = useUserColorManager()
  const {fromValue, toValue} = diff
  const annotation = diff.isChanged ? diff.annotation : null
  const color = getAnnotationColor(userColorManager, annotation)

  const inlineStyle = {
    background: color.bg,
    color: color.fg
  }

  return (
    <AnnotationTooltip annotation={annotation}>
      <div className={styles.root}>
        {fromValue !== undefined && (
          <>
            <del style={inlineStyle}>{fromValue}</del>
            <span>&rarr;</span>
          </>
        )}
        <ins style={inlineStyle}>{toValue}</ins>
      </div>
    </AnnotationTooltip>
  )
}
