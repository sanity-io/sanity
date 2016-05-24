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

  render() {
    const {type, value} = this.props
    return (
      <div>
        {Object.keys(type.fields).map(fieldName => {
          const fieldValue = value && value.getFieldValue(fieldName)
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
