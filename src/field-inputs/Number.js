import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import update from 'react-addons-update'

class NumberContainer {
  constructor(value, context) {
    this.stringValue = value
    this.context = context
  }

  patch(patch) {
    if (patch.hasOwnProperty('$set')) {
      return new NumberContainer(patch.$set)
    }
    throw new Error(`Only $set is supported by NumberContainer, got: ${JSON.stringify(patch)}`)
  }

  unwrap() {
    return Number(this.stringValue)
  }
}

NumberContainer.wrap = function wrap(numberValue) {
  return new NumberContainer(numberValue)
}

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field,
    value: PropTypes.shape({stringValue: PropTypes.string}),
    onChange: PropTypes.func
  },

  statics: {
    container: NumberContainer
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  handleChange(e) {
    this.props.onChange({patch: {$set: e.target.value}})
  },

  render() {
    const {value} = this.props
    console.log(value)
    return (
      <input type="number"
        onChange={this.handleChange}
        value={value && value.stringValue}
      />
    )
  }

})
