import React from 'react'
import ReactDOM from 'react-dom'

import zerofill from 'zero-fill'

import ControlledValue from '../mixins/ControlledValue'

function normalizeTimeInputValue(value) {
  if (!value) {
    return value
  }
  const [h, m] = value.split(':')
  const d = new Date()
  d.setHours(Math.max(0, Math.min(h || 0, 23)))
  d.setMinutes(Math.max(0, Math.min(m || 0, 59)))
  return [d.getHours(), d.getMinutes()].join(':')
}

function formatTime(timeStr) {
  if (!timeStr) {
    return timeStr
  }
  const [h, m] = timeStr.split(':')
  return zerofill(2, h) + ':' + zerofill(2, m)

}

export default React.createClass({
  displayName: 'TimePicker',
  mixins: [ControlledValue],
  propTypes: {
    value: React.PropTypes.string
  },

  getInitialState() {
    return {shadowValue: null}
  },

  preventInvalidKeys(e) {
    if (/[^\d\:]/g.test(String.fromCharCode(e.charCode))) {
      e.preventDefault()
    }
  },
  handleChange(e) {
    this.setState({shadowValue: e.target.value})

    this._setValue(formatTime(normalizeTimeInputValue(e.target.value)))
  },
  handleBlur(e) {
    this.setState({shadowValue: null})
    this._setValue(formatTime(normalizeTimeInputValue(ReactDOM.findDOMNode(this).value)))
  },
  getInputValue() {
    if (this.state.shadowValue !== null) {
      return this.state.shadowValue
    }
    return formatTime(this._getValue())
  },
  render() {
    return (
      <input
        className="form-control pikaday-time"
        onBlur={this.handleBlur}
        onKeyPress={this.preventInvalidKeys}
        onChange={this.handleChange}
        value={this.getInputValue()}
        type='text'
        placeholder='e.g 16:30'
      />
    )
  }
})
