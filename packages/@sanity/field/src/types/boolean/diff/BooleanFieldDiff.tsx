import React from 'react'
import {
  BooleanDiff,
  DiffAnnotationTooltip,
  ChangeArrow,
  DiffComponent,
  useDiffAnnotationColor
} from '../../../diff'
import {Checkbox, Switch} from '../preview'
import styles from './BooleanFieldDiff.css'

export const BooleanFieldDiff: DiffComponent<BooleanDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const {title, options} = schemaType
  const Preview = options?.layout === 'checkbox' ? Checkbox : Switch
  const userColor = useDiffAnnotationColor(diff, []) || {background: '', text: '', border: ''}
  return (
    <DiffAnnotationTooltip as="div" className={styles.root} diff={diff}>
      <Preview checked={fromValue} color={userColor} />
      {toValue !== undefined && toValue !== null && (
        <>
          <ChangeArrow />
          <div className={styles.label}>
            <Preview checked={toValue} color={userColor} />
            {title && <div className={styles.title}>{title}</div>}
          </div>
        </>
      )}
    </DiffAnnotationTooltip>
  )
}
