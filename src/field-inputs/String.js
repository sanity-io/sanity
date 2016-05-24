import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import {eq} from 'lodash'

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

  shouldComponentUpdate(nextProps) {
    return !eq(this.props, nextProps)
  },

  handleChange(e) {
    this.props.onChange({patch: {$set: e.target.value}})
  },

  render() {
    const {value, field} = this.props
    return (
      <input
        type="text"
        placeholder={field.placeholder}
        onChange={this.handleChange}
        value={value}
      />
    )
  }
})
