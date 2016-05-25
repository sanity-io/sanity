import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import update from 'react-addons-update'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field,
    value: PropTypes.number,
    onChange: PropTypes.func
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  handleChange(e) {
    const val = e.target.value.trim()
    this.props.onChange({patch: {$set: val === '' ? void 0 : Number(e.target.value)}})
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
