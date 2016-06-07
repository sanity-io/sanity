import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import RenderField from '../RenderField'
import ObjectContainer from '../state/ObjectContainer'

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
    resolveFieldInput: PropTypes.func,
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
  renderGroup(group) {
    return (
      <fieldset>
        <legend>{group.title}</legend>
        {group.fields.map(this.renderField)}
      </fieldset>
    )
  },

  renderGroups(groups) {
    return groups.map(group => {
      return group.ungrouped ? this.renderField(group.field) : this.renderGroup(group)
    })
  },

  render() {
    const {type} = this.props
    return (
      <div>
        {this.renderGroups(type.fieldGroups)}
      </div>
    )
  }
})
