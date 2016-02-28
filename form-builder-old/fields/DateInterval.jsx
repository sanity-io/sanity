import React from 'react'
import DateIntervalPicker from '../../inputs/DateIntervalPicker'
import FormBuilderField from '../FormBuilderFieldMixin'

export default React.createClass({
  displayName: 'DateInterval',
  mixins: [FormBuilderField],

  handleTimeChanged(newValue) {
    this._setValue(newValue)
  },
  render() {
    const value = this._getValue()
    return (
      <div className="form-builder__event-time">
        <label className="form-builder__label">{this.props.field.title}</label>

        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }

        <div className='form-builder__item'>
          <DateIntervalPicker
            value={value}
            onChange={this.handleTimeChanged}/>
        </div>
    </div>
    )
  }
})
