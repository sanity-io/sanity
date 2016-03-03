import React, {PropTypes} from 'react'
import inspect from 'object-inspect'
//import inspect from 'object-inspect'
import update from 'react-addons-update'
//import cx from 'classnames'
import {omit, assign} from 'lodash'
import FormBuilderPropTypes from './FormBuilderPropTypes'
//import Field from './Field'

const FormBuilder = React.createClass({
  propTypes: {
    typeName: PropTypes.string,
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    resolveFieldRenderer: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  },

  findTypeInSchema(typeName) {
    return this.context.schema[typeName]
  },

  handleFieldChange(newVal, propName) {
    this.props.onChange(update(this.props.value || {}, {
      [propName]: {$set: newVal}
    }))
  },

  render() {
    const {value = {}, typeName} = this.props

    const type = this.findTypeInSchema(typeName)

    const properties = type.properties
    return (
      <div>
        {Object.keys(properties).map(propName => {
          const prop = properties[propName]

          const wrap = el => (
            <fieldset key={propName}>
              <h1>{prop.title} ({propName})</h1>
              {el}
            </fieldset>
          )
          const fieldVal = value[propName]
          const handleChange = newVal => this.handleFieldChange(newVal, propName)

          const FieldBuilder = this.context.resolveFieldInput(prop)
          const schemaType = this.findTypeInSchema(prop.type)

          if (schemaType && !FieldBuilder) {
            return wrap(<FormBuilder typeName={prop.type} value={fieldVal} onChange={handleChange} />)
          }

          return wrap(
            <FieldBuilder
              value={fieldVal}
              type={prop}
              onChange={handleChange}
            />
          )
        })}
      </div>
    )
  }
})

export default FormBuilder
