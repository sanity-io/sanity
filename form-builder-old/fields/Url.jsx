import React from 'react'
import FormBuilderField from '../FormBuilderFieldMixin'
import FieldErrors from '../FieldErrors'
import _t from '../../../lib/translate'._t

export default React.createClass({

  displayName: 'Url',

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
    const urls = e.target.value.split(',')
    const errors = []
    this.setState({errors: []})
    const validatedUrls = urls.map(url => {
      url = url.trim()
      if (!url.match(/\S/) || url.indexOf('.') > 0) { // eslint-disable-line no-empty
        // empty or something url-ish, all is good
        if (url && !url.match('://')) {
          url = 'http://' + url
        }
        if (url) {
          return url
        } else {
          return null
        }
      } else {
        errors.push(
          {
            field: this.props.field.name,
            type: 'error',
            message: _t('formBuilder.errors.fieldIsNotUrl', null, {fieldName: this.props.field.title, url: url})
          }
        )
      }
    }).filter(Boolean)
    if (!errors.length && validatedUrls.length) {
      this._setValue(validatedUrls.join(', '))
    }
    this.setState({errors: errors})
  },

  focus() {
    this.refs.input.focus()
  },

  render() {

    const {field, className = []} = this.props

    return (
      <div className="form-builder__field form-builder__field--url">

        <label className="form-builder__label">
          {field.title}
        </label>

        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }

        <div className='form-builder__item'>
          <input {...this.props}
            type='url'
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
