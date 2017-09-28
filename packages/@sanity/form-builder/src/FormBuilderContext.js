import PropTypes from 'prop-types'
import React from 'react'
import * as defaultConfig from './defaultConfig'
import Schema from '@sanity/schema'
import pubsub from 'nano-pubsub'

const NOOP = () => {}

function resolve(type, providedResolve = NOOP, defaultResolve = NOOP) {
  let itType = type
  while (itType) {
    const resolved = providedResolve(itType) || defaultResolve(itType)
    if (resolved) {
      return resolved
    }
    itType = itType.type
  }
  return undefined
}

function createPatchChannel() {
  const channel = pubsub()
  return {onPatch: channel.subscribe, receivePatches: channel.publish}
}

export default class FormBuilderContext extends React.Component {
  static createPatchChannel = createPatchChannel;
  static propTypes = {
    schema: PropTypes.instanceOf(Schema).isRequired,
    value: PropTypes.any,
    children: PropTypes.any,
    patchChannel: PropTypes.shape({
      onPatch: PropTypes.func
    }),
    resolveInputComponent: PropTypes.func,
    resolvePreviewComponent: PropTypes.func
  }

  static childContextTypes = {
    getValuePath: PropTypes.func,
    onPatch: PropTypes.func,
    formBuilder: PropTypes.shape({
      schema: PropTypes.instanceOf(Schema),
      resolveInputComponent: PropTypes.func,
      document: PropTypes.any
    })
  }

  getDocument = () => {
    return this.props.value
  }

  resolveInputComponent = type => {
    const {resolveInputComponent} = this.props
    return resolve(type, resolveInputComponent, defaultConfig.resolveInputComponent)
      || defaultConfig.jsonTypeFallbacks[type.jsonType]
  }

  resolvePreviewComponent = type => {
    const {resolvePreviewComponent} = this.props

    return resolve(type, resolvePreviewComponent, defaultConfig.resolvePreviewComponent)
  }

  getChildContext() {
    const {schema, patchChannel} = this.props
    return {
      getValuePath: () => ([]),
      formBuilder: {
        onPatch: patchChannel ? patchChannel.onPatch : () => {
          // eslint-disable-next-line no-console
          console.log('No patch channel provided to form-builder. If you need input based patch updates, please provide one')
        },
        schema: schema,
        resolveInputComponent: this.resolveInputComponent,
        resolvePreviewComponent: this.resolvePreviewComponent,
        getDocument: this.getDocument
      }
    }
  }

  render() {
    return this.props.children
  }
}
