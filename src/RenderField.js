import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import equals from 'shallow-equals'
import basicTypes from './types'
import {resolveJSType} from './types/utils'
import {getFieldType} from './utils/getFieldType'
import ClearButton from './buttons/ClearButton'

import styles from './styles/form-builder.css'
export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field.isRequired,
    fieldName: PropTypes.string.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  },

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  },

  renderDefaultField(el) {
    const {field, fieldName} = this.props
    return (
      <div key={fieldName} className={styles.field}>
        <label className={styles.fieldLabel}>
          {field.title} ({fieldName})
        </label>
        <div className={styles.formControlContainer}>
          {el}
        </div>
      </div>
    )
  },

  handleChange(event) {
    const {fieldName, onChange} = this.props
    onChange(event, fieldName)
  },

  resolveFieldInput(field, fieldType) {
    return this.context.resolveFieldInput(field, fieldType)
  },

  getFieldType(field) {
    return getFieldType(this.context.schema, field)
  },

  render() {
    const {value, field} = this.props

    const fieldType = this.getFieldType(field)

    const FieldInput = this.context.resolveFieldInput(field, fieldType)
    if (!FieldInput) {
      return (
        <div>Field input not found for field of type "{field.type}"
          <pre>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )
    }

    const passUnwrapped = value && value.constructor.passUnwrapped

    return this.renderDefaultField(
      <FieldInput
        value={passUnwrapped ? value.unwrap() : value}
        field={field}
        type={fieldType}
        onChange={this.handleChange}
      />
    )
  }
})
