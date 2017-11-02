import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import PropTypes from 'prop-types'
import React from 'react'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {FormBuilderInput} from '../../FormBuilderInput'
import InvalidValue from '../InvalidValue'
import MemberValue from '../../Member'

import styles from './styles/Field.css'
import {resolveTypeName} from '../../utils/resolveTypeName'

// This component renders a single type in an object type. It emits onChange events telling the owner about the name of the type
// that changed. This gives the owner an opportunity to use the same event handler function for all of its fields
export default class Field extends React.Component {

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    focusPath: PropTypes.array,
    level: PropTypes.number
  };

  handleChange = event => {
    const {field, onChange} = this.props
    if (!field.type.readOnly) {
      onChange(event, field)
    }
  }

  handleFocus = path => {
    const {field, onFocus} = this.props
    onFocus(path, field)
  }

  handleBlur = path => {
    const {field, onBlur} = this.props
    onBlur(path, field)
  }

  hasFocus() {
    return this.props.focusPath[0] === true
  }

  focus() {
    console.log('FOCUS')
    this._input.focus()
  }

  setInput = input => {
    this._input = input
  }
  render() {
    const {value, field, level, focusPath} = this.props

    if (typeof value !== 'undefined') {
      const expectedType = field.type.name
      const actualType = resolveTypeName(value)

      // todo: we should consider removing this, and not allow aliasing native types
      // + ensure custom object types always gets annotated with _type
      const isCompatible = actualType === field.type.jsonType

      if (expectedType !== actualType && !isCompatible) {
        return (
          <Fieldset legend={field.type.title} level={level}>
            <InvalidValue
              value={value}
              onChange={this.handleChange}
              validTypes={[field.type.name]}
              actualType={actualType}
            />
          </Fieldset>
        )
      }
    }

    return (
      <div className={styles.root}>
        {<div>HAS FOcus {JSON.stringify(focusPath, null, 2)}</div>}
        <MemberValue path={field.name}>
          <FormBuilderInput
            value={value}
            type={field.type}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            focusPath={focusPath}
            level={level}
            ref={this.setInput}
          />
        </MemberValue>
      </div>
    )
  }
}
