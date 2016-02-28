import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field,
    value: PropTypes.number,
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
      <input type="number"
        onChange={this.handleChange}
        value={value}
      />
    )
  }

})
