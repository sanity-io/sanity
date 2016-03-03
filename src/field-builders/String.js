import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import {eq} from 'lodash'

export default React.createClass({
  propTypes: {
    type: PropTypes.object,// FormBuilderPropTypes.field,
    value: PropTypes.string,
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

  handleChange(e) {
    this.props.onChange(e.target.value)
  },

  render() {
    const {value, type} = this.props
    return (
      <input
        type="text"
        placeholder={type.placeholder}
        onChange={this.handleChange}
        value={value}
      />
    )
  }

})
