import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import {eq} from 'lodash'

export default React.createClass({
  propTypes: {
    fieldInput: PropTypes.func.isRequired, // react element
    field: FormBuilderPropTypes.field.isRequired,
    name: PropTypes.string,
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  shouldComponentUpdate(nextProps) {
    const shouldUpdate = !eq(this.props, nextProps)
    if (!shouldUpdate) {
      console.log('Skip update in ', this.props.name)
    }
    return shouldUpdate
  },

  handleChange(newValue) {
    this.props.onChange(newValue, this.props.name)
  },

  render() {
    const {field, name, value, fieldInput} = this.props
    const FieldInput = fieldInput
    return (
      <div key={name}>
        {/* <pre>{JSON.stringify(field, null, 2)}</pre> */}
        <FieldInput value={value} onChange={this.handleChange} field={field} />
      </div>
    )
  }
})
