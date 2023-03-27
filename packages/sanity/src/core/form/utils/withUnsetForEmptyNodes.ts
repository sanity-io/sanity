import {isKeySegment, Path, PathSegment, SanityDocumentLike} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {groupBy} from 'lodash'
import {FormPatch, unset} from '../patch'
import {applyAll} from '../patch/applyPatch'

function isEmpty(obj: object) {
  for (const key in obj) {
    if (key !== '_type' && Object.hasOwn(obj, key)) {
      return false
    }
  }
  return true
}

function getPathSegmentKey(segment: PathSegment) {
  return isKeySegment(segment) ? `__key_${segment._key}` : segment
}

function _withUnsetForEmptyNodes(
  documentValue: SanityDocumentLike,
  patches: FormPatch[],
  currentPath: Path
): FormPatch[] {
  if (patches.every((patch) => PathUtils.isEqual(patch.path, currentPath))) {
    // we have reached a leaf
    return patches
  }
  const next = groupBy(patches, (patch) =>
    getPathSegmentKey(PathUtils.trimLeft(currentPath, patch.path)[0])
  )
  return Object.values(next).flatMap((nextPatches) => {
    const segment = PathUtils.trimLeft(currentPath, nextPatches[0].path)[0]
    const childPatches = _withUnsetForEmptyNodes(
      documentValue,
      nextPatches,
      currentPath.concat(segment)
    )
    const hasUnsetOnImmediateChild = childPatches.some(
      (patch) => patch.type === 'unset' && PathUtils.trimLeft(currentPath, patch.path).length === 1
    )
    if (hasUnsetOnImmediateChild) {
      const node = PathUtils.get(documentValue, currentPath)
      if (Array.isArray(node)) {
        const res = applyAll(
          node,
          childPatches.map((patch) => ({
            ...patch,
            path: PathUtils.trimLeft(currentPath, patch.path),
          }))
        )
        if (res.length === 0) {
          return [unset(currentPath)]
        }
      }
      if (typeof node === 'object' && node !== null) {
        const res = applyAll(
          node,
          childPatches.map((patch) => ({
            ...patch,
            path: PathUtils.trimLeft(currentPath, patch.path),
          }))
        )
        if (isEmpty(res)) {
          return [unset(currentPath)]
        }
      }
    }
    return childPatches
  })
}

/**
 * @param documentValue
 * @param patches
 */
export function withUnsetForEmptyNodes(documentValue: SanityDocumentLike, patches: FormPatch[]) {
  return _withUnsetForEmptyNodes(documentValue, patches, [])
}
