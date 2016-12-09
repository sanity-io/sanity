import React, {PropTypes} from 'react'
import {FormBuilderInner} from './FormBuilderInner'
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
  const resolvePreviewComponent = withDefaultFallback(config.resolvePreviewComponent, defaultConfig.resolvePreviewComponent)

  if (!schema) {
    throw new TypeError('You must provide a schema to createFormBuilder(...)')
  }

  function _createFieldValue(value, field) {
    return createFieldValue(value, {
      field: field,
      schema: schema,
      resolveInputComponent: resolveInputComponent,
      resolvePreviewComponent: resolvePreviewComponent
    })
  }

  function createValue(value, typeName) {
    if (value && value._type !== typeName) {
      throw new Error(`Type mismatch: Trying to edit data of type ${value._type} as ${typeName}`)
    }

    return createFormBuilderState(value, {
      type: schema.getType(typeName), // todo: support primitives!
      schema: schema,
      resolveInputComponent: resolveInputComponent,
      resolvePreviewComponent: resolvePreviewComponent
    })
  }

  function deserialize(value, asType) {
    return createValue(value, asType)
  }

  function createEmpty(typeName) {
    if (!typeName) {
      throw new TypeError('You must pass a type name as first parameter')
    }
    return createValue(undefined, typeName)
  }

  return class FormBuilder extends React.Component {
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
        resolveInputComponent: PropTypes.func
      })
    };

    getChildContext() {
      return {
        formBuilder: {
          schema: config.schema,
          createFieldValue: _createFieldValue,
          resolveInputComponent: resolveInputComponent,
          resolvePreviewComponent: resolvePreviewComponent
        }
      }
    }

    render() {
      const {value, onChange} = this.props
      return (
        <FormBuilderInner value={value} onChange={onChange} />
      )
    }
  }
}
