import React from 'react'
import FormBuilderField from '../FormBuilderFieldMixin'
import FieldErrors from '../FieldErrors'
import _t from '../../../lib/translate'._t

export default React.createClass({

  displayName: 'Email',

  mixins: [FormBuilderField],

  propTypes: {
    field: React.PropTypes.object,
    className: React.PropTypes.string,
    errors: React.PropTypes.array,
    fieldBuilders: React.PropTypes.object,
    schema: React.PropTypes.object
  },

  getInitialState() {
    return {errors: []}
  },

  handleChange(e) {
    this._setValue(e.target.value)
  },

  handleBlur(e) {
    const email = e.target.value
    const errors = []
    this.setState({errors: []})
    if (!email.match(/\S/) || email.indexOf('@') > 0) { // eslint-disable-line no-empty
      // empty or something email-ish, all is good
    } else {
      errors.push(
        {
          field: this.props.field.name,
          type: 'error',
          message: _t('formBuilder.errors.fieldIsNotEmail', null, {fieldName: this.props.field.title})
        }
      )
      this.setState({errors: errors})
    }
  },

  focus() {
    this.refs.input.focus()
  },

  render() {

    const {field, className = []} = this.props

    return (
      <div className="form-builder__field form-builder__field--email">

        <label className="form-builder__label">
          {field.title}
        </label>

        {
          field.description &&
            <div className='form-builder__help-text'>{field.description}</div>
        }

        <div className='form-builder__item'>
          <input {...this.props}
            type='email'
            ref='input'
            placeholder={field.placeholder}
            className={className + ' form-control'}
            defaultValue={field.defaultValue}
            onChange={this.handleChange}
            onBlur={this.handleBlur}/>
        </div>

        <FieldErrors errors={this.props.errors}/>
        <FieldErrors errors={this.state.errors}/>

      </div>
    )
  }
})
