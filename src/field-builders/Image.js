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
    const {value} = this.props
    return (
      <input type="file"
        onChange={this.handleChange}
        value={value}
      />
    )
  }

})
