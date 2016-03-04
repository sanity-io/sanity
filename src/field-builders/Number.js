import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import update from 'react-addons-update'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field,
    value: PropTypes.shape({stringValue: PropTypes.string}),
    onChange: PropTypes.func
  },

  statics: {
    valueContainer: {
      wrap(value) {
        return {stringValue: String(value)}
      },
      unwrap(value) {
        const stringValue = value.stringValue.trim()
        return stringValue === '' ? null : Number(stringValue)
      }
    }
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  handleChange(e) {
    this.props.onChange(update(this.props.value, {stringValue: {$set: e.target.value}}))
  },

  render() {
    const {value} = this.props
    return (
      <input type="number"
        onChange={this.handleChange}
        value={value.stringValue}
      />
    )
  }

})
