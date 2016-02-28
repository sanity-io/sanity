import React from 'react'
import DateTime from '../../inputs/DateTimePicker'
import ControlledValue from '../../mixins/ControlledValue'

export default React.createClass({
  displayName: 'DateTime',
  mixins: [ControlledValue],
  propTypes: {
    value: React.PropTypes.oneOfType([
      React.PropTypes.string, // iso formatted date
      React.PropTypes.instanceOf(Date)
    ]),
    document: React.PropTypes.object.isRequired,
    validationResult: React.PropTypes.array,
    field: React.PropTypes.shape({
      title: React.PropTypes.string,
      label: React.PropTypes.string,
      required: React.PropTypes.bool,
      type: React.PropTypes.string
    }).isRequired,
    errors: React.PropTypes.array,
    fieldBuilders: React.PropTypes.object.isRequired,
    fieldPreviews: React.PropTypes.object.isRequired,
    schema: React.PropTypes.object
  },

  handleDateTimeChanged(newValue) {
    this._setValue(this.valueFromDateTimeWidget(newValue))
  },

  valueFromDateTimeWidget(newValue) {
    if (!newValue.date) {
      return null
    }

    const [hour, minute] = (newValue.time || '00:00').split(':')
    const [year, month, day] = (newValue.date).split('-')

    return new Date(year, month - 1, day, hour, minute)
  },

  valueForDateTimeWidget() {
    const value = this._getValue()
    if (!value) {
      return value
    }
    const date = typeof value === 'string' ? new Date(value) : value

    const dateStr = [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    ].join('-')

    const timeStr = [
      date.getHours(),
      date.getMinutes()
    ].join(':')

    return {
      date: dateStr,
      time: timeStr
    }
  },

  render() {
    const value = this.valueForDateTimeWidget()
    return (
      <div className="form-builder__event-time form-builder__field">
        <label className="form-builder__label">{this.props.field.title}</label>

        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }

        <div className='form-builder__item'>
          <DateTime
            value={value}
            onChange={this.handleDateTimeChanged}/>
        </div>
    </div>
    )
  }
})
