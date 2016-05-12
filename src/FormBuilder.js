import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'

export const FormBuilder = React.createClass({
  propTypes: {
    type: PropTypes.object.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  resolveFieldInput(field, type) {
    return this.context.resolveFieldInput(field, type)
  },

  render() {
    const {type, onChange, value} = this.props

    // Create a proforma field from type
    const field = {type: type.name}

    const FieldInput = this.resolveFieldInput(field, type)
    if (!FieldInput) {
      return <div>No field input resolved for field {JSON.stringify(field)}</div>
    }
    return (
      <FieldInput field={field} type={type} onChange={onChange} value={value} />
    )
  }
})
