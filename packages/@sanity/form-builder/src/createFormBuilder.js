import PropTypes from 'prop-types'
import React from 'react'
import {FormBuilderInput} from './FormBuilderInput'
import defaultConfig from './defaultConfig'
import Schema from '@sanity/schema'
import pubsub from 'nano-pubsub'

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

  const patchChannel = pubsub()

  return class FormBuilder extends React.Component {
    static receivePatches = patchChannel.publish
    static propTypes = {
      value: PropTypes.any,
      type: PropTypes.object,
      children: PropTypes.any,
      onChange: PropTypes.func
    };

    static childContextTypes = {
      getValuePath: PropTypes.func,
      onPatch: PropTypes.func,
      formBuilder: PropTypes.shape({
        schema: PropTypes.instanceOf(Schema),
        resolveInputComponent: PropTypes.func,
        document: PropTypes.any
      })
    };

    getDocument = () => {
      return this.props.value
    }

    getChildContext() {
      return {
        getValuePath: () => ([]),
        formBuilder: {
          onPatch: patchChannel.subscribe,
          schema: config.schema,
          resolveInputComponent: resolveInputComponent,
          resolvePreviewComponent: resolvePreviewComponent,
          getDocument: this.getDocument
        }
      }
    }

    render() {
      const {value, type, onChange, children} = this.props
      return children || (
        <FormBuilderInput
          value={value}
          type={type}
          onChange={onChange}
          level={0}
          isRoot
        />
      )
    }
  }
}
