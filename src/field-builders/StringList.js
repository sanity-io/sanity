import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import {isEqual} from 'lodash'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field,
    value: PropTypes.array,
    onChange: PropTypes.func
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  getInitialState() {
    return {inputValue: this.serialize(this.props.value)}
  },

  componentWillReceiveProps(nextProps) {
    if (!isEqual(nextProps.value, this.deserialize(this.state.inputValue))) {
      this.setState({inputValue: this.serialize(nextProps.value)})
    }
  },

  serialize(value) {
    return (value || []).join(', ')
  },

  deserialize(string) {
    return (string || '').split(/,\s*/)
  },

  handleChange(e) {
    this.setState({inputValue: e.target.value})
  },

  emitCurrentInputValue() {
    this.props.onChange(this.deserialize(this.state.inputValue))
  },

  handleBlur(e) {
    this.emitCurrentInputValue()
  },

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.emitCurrentInputValue()
    }
  },

  render() {
    const {inputValue} = this.state
    return (
      <div>
        (list)
        <input
          type="text"
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          onKeyPress={this.handleKeyPress}
          value={inputValue}
        />
      </div>
    )
  }

})
