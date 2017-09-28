import PropTypes from 'prop-types'
import React from 'react'
import {FormBuilderInput} from './FormBuilderInput'
import Schema from '@sanity/schema'
import pubsub from 'nano-pubsub'
import FormBuilderContext from './FormBuilderContext'

function createPatchChannel() {
  const channel = pubsub()
  return {onPatch: channel.subscribe, receivePatches: channel.publish}
}

export default class FormBuilder extends React.Component {
  static createPatchChannel = createPatchChannel;
  static propTypes = {
    value: PropTypes.any,
    schema: PropTypes.instanceOf(Schema).isRequired,
    type: PropTypes.object,
    onChange: PropTypes.func,
    patchChannel: PropTypes.shape({
      onPatch: PropTypes.func
    }),
    resolveInputComponent: PropTypes.func,
    resolvePreviewComponent: PropTypes.func
  }

  render() {
    const {
      schema,
      value,
      type,
      onChange,
      resolveInputComponent,
      resolvePreviewComponent,
      patchChannel
    } = this.props

    if (!schema) {
      throw new TypeError('You must provide a schema to <FormBuilder (...)')
    }

    return (
      <FormBuilderContext
        schema={schema}
        value={value}
        resolveInputComponent={resolveInputComponent}
        resolvePreviewComponent={resolvePreviewComponent}
        patchChannel={patchChannel}
      >
        <FormBuilderInput
          value={value}
          type={type}
          onChange={onChange}
          level={0}
          isRoot
          autoFocus
        />
      </FormBuilderContext>
    )
  }
}
