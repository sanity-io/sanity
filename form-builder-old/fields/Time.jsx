import React from 'react'
import TimePicker from '../../inputs/TimePicker'
import FormBuilderField from '../FormBuilderFieldMixin'

export default React.createClass({
  displayName: 'TimePicker',
  mixins: [FormBuilderField],

  handleTimeChanged(newValue) {
    this._setValue(newValue)
  },
  render() {
    const value = this._getValue()
    return (
      <div className="form-builder__time">
        <label className="form-builder__label">{this.props.field.title}</label>
        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }
        <div className='form-builder__item'>
          <TimePicker
            value={value}
            onChange={this.handleTimeChange}/>
        </div>
    </div>
    )
  }
})
