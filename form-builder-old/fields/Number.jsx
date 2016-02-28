import React from 'react'
import FormBuilderField from '../FormBuilderFieldMixin'
import FieldErrors from '../FieldErrors'
import _t from '../../../lib/translate'._t

export default React.createClass({

  displayName: 'Number',

  mixins: [FormBuilderField],

  propTypes: {
    className: React.PropTypes.string,
    errors: React.PropTypes.array,
    fieldBuilders: React.PropTypes.object,
    schema: React.PropTypes.object
  },

  getInitialState() {
    return {
      errors: []
    }
  },

  handleChange(e) {
    const val = Number(e.target.value)
    const errors = []
    this.setState({errors: []})
    if (e.target.value === '' && !e.target.validity.badInput) {
      this._setValue(null)
    } else if (val.toString() === e.target.value) {
      this._setValue(val)
    } else {
      errors.push(
        {
          field: this.props.field.name,
          type: 'error',
          message: _t('formBuilder.errors.fieldIsNotANumber', null, {fieldName: this.props.field.title})
        }
      )
      this.setState({errors: errors})
    }
  },

  focus() {
    this.refs.input.focus()
  },

  render() {

    const placeholder = this.props.field.placeholder

    return (
      <div className="form-builder__field form-builder__number form-builder__number--default">

        <label className="form-builder__label">
          {this.props.field.title}
        </label>

        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }

        <div className='form-builder__item'>
          <input {...this.props}
            type='number'
            ref='input'
            placeholder={placeholder}
            className={this.props.className.concat(' form-control')}
            defaultValue={this.props.defaultValue}
            onChange={this.handleChange}/>
        </div>

        <FieldErrors errors={this.props.errors}/>
        <FieldErrors errors={this.state.errors}/>

      </div>
    )
  }
})
