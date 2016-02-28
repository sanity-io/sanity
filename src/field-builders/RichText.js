import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field,
    value: PropTypes.string,
    onChange: PropTypes.func
  },

  getDefaultProps() {
    return {
      onChange() {
      }
    }
  },

  handleChange(e) {
    this.props.onChange(e.target.value)
  },

  render() {
    const {field, value} = this.props
    return (
      <textarea
        placeholder={field.placeholder}
        onChange={this.handleChange}
        value={value}
      />
    )
  }

})
