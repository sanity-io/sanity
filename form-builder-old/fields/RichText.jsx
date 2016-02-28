import React from 'react'
import FormBuilderField from '../FormBuilderFieldMixin'
import MediumEditor from '../../inputs/MediumEditor'
import FieldErrors from '../FieldErrors'

export default React.createClass({

  displayName: 'RichText',

  propTypes: {
    field: React.PropTypes.shape({
      placeholder: React.PropTypes.string,
      config: React.PropTypes.object
    })
  },

  mixins: [FormBuilderField],

  handleChange(value) {
    this.props.onChange(value)
  },

  render() {
    const {field, errors, onChange, className} = this.props
    const value = this._getValue()

    return (
      <div className="form-builder__field form-builder__rich-text">
        <label className="form-builder__label form-builder__label--default">
          {this.props.field.title}
        </label>
        {
          this.props.field.description &&
            <div className='form-builder__help-text'>{this.props.field.description}</div>
        }
        <div className='form-builder__item'>
          <MediumEditor
            placeholder={field.placeholder}
            config={field.editor}
            value={value}
            onChange={onChange}
            className={className}
            size={(field.config && field.config.size) || 'medium'}
          />
        </div>
        <FieldErrors errors={errors}/>
      </div>
    )
  }

})
