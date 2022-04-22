/* eslint-disable max-nested-callbacks */

import {Path, PathSegment} from '@sanity/types'
import {get, find} from 'lodash'
import React, {forwardRef, useCallback} from 'react'
import shallowEquals from 'shallow-equals'
import {isRecord} from '../../util'
import {FormPatch} from '../patch'
import {useFormBuilder} from '../useFormBuilder'

function isSegmentEqual(segment1: PathSegment, segment2: PathSegment) {
  const segment1Type = typeof segment1
  if (segment1Type !== typeof segment2) {
    return false
  }
  if (segment1Type === 'object') {
    return shallowEquals(segment1, segment2)
  }
  return segment1 === segment2
}
function startsWith(subjectPath: Path, checkPath: Path) {
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
function isAncestor(path1: Path, path2: Path) {
  return path1.length === 0 || (startsWith(path2, path1) && !startsWith(path1, path2))
}
function shouldReset(path: Path, patches: FormPatch[]) {
  return patches.some(
    (patch) => isAncestor(patch.path, path) && (patch.type === 'set' || patch.type === 'unset')
  )
}
function getValueAtPath(value: Record<string, unknown>, path: Path) {
  return path.reduce((result, segment) => {
    if (typeof segment === 'object') {
      return find(result, segment)
    }
    return get(result, segment)
  }, value)
}
type SubscriberArg = {
  patches: Array<FormPatch>
  shouldReset: boolean
  snapshot: any
}

type Subscriber = (arg0: SubscriberArg) => void
export function withPatchSubscriber(ComposedComponent: any) {
  const SubscribePatch = forwardRef(function SubscribePatch(props: any, ref) {
    const {__internal_patchChannel: patchChannel, getValuePath} = useFormBuilder()

    const subscribe = useCallback(
      (subscriber: Subscriber) => {
        return patchChannel.subscribe(({snapshot, patches}) => {
          const selfPath = getValuePath()
          const filtered = patches
            .filter((patch) => startsWith(patch.path, selfPath))
            .map((patch) => ({
              ...patch,
              path: patch.path.slice(selfPath.length),
            }))

          subscriber({
            shouldReset: shouldReset(selfPath, patches),
            snapshot: isRecord(snapshot) ? getValueAtPath(snapshot, selfPath) : {},
            patches: filtered,
          })
        })
      },
      [getValuePath, patchChannel]
    )

    return <ComposedComponent ref={ref} {...props} subscribe={subscribe} />
  })

  SubscribePatch.displayName = `withPatches(${
    ComposedComponent.displayName || ComposedComponent.name
  })`

  return SubscribePatch
}
