import React from 'react'
import {
  BooleanDiff,
  DiffComponent,
  DiffTooltip,
  FromToArrow,
  useDiffAnnotationColor,
} from '../../../diff'
import {Checkbox, Switch} from '../preview'
import styles from './BooleanFieldDiff.css'

export const BooleanFieldDiff: DiffComponent<BooleanDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const {title, options} = schemaType as any
  const Preview = options?.layout === 'checkbox' ? Checkbox : Switch
  const userColor = useDiffAnnotationColor(diff, []) || {background: '', text: '', border: ''}

  const showToValue = toValue !== undefined && toValue !== null

  return (
    <div className={styles.root}>
      <DiffTooltip diff={diff}>
        <div className={styles.preview}>
          <Preview checked={fromValue} color={userColor} />
          {showToValue && (
            <>
              <FromToArrow style={{padding: '0 2px'}} />
              <Preview checked={toValue} color={userColor} />
            </>
          )}
        </div>
      </DiffTooltip>
      {showToValue && (
        <div className={styles.label}>{title && <div className={styles.title}>{title}</div>}</div>
      )}
    </div>
  )
}
