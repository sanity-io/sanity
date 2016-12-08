/* eslint-disable react/no-multi-comp */

import styles from 'part:@sanity/components/fieldsets/default-style'
import React, {PropTypes} from 'react'

export default function Fieldset(props) {
  const {fieldset, legend, description, columns, level, className} = props
  const levelString = `level${level}`
  const rootClass = `
    ${styles.root}
    ${columns && styles[`columns${columns}`]}
    ${styles[levelString]}
    ${className}
  `
  return (
    <fieldset className={rootClass} data-nesting-level={props.level}>
      <div className={styles.inner}>
        <legend className={styles.legend}>{legend || fieldset.legend}</legend>
        {
          (description || fieldset.description)
          && <p className={styles.description}>
            {description || fieldset.description}
          </p>
        }
        <div className={styles.content}>
          <div className={styles.fieldWrapper}>
            {props.children}
          </div>
        </div>
      </div>
    </fieldset>
  )
}

export function FieldWrapper(props) {
  return (
    <div className={styles.fieldWrapper}>
      {props.children}
    </div>
  )
}

Fieldset.defaultProps = {
  fieldset: {}
}

FieldWrapper.propTypes = {
  children: PropTypes.node
}

Fieldset.propTypes = {
  description: PropTypes.string,
  legend: PropTypes.string.isRequired,
  columns: PropTypes.number,
  fieldset: PropTypes.shape({
    description: PropTypes.string,
    legend: PropTypes.string
  }),
  children: PropTypes.node,
  level: PropTypes.number,
  className: PropTypes.string
}
