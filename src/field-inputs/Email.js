import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import Str from './String'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  },

  getDefaultProps() {
    return {
      value: '',
      onChange() {}
    }
  },

  handleChange(event) {
    this.props.onChange(event.target.value)
  },

  render() {
    const {value, field} = this.props
    return (
      <Str type="email" field={field} value={value} onChange={this.handleChange} />
    )
  }
})
