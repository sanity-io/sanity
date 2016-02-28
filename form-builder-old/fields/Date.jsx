import React from 'react'
import DatePicker from '../../inputs/DatePicker'
import FormBuilderField from '../FormBuilderFieldMixin'

export default React.createClass({
  displayName: 'Date',
  mixins: [FormBuilderField],

  handleDateChange(newValue) {
    this._setValue(newValue)
  },
  render() {
    const value = this._getValue()
    return (
      <div className="form-builder__date form-builder__field">
        <label className="form-builder__label">{this.props.field.title}</label>

        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }

        <div className='form-builder__item'>
          <DatePicker
            value={value}
            onChange={this.handleDateChange}/>
        </div>
    </div>
    )
  }
})
