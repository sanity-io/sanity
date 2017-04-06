// @flow
import React, {PropTypes} from 'react'
import type {Patch} from '../utils/patches'
import shallowEquals from 'shallow-equals'
import {get, find} from 'lodash'

declare var __DEV__: boolean

function isSegmentEqual(segment1, segment2) {
  const segment1Type = typeof segment1
  if (segment1Type !== typeof segment2) {
    return false
  }
  if (segment1Type === 'object') {
    return shallowEquals(segment1, segment2)
  }
  return segment1 === segment2
}

function startsWith(subjectPath, checkPath) {
  if (subjectPath === checkPath) {
    return true
  }
  if (!Array.isArray(subjectPath) || !Array.isArray(checkPath)) {
    return false
  }
  if (subjectPath.length < checkPath.length) {
    return false
  }
  for (let i = 0, len = checkPath.length; i < len; i++) {
    if (!isSegmentEqual(checkPath[i], subjectPath[i])) {
      return false
    }
  }
  return true
}

function isAncestor(path1, path2) {
  return path1.length === 0 || (startsWith(path2, path1) && !startsWith(path1, path2))
}

function shouldReset(path, patches) {
  return patches.some(patch => isAncestor(patch.path, path) && (patch.type === 'set' || patch.type === 'unset'))
}

function getValueAtPath(value, path) {
  return path.reduce((result, segment) => {
    if (typeof segment === 'object') {
      return find(result, segment)
    }
    return get(result, segment)
  }, value)
}

type SubscriberArg = {
  patches: Array<Patch>,
  shouldReset: boolean,
  snapshot: any
}

type Subscriber = (SubscriberArg) => void

export default function SubscribePatchHOC(ComposedComponent: any) {
  return class SubscribePatch extends React.Component {
    static displayName = `SubscribePatchHOC(${ComposedComponent.displayName || ComposedComponent.name})`

    static contextTypes = {
      getValuePath: PropTypes.func,
      formBuilder: PropTypes.any,
    }

    subscribe = (subscriber: Subscriber) => {
      return this.context.formBuilder.onPatch(({snapshot, patches}) => {

        const selfPath = this.context.getValuePath()
        const filtered = patches
          .filter(patch => startsWith(patch.path, selfPath))
          .map(patch => ({...patch, path: patch.path.slice(selfPath.length)}))

        subscriber({
          shouldReset: shouldReset(selfPath, patches),
          snapshot: getValueAtPath(snapshot, selfPath),
          patches: filtered
        })
      })
    }

    render() {
      return <ComposedComponent {...this.props} subscribe={this.subscribe} />
    }
  }
}
