import React from 'react'
import moment from 'moment'
import ControlledValue from '../mixins/ControlledValue'
import DayPicker from 'react-day-picker'
const {LocaleUtils} = require('react-day-picker/lib/addons')
import config from '../../config'

export default React.createClass({
  displayName: 'DatePicker',
  mixins: [ControlledValue],

  getInitialState() {

    let defaultDate
    if (this._getValue()) {
      defaultDate = moment(this._getValue(), 'YYYY-MM-DD').toDate()
    } else {
      defaultDate = new Date()
    }

    return {
      // The value of the input field
      textFieldValue: moment(defaultDate).format('L'),
      // The month to display in the calendar
      month: defaultDate
    }
  },

  handleInputChange(e) {
    const textFieldValue = e.target.value
    let {month} = this.state

    if (moment(textFieldValue, 'L', true).isValid()) {
      month = moment(textFieldValue, 'L').toDate()
      this._setValue(moment(textFieldValue, 'L').format('YYYY-MM-DD'))
    }

    this.setState({
      textFieldValue: textFieldValue,
      month: month
    }, this.showCurrentDate)
  },

  handleDayClick(e, day, modifiers) {

    const formattedDate = moment(day).format('L')
    this._setValue(moment(day).format('YYYY-MM-DD'))
    this.setState({
      textFieldValue: formattedDate,
      month: day
    })

  },

  showCurrentDate() {
    this.refs.daypicker.showMonth(this.state.month)
  },

  isSameDay(d1, d2) {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
  },

  render() {

    const {textFieldValue, month} = this.state
    const selectedDay = moment(this._getValue(), 'YYYY-MM-DD').toDate()

    const modifiers = {
      firstOfMonth: (day) => day.getDate() === 1,
      selected: (day) => this.isSameDay(selectedDay, day)
    }

    return (
      <div>
        <p>
          <input
            className='form-control'
            ref='input'
            type='text'
            value={ textFieldValue }
            placeholder={moment.localeData().longDateFormat('L')}
            onChange={ this.handleInputChange }
            onFocus={ this.showCurrentDate } />
        </p>
          <DayPicker
            ref='daypicker'
            enableOutsideDays={true}
            initialMonth={ month }
            numberOfMonths={ 1 }
            locale={config.locale}
            localeUtils={ LocaleUtils }
            modifiers={ modifiers }
            onDayClick={ this.handleDayClick } />
      </div>
    )
  }
})
