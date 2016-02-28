import React from 'react'
import ControlledValue from '../mixins/ControlledValue'
import TimePicker from './TimePicker'
import DatePicker from './DatePicker'

const EventTime = React.createClass({
  displayName: 'DateTimePicker',
  mixins: [ControlledValue],
  set(field, val) {
    const currVal = this._getValue() || {}
    this._setValue(Object.assign({}, currVal, {[field]: val || null}))
  },
  handleTimeChange(newTime) {
    this.set('time', newTime)
  },
  handleDateChange(newDate) {
    this.set('date', newDate)
  },
  render() {

    const value = this._getValue() || {}

    return (
      <div>
        <DatePicker value={value.date} onChange={this.handleDateChange}/>
        <TimePicker value={value.time} onChange={this.handleTimeChange}/>
      </div>
    )
  }
})

export default EventTime
