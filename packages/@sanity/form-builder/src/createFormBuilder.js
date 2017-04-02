import React, {PropTypes} from 'react'
import {FormBuilderInput} from './FormBuilderInput'
import {createFormBuilderState, createMemberValue} from './state/FormBuilderState'
import defaultConfig from './defaultConfig'
import Schema from '@sanity/schema'

const NOOP = () => {}

export default function createFormBuilder(config = {}) {
  const {schema} = config

  if (!schema) {
    throw new TypeError('You must provide a schema to createFormBuilder(...)')
  }

  function resolve(type, providedResolve = NOOP, defaultResolve = NOOP) {
    let itType = type
    while (itType) {
      const resolved = providedResolve(itType) || defaultResolve(itType)
      if (resolved) {
        return resolved
      }
      itType = itType.type && schema.get(itType.type.name)
    }
    return undefined
  }

  const resolveInputComponent = type => {
    return resolve(type, config.resolveInputComponent, defaultConfig.resolveInputComponent)
  }

  const resolvePreviewComponent = type => {
    return resolve(type, config.resolvePreviewComponent, defaultConfig.resolvePreviewComponent)
  }

  function _createFieldValue(value, type) {
    return createMemberValue(value, {
      type,
      schema,
      resolveInputComponent,
      resolvePreviewComponent
    })
  }

  function createValue(value, typeName) {
    if (value && value._type !== typeName) {
      throw new Error(`Type mismatch: Trying to edit data of type ${value._type} as ${typeName}`)
    }

    return createFormBuilderState(value, {
      type: schema.get(typeName),
      schema: schema,
      resolveInputComponent: resolveInputComponent,
      resolvePreviewComponent: resolvePreviewComponent
    })
  }

  function createEmpty(typeName) {
    if (!typeName) {
      throw new TypeError('You must pass a type name as first parameter')
    }
    return createValue(undefined, typeName)
  }

  return class FormBuilder extends React.Component {
    static createEmpty = createEmpty;
    static deserialize = createValue;
    static propTypes = {
      value: PropTypes.any, // todo: fix
      children: PropTypes.any,
      onChange: PropTypes.func
    };

    static childContextTypes = {
      formBuilder: PropTypes.shape({
        schema: PropTypes.instanceOf(Schema),
        createFieldValue: PropTypes.func,
        resolveInputComponent: PropTypes.func,
        document: PropTypes.any
      })
    };

    getDocument = () => {
      return this.props.value
    }

    getChildContext() {
      return {
        formBuilder: {
          schema: config.schema,
          createFieldValue: _createFieldValue,
          resolveInputComponent: resolveInputComponent,
          resolvePreviewComponent: resolvePreviewComponent,
          getDocument: this.getDocument
        }
      }
    }

    render() {
      const {value, onChange, children} = this.props
      return children || (
        <FormBuilderInput
          value={value}
          type={value.context.type}
          onChange={onChange}
          level={0}
        />
      )
    }
  }
}
