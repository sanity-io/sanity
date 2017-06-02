import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import PropTypes from 'prop-types'
import React from 'react'
import {FormBuilderInput} from '../../FormBuilderInput'
import InvalidValue from '../InvalidValue'
import MemberValue from '../../Member'

import styles from './styles/Field.css'
import {resolveTypeName} from '../../utils/resolveType'

// This component renders a single type in an object type. It emits onChange events telling the owner about the name of the type
// that changed. This gives the owner an opportunity to use the same event handler function for all of its fields
export default class Field extends React.Component {

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    validation: PropTypes.shape(FormBuilderPropTypes.validation),
    value: PropTypes.any,
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
    level: PropTypes.number,
    hasFocus: PropTypes.bool
  };

  static defaultProps = {
    validation: {messages: [], fields: {}},
    onEnter() {}
  };

  handleChange = event => {
    const {field, onChange} = this.props
    if (!field.type.readOnly) {
      onChange(event, field)
    }
  }

  handleEnter = event => {
    const {field, onEnter} = this.props
    onEnter(event, field)
  }

  render() {
    const {value, field, level, validation, hasFocus} = this.props

    if (typeof value !== 'undefined') {
      const expectedType = field.type.name
      const actualType = resolveTypeName(value)

      // todo: we should consider removing this, and not allow aliasing native types
      // + ensure custom object types always gets annotated with _type
      const isCompatible = actualType === field.type.jsonType

      if (expectedType !== actualType && !isCompatible) {
        return (
          <InvalidValue
            value={value}
            onChange={this.handleChange}
            validTypes={[field.type.name]}
            actualType={actualType}
          />
        )
      }
    }

    return (
      <div className={styles.root}>
        <MemberValue path={field.name}>
          <FormBuilderInput
            value={value}
            type={field.type}
            validation={validation}
            onChange={this.handleChange}
            onEnter={this.handleEnter}
            level={level}
            hasFocus={hasFocus}
          />
        </MemberValue>
      </div>
    )
  }
}
