import PropTypes from 'prop-types'
import React from 'react'
import pubsub from 'nano-pubsub'
import {Schema, SchemaType} from '@sanity/types'
import type {Patch} from './patch/types'
import {fallbackInputs} from './fallbackInputs'

const RESOLVE_NULL = (arg: any) => null

function resolve(type, providedResolve = RESOLVE_NULL) {
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

// Memoize return values from a method that takes a single arg
// memoized as a map of argument => return value
function memoizeMap(method) {
  const map = new WeakMap()
  return function memoizedMap(arg) {
    if (map.has(arg)) {
      return map.get(arg)
    }
    const val = method.call(this, arg)
    if (arg) {
      map.set(arg, val)
    }
    return val
  }
}

// Memoize return value from method that takes no args
function memoize(method) {
  let called = false
  let val
  return function memoized() {
    if (called) {
      return val
    }
    val = method.call(this)
    called = true
    return val
  }
}

interface Props {
  schema: Schema
  value: unknown
  children: any
  filterField?: any
  patchChannel: {
    onPatch?: (patch: any) => void
  }
  resolveInputComponent: (type: SchemaType) => React.ComponentType
  resolvePreviewComponent: (type: SchemaType) => React.ComponentType
}

export default class FormBuilderContext extends React.Component<Props> {
  static createPatchChannel = () => {
    const channel = pubsub<{snapshot: any; patches: Patch[]}>()
    return {onPatch: channel.subscribe, receivePatches: channel.publish}
  }

  static childContextTypes = {
    getValuePath: PropTypes.func,
    onPatch: PropTypes.func,
    filterField: PropTypes.func,
    formBuilder: PropTypes.shape({
      schema: PropTypes.object,
      resolveInputComponent: PropTypes.func,
      document: PropTypes.any,
    }),
  }

  getDocument = () => {
    return this.props.value
  }

  resolveInputComponent = memoizeMap((type) => {
    const {resolveInputComponent} = this.props
    return resolve(type, resolveInputComponent) || fallbackInputs[type.jsonType]
  })

  resolvePreviewComponent = memoizeMap((type) => {
    const {resolvePreviewComponent} = this.props
    return resolve(type, resolvePreviewComponent)
  })

  getChildContext = memoize(() => {
    const {schema, filterField, patchChannel} = this.props
    return {
      filterField: filterField,
      getValuePath: () => [],
      formBuilder: {
        onPatch: patchChannel
          ? patchChannel.onPatch
          : () => {
              // eslint-disable-next-line no-console
              console.warn(
                'No patch channel provided to form-builder. If you need input based patch updates, please provide one'
              )
              return () => {}
            },
        schema,
        resolveInputComponent: this.resolveInputComponent,
        resolvePreviewComponent: this.resolvePreviewComponent,
        getDocument: this.getDocument,
      },
    }
  })

  render() {
    return this.props.children
  }
}
