import React, {useRef} from 'react'
import {DiffComponent, BooleanDiff, DiffAnnotationTooltip} from '@sanity/field/diff'
import SwitchInput from 'part:@sanity/components/toggles/switch'
import CheckboxInput from 'part:@sanity/components/toggles/checkbox'
import ArrowIcon from 'part:@sanity/base/arrow-right'
import styles from './BooleanFieldDiff.css'

export const BooleanFieldDiff: DiffComponent<BooleanDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const inputRefFrom = useRef<any>(fromValue)
  const {title, options} = schemaType
  const Input = options?.layout === 'checkbox' ? CheckboxInput : SwitchInput
  return (
    <DiffAnnotationTooltip as="div" className={styles.root} diff={diff}>
      <div className={styles.input}>
        <Input checked={fromValue} ref={inputRefFrom} />
      </div>
      {toValue !== undefined && toValue !== null && (
        <>
          <div className={styles.arrow}>
            <ArrowIcon />
          </div>
          <div className={styles.input}>
            <Input checked={toValue} label={title} />
          </div>
        </>
      )}
    </DiffAnnotationTooltip>
  )
}
