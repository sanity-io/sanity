import {useUserColorManager} from '@sanity/base'
import {BooleanDiff} from '@sanity/diff'
import React from 'react'
import {Annotation} from '../panes/documentPane/history/types'
import {AnnotationTooltip} from './annotationTooltip'
import {getAnnotationColor} from './helpers'
import {DiffComponent} from './types'

import styles from './BooleanFieldDiff.css'

export const BooleanFieldDiff: DiffComponent<BooleanDiff<Annotation>> = ({diff}) => {
  const userColorManager = useUserColorManager()
  const {fromValue, toValue, annotation} = diff
  const color = getAnnotationColor(userColorManager, annotation)

  return (
    <AnnotationTooltip annotation={annotation}>
      <div className={styles.root} style={{background: color.bg, color: color.fg}}>
        {fromValue !== undefined && (
          <>
            <input type="checkbox" checked={fromValue} readOnly />
            <span>&rarr;</span>
          </>
        )}
        <input type="checkbox" checked={toValue} readOnly />
      </div>
    </AnnotationTooltip>
  )
}
