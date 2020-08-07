import {useUserColorManager} from '@sanity/base'
import {NumberDiff} from '@sanity/diff'
import React from 'react'
import {Annotation} from '../../panes/documentPane/history/types'
import {getAnnotationColor} from './helpers'
import {DiffComponent} from './types'

import styles from './NumberFieldDiff.css'

export const NumberFieldDiff: DiffComponent<NumberDiff<Annotation>> = ({diff}) => {
  const userColorManager = useUserColorManager()
  const {fromValue, toValue, annotation} = diff
  const color = getAnnotationColor(userColorManager, annotation)

  const inlineStyle = {
    background: color.bg,
    color: color.fg
  }

  return (
    <div className={styles.root}>
      {fromValue !== undefined && (
        <>
          <del style={inlineStyle}>{fromValue}</del>
          <span>&rarr;</span>
        </>
      )}
      <ins style={inlineStyle}>{toValue}</ins>
    </div>
  )
}
