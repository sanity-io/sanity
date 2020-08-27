import React from 'react'
import {DiffComponent, BooleanDiff} from '../../types'
import {DiffAnnotationTooltip, useDiffAnnotationColor} from '../../annotations'
import {DiffArrow} from '../shared'
import {Checkbox, Switch} from './BooleanInput'
import styles from './BooleanFieldDiff.css'

export const BooleanFieldDiff: DiffComponent<BooleanDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const {title, options} = schemaType
  const Input = options?.layout === 'checkbox' ? Checkbox : Switch
  const userColor = useDiffAnnotationColor(diff, []) || {background: '', text: '', border: ''}
  return (
    <DiffAnnotationTooltip as="div" className={styles.root} diff={diff}>
      <Input checked={fromValue} color={userColor} />
      {toValue !== undefined && toValue !== null && (
        <>
          <DiffArrow />
          <div className={styles.label}>
            <Input checked={toValue} color={userColor} />
            {title && <div className={styles.title}>{title}</div>}
          </div>
        </>
      )}
    </DiffAnnotationTooltip>
  )
}
