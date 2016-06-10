import FormBuilderPropTypes from '../FormBuilderPropTypes'
import styles from './styles/Field.css'

import React, {PropTypes} from 'react'

export default function DefaultFieldWrapper(props, context) {
  let className = styles.root

  if (props.level > 0) {
    className = styles[`level_${props.level}`]
  }

  const ValidationList = context.resolveValidationComponent()

  return (
    <div className={className}>
      <div className={styles.nestingLevel}>Field, nesting level {props.level}</div>
      <div className={styles.inner}>

        <label className={styles.label}>
          {props.field.title}
        </label>

        <div className={styles.content}>
          {props.children}
        </div>

        <ValidationList {...props.validation} />
      </div>
    </div>
  )
}

DefaultFieldWrapper.contextTypes = {
  resolveValidationComponent: PropTypes.func
}

DefaultFieldWrapper.propTypes = {
  children: PropTypes.node,
  role: PropTypes.string,
  level: PropTypes.number,
  label: PropTypes.string,
  title: PropTypes.string,
  field: PropTypes.object,
  validation: FormBuilderPropTypes.validation
}
