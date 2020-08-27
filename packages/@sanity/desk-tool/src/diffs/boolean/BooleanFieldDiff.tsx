import React from 'react'
import {
  DiffComponent,
  BooleanDiff,
  DiffAnnotationTooltip,
  useDiffAnnotationColor
} from '@sanity/field/diff'
import ArrowIcon from 'part:@sanity/base/arrow-right'
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
          <div className={styles.arrow}>
            <ArrowIcon />
          </div>
          <div className={styles.label}>
            <Input checked={toValue} color={userColor} />
            {title && <div className={styles.title}>{title}</div>}
          </div>
        </>
      )}
    </DiffAnnotationTooltip>
  )
}
