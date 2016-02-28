import React from 'react'
import FormBuilder from '../../../widgets/form-builder/FormBuilder'
import FieldErrors from '../../../widgets/form-builder/FieldErrors'
import FormBuilderField from '../FormBuilderFieldMixin'

export default React.createClass({

  displayName: 'CustomField',

  mixins: [FormBuilderField],

  propTypes: {
    attributes: React.PropTypes.array.isRequired,
    fieldBuilders: React.PropTypes.object.isRequired,
    docType: React.PropTypes.string
  },

  handleChange(newValue) {
    this._setValue(newValue)
  },

  render() {

    const {errors, field, schema, attributes, docType, fieldBuilders, fieldPreviews} = this.props
    return (
      <div className={'form-builder__custom form-builder__custom--' + field.type}>

        <fieldset className="form-builder__fieldset">

          <div className="form-builder__legend">
            {field.title}
          </div>

          { field.description && <div className='form-builder__help-text'>{field.description}</div> }

          <div className='form-builder__item'>
            <FormBuilder
              onChange={this.handleChange}
              onFieldChange={this.updateValue}
              schema={schema}
              fields={attributes}
              docType={docType}
              validation={errors && errors.length > 0 && errors[0].nested} // todo: needs a rethink
              fieldBuilders={fieldBuilders}
              fieldPreviews={fieldPreviews}
              value={this._getValue()}/>
          </div>
        </fieldset>

        <FieldErrors errors={errors}/>

      </div>
    )
  }
})
