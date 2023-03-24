import {Path, SanityDocumentLike} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {isPlainObject} from 'lodash'
import {FormPatch, unset} from '../../patch'
import {applyAll} from '../../patch/applyPatch'

function isEmpty(obj: object) {
  for (const key in obj) {
    if (key !== '_type' && Object.hasOwn(obj, key)) {
      return false
    }
  }
  return true
}

function getUnsetEmpytPatches(documentValue: SanityDocumentLike, patches: FormPatch[], path: Path) {
  if (path.length === 0) {
    return []
  }
  const res = applyAll(
    documentValue,
    patches.filter((patch) => PathUtils.startsWith(patch.path, path))
  )
  const parentPath = path.slice(0, -1)
  const parentAfter = PathUtils.get(res, parentPath)
  if (Array.isArray(parentAfter)) {
    if (parentAfter.length === 0) {
      const parentPatches = getUnsetEmpytPatches(res as SanityDocumentLike, patches, parentPath)
      const parentHasUnset = parentPatches.some((p) => p.type === 'unset')
      return parentHasUnset ? parentPatches : [unset(parentPath)]
    }
  }
  if (isPlainObject(parentAfter)) {
    if (isEmpty(parentAfter as object)) {
      const parentPatches = getUnsetEmpytPatches(res as SanityDocumentLike, patches, parentPath)
      const parentHasUnset = parentPatches.some((p) => p.type === 'unset')
      return parentHasUnset ? parentPatches : [unset(parentPath)]
    }
  }
  return []
}

/**
 * @param documentValue
 * @param patches
 */
function withUnsetForEmptyNodes(documentValue: SanityDocumentLike, patches: FormPatch[]) {
  const unsetPatches = patches.filter((patch) => patch.type === 'unset')
  if (unsetPatches.length === 0) {
    return patches
  }
  // for each unset patch, apply all patches up to that point and check if the parent is now empty
  return unsetPatches.flatMap((patch) =>
    getUnsetEmpytPatches(documentValue, patches, patch.path.slice(0))
  )
}

test('unsetEmptyNodes for array of objects', () => {
  const result = withUnsetForEmptyNodes(
    {
      _id: 'unknown',
      _type: 'test',
      arr: [{_key: 'foo'}],
    },
    [unset(['arr', {_key: 'foo'}])]
  )
  expect(result).toMatchObject([
    {
      path: ['arr'],
      type: 'unset',
    },
  ])
})

test('unsetEmptyNodes for array of primitives', () => {
  const result = withUnsetForEmptyNodes(
    {
      _id: 'unknown',
      _type: 'test',
      arr: ['test'],
    },
    [unset(['arr', 0])]
  )
  expect(result).toMatchObject([
    {
      path: ['arr'],
      type: 'unset',
    },
  ])
})

test('unsetEmptyNodes for objects', () => {
  const result = withUnsetForEmptyNodes(
    {
      _id: 'unknown',
      _type: 'test',
      obj: {foo: 'bar'},
    },
    [unset(['obj', 'foo'])]
  )
  expect(result).toMatchObject([
    {
      path: ['obj'],
      type: 'unset',
    },
  ])
})

test('unsetEmptyNodes recursively unsets objects', () => {
  const result = withUnsetForEmptyNodes(
    {
      _id: 'unknown',
      _type: 'test',
      obj: {some: {nested: {value: 'here'}}},
    },
    [unset(['obj', 'some', 'nested', 'value'])]
  )
  expect(result).toMatchObject([
    {
      path: ['obj'],
      type: 'unset',
    },
  ])
})
