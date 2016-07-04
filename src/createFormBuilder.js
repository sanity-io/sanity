import React, {PropTypes} from 'react'
import {FormBuilder} from './FormBuilder'
import {createFormBuilderState, createFieldValue} from './state/FormBuilderState'
import defaultConfig from './defaultConfig'
import Schema from './Schema'

function withDefaultFallback(fn, defaultFn) {
  if (!fn) {
    return defaultFn
  }
  return (...args) => {
    const result = fn(...args)
    return result === undefined ? defaultFn(...args) : result
  }
}

export default function createFormBuilder(config = {}) {
  const {schema} = config
  const resolveInputComponent = withDefaultFallback(config.resolveInputComponent, defaultConfig.resolveInputComponent)
  const resolveFieldComponent = withDefaultFallback(config.resolveFieldComponent, defaultConfig.resolveFieldComponent)
  const resolveValidationComponent = withDefaultFallback(config.resolveValidationComponent, defaultConfig.resolveValidationComponent)
  const resolvePreviewComponent = withDefaultFallback(config.resolvePreviewComponent, defaultConfig.resolvePreviewComponent)

  if (!schema) {
    throw new TypeError('You must provide a schema')
  }

  function _createFieldValue(value, field) {
    return createFieldValue(value, {
      field: field,
      schema: schema,
      resolveInputComponent: resolveInputComponent
    })
  }

  function createValue(value, typeName) {
    return createFormBuilderState(value, {
      type: schema.getType(typeName), // todo: support primitives!
      schema: schema,
      resolveInputComponent: resolveInputComponent
    })
  }

  function deserialize(value) {
    return createValue(value, value.$type)
  }

  function createEmpty(typeName) {
    if (!typeName) {
      throw new TypeError('You must pass a type name as first parameter')
    }
    return createValue(undefined, typeName)
  }

  return class FormBuilderContextProvider extends React.Component {
    static createEmpty = createEmpty;
    static deserialize = deserialize;
    static propTypes = {
      value: PropTypes.any, // todo: fix
      onChange: PropTypes.func
    };

    static childContextTypes = {
      formBuilder: PropTypes.shape({
        schema: PropTypes.instanceOf(Schema),
        createFieldValue: PropTypes.func,
        resolveInputComponent: PropTypes.func,
        resolveFieldComponent: PropTypes.func,
        resolveValidationComponent: PropTypes.func
      })
    };

    getChildContext() {
      return {
        formBuilder: {
          schema: config.schema,
          createFieldValue: _createFieldValue,
          resolveInputComponent: resolveInputComponent,
          resolveFieldComponent: resolveFieldComponent,
          resolveValidationComponent: resolveValidationComponent,
          resolvePreviewComponent: resolvePreviewComponent
        }
      }
    }

    render() {
      const {value, onChange} = this.props
      return (
        <FormBuilder value={value} onChange={onChange} />
      )
    }
  }
}
