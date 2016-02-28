import React from 'react'
import FormBuilderField from '../FormBuilderFieldMixin'
import FieldErrors from '../FieldErrors'

export default React.createClass({

  displayName: 'Text',

  mixins: [FormBuilderField],

  propTypes: {
    className: React.PropTypes.string,
    errors: React.PropTypes.array,
    fieldBuilders: React.PropTypes.object,
    schema: React.PropTypes.object,
    field: React.PropTypes.shape({
      placeholder: React.PropTypes.string
    })
  },

  handleChange(e) {
    this._setValue(e.target.value)
  },

  render() {
    const placeholder = this.props.field.placeholder
    return (
      <div className="form-builder__field form-builder__text">
        <label className="form-builder__label form-builder__label--default">
          {this.props.field.title}
        </label>
        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }
        <div className='form-builder__item'>
          <textarea
            {...this.props}
            placeholder={placeholder}
            className={this.props.className.concat(' form-control form-builder__textarea')}
            onChange={this.handleChange}/>
        </div>
        <FieldErrors errors={this.props.errors}/>
      </div>
    )
  }
})
