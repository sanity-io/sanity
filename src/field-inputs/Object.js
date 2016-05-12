import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import RenderField from '../RenderField'
import update from 'react-addons-update'

export default React.createClass({
  propTypes: {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    onChange: PropTypes.func
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

  handleFieldChange(newVal, fieldName) {
    const {field} = this.props
    this.props.onChange(update(this.props.value || {}, {
      $type: {$set: field.type},
      [fieldName]: {$set: newVal}
    }))
  },

  render() {
    const {type} = this.props
    return (
      <div>
        {Object.keys(type.fields).map(fieldName => {
          const {value = {}} = this.props
          const fieldValue = value[fieldName]
          return (
            <RenderField
              key={fieldName}
              fieldName={fieldName}
              field={type.fields[fieldName]}
              fieldType={type.fields[fieldName]}
              value={fieldValue}
              onChange={this.handleFieldChange}
            />
          )
        })}
      </div>
    )
  }
})
