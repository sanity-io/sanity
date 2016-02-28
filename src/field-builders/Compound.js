import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import FormBuilder from '../FormBuilder'
import {eq} from 'lodash'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    onChange: PropTypes.func
  },

  getDefaultProps() {
    return {
      onChange() {
      }
    }
  },

  shouldComponentUpdate(nextProps) {
    return !eq(this.props, nextProps)
  },

  handleChange(newValue) {
    this.props.onChange(newValue)
  },

  render() {
    const {value, field} = this.props
    return (
      <FormBuilder
        fields={field.type.fields}
        onChange={this.handleChange}
        value={value}
      />
    )
  }

})
