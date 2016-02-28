import React from 'react'
import FormBuilderField from '../../FormBuilderFieldMixin'
import _t from '../../../../lib/translate'._t
import FieldErrors from '../../FieldErrors'

export default React.createClass({

  displayName: 'RadioStyleString',

  mixins: [FormBuilderField],

  getInitialState() {
    return {tainted: false}
  },

  handleChange(e) {
    this._setValue(e.target.value || null)
    this.setState({tainted: true})
  },

  componentDidMount() {
    if (this.props.field.required && !this._getValue() && !this.props.field.defaultValue) {
      this._setValue(this.props.field.of[0].value)
    }
    if (!this.props.field.required && !this._getValue() && this.props.field.defaultValue) {
      this._setValue(this.props.field.defaultValue)
    }
  },

  render() {

    const of = Object.create(this.props.field.of || [])

    const value = this._getValue() || ''

    if (!this.props.field.required) {
      of.unshift({text: _t('formBuilder.fields.string.radioNullValue'), value: ''})
    }

    return (
      <div className="form-builder__field form-builder__string form-builder__string--radio">
        <fieldset>
          <legend>{this.props.field.title}</legend>

          {
            this.props.field.description &&
              <div className='form-builder__help-text'>{this.props.field.description}</div>
          }

          {
            of.map((item, i) => {
              const checked = (value === item.value)
              return (
                <div className='form-builder__item' key={'radio-' + i}>
                  <label>
                    <input
                      type="radio"
                      name={this.props.name}
                      checked={checked}
                      onChange={this.handleChange}
                      value={item.value}/>
                    {item.text}
                  </label>
                </div>
              )
            })
          }
          <FieldErrors errors={this.props.errors}/>
        </fieldset>
      </div>
    )
  }
})
