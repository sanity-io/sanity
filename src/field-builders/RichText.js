import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default React.createClass({
  propTypes: {
    type: FormBuilderPropTypes.type,
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
    const {type, value} = this.props
    return (
      <textarea
        placeholder={type.placeholder}
        onChange={this.handleChange}
        value={value}
      />
    )
  }

})
