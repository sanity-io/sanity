import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field,
    value: PropTypes.bool,
    onChange: PropTypes.func
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  handleChange(e) {
    this.props.onChange(e.target.checked)
  },

  render() {
    const {value} = this.props
    return (
      <input type="checkbox"
        onChange={this.handleChange}
        checked={!!value}
      />
    )
  }

})
