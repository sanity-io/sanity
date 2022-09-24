import {Path, PathSegment} from '@sanity/types'
import {get, find} from 'lodash'
import {useCallback} from 'react'
import shallowEquals from 'shallow-equals'
import {isRecord} from '../../../util'
import {FormPatch} from '../../patch'
import {useFormBuilder} from '../../useFormBuilder'

/**
 * @internal
 */
export interface PatchesData {
  patches: Array<FormPatch>
  shouldReset: boolean
  snapshot: any
}

/**
 * @internal
 */
export type PatchesSubscriber = (data: PatchesData) => void

/**
 * @internal
 */
export function usePatches(props: {path: Path}): {
  subscribe: (subscriber: PatchesSubscriber) => () => void
} {
  const {path} = props
  const {patchChannel} = useFormBuilder().__internal

  const subscribe = useCallback(
    (subscriber: PatchesSubscriber) => {
      return patchChannel.subscribe(({snapshot, patches}) => {
        const filteredPatches = patches
          .filter((patch) => _startsWith(patch.path, path))
          .map((patch) => ({
            ...patch,
            path: patch.path.slice(path.length),
          }))

        if (filteredPatches.length) {
          subscriber({
            shouldReset: _shouldReset(path, patches),
            snapshot: isRecord(snapshot) ? _getValueAtPath(snapshot, path) : {},
            patches: filteredPatches,
          })
        }
      })
    },
    [path, patchChannel]
  )

  return {subscribe}
}

function _isSegmentEqual(segment1: PathSegment, segment2: PathSegment) {
  const segment1Type = typeof segment1
  if (segment1Type !== typeof segment2) {
    return false
  }
  if (segment1Type === 'object') {
    return shallowEquals(segment1, segment2)
  }
  return segment1 === segment2
}

function _startsWith(subjectPath: Path, checkPath: Path) {
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
    if (!_isSegmentEqual(checkPath[i], subjectPath[i])) {
      return false
    }
  }
  return true
}

function _isAncestor(path1: Path, path2: Path) {
  return path1.length === 0 || (_startsWith(path2, path1) && !_startsWith(path1, path2))
}

function _shouldReset(path: Path, patches: FormPatch[]) {
  return patches.some(
    (patch) => _isAncestor(patch.path, path) && (patch.type === 'set' || patch.type === 'unset')
  )
}

function _getValueAtPath(value: Record<string, unknown>, path: Path) {
  return path.reduce((result, segment) => {
    if (typeof segment === 'object') {
      return find(result, segment)
    }

    return get(result, segment)
  }, value)
}
