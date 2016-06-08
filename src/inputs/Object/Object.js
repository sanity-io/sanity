import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import RenderField from './RenderField'
import ObjectContainer from '../../state/ObjectContainer'
import Fieldset from '../../Fieldset'

export default React.createClass({
  propTypes: {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    onChange: PropTypes.func
  },

  statics: {
    valueContainer: ObjectContainer
  },

  contextTypes: {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  },

  getDefaultProps() {
    return {
      onChange() {}
    }
  },

  handleFieldChange(event, fieldName) {
    const {onChange} = this.props
    const patch = {[fieldName]: event.patch}
    onChange({patch})
  },

  renderField(field) {
    const {value} = this.props
    const fieldValue = value && value.getFieldValue(field.name)
    return (
      <RenderField
        key={field.name}
        fieldName={field.name}
        field={field}
        value={fieldValue}
        onChange={this.handleFieldChange}
      />
    )

  },
  renderFieldset(fieldset) {
    return (
      <Fieldset legend={fieldset.title}>
        {fieldset.fields.map(this.renderField)}
      </Fieldset>
    )
  },

  renderFieldsets(fieldsets) {
    return fieldsets.map(fieldset => {
      return fieldset.lonely ? this.renderField(fieldset.field) : this.renderFieldset(fieldset)
    })
  },

  render() {
    const {type, field} = this.props
    return (
      <div>
        {this.renderFieldsets(type.fieldsets)}
      </div>
    )
  }
})
