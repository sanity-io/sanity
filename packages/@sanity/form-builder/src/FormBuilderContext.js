import PropTypes from 'prop-types'
import React from 'react'
import {fallbackInputs} from './fallbackInputs'

import Schema from '@sanity/schema'
import pubsub from 'nano-pubsub'

const NOOP = () => {}

function resolve(type, providedResolve = NOOP) {
  let itType = type
  while (itType) {
    const resolved = providedResolve(itType)
    if (resolved) {
      return resolved
    }
    itType = itType.type
  }
  return undefined
}

export default class FormBuilderContext extends React.Component {
  static createPatchChannel = () => {
    const channel = pubsub()
    return {onPatch: channel.subscribe, receivePatches: channel.publish}
  }
  static propTypes = {
    schema: PropTypes.instanceOf(Schema).isRequired,
    value: PropTypes.any,
    children: PropTypes.any.isRequired,
    patchChannel: PropTypes.shape({
      onPatch: PropTypes.func
    }).isRequired,
    resolveInputComponent: PropTypes.func.isRequired,
    resolvePreviewComponent: PropTypes.func.isRequired
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
    return resolve(type, resolveInputComponent) || fallbackInputs[type.jsonType]
  }

  resolvePreviewComponent = type => {
    const {resolvePreviewComponent} = this.props

    return resolve(type, resolvePreviewComponent)
  }

  _getMemoizedChildContext() {
    if (!this._childContext) {
      const {schema, patchChannel} = this.props
      this._childContext = {
        getValuePath: () => ([]),
        formBuilder: {
          onPatch: patchChannel ? patchChannel.onPatch : () => {
            // eslint-disable-next-line no-console
            console.warn('No patch channel provided to form-builder. If you need input based patch updates, please provide one')
            return NOOP
          },
          schema,
          resolveInputComponent: this.resolveInputComponent,
          resolvePreviewComponent: this.resolvePreviewComponent,
          getDocument: this.getDocument
        }
      }
    }
    return this._childContext
  }

  getChildContext() {
    return this._getMemoizedChildContext()
  }

  render() {
    return this.props.children
  }
}
