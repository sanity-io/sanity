import React from 'react'
import FormBuilderField from '../../FormBuilderFieldMixin'
import FieldErrors from '../../FieldErrors'
import _t from '../../../../lib/translate'._t

export default React.createClass({

  displayName: 'SelectStyleString',

  mixins: [FormBuilderField],

  handleChange(e) {
    this._setValue(e.target.value)
  },

  render() {

    const of = this.props.field.choices || []

    let value = this._getValue() || ''

    if (!this._getValue() && this.props.field.defaultValue) {
      value = this.props.field.defaultValue
    }

    return (
      <div className="form-builder__field form-builder__string form-builder__string--select form-group">

        <label className="form-builder__label">{this.props.field.title}</label>
        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }
        <select value={value} onChange={this.handleChange} className="form-builder__item form-control">
          <option key='null' value=''>{_t('formBuilder.fields.string.pleaseSelect')}</option>

          {
            of.map((item) => {
              return <option key={item.value} value={item.value}>{item.text}</option>
            })
          }
        </select>


        <FieldErrors errors={this.props.errors}/>

      </div>
    )
  }
})
