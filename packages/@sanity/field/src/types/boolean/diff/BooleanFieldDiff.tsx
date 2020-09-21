import React from 'react'
import {
  BooleanDiff,
  DiffComponent,
  DiffTooltip,
  FromToArrow,
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
    <DiffTooltip diff={diff}>
      <div className={styles.root}>
        <Preview checked={fromValue} color={userColor} />
        {toValue !== undefined && toValue !== null && (
          <>
            <FromToArrow />
            <div className={styles.label}>
              <Preview checked={toValue} color={userColor} />
              {title && <div className={styles.title}>{title}</div>}
            </div>
          </>
        )}
      </div>
    </DiffTooltip>
  )
}
