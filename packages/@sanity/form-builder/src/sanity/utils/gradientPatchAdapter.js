// @flow
import {arrayToJSONMatchPath} from '@sanity/mutator'
import assert from 'assert'
import {flatten} from 'lodash'
import type {Origin, Patch} from '../../typedefs/patch'
import * as convertPath from './convertPath'

type GradientPatch = Object

export function toGradient(patches: Patch[]): GradientPatch[] {
  return patches.map(toGradientPatch)
}

export function toFormBuilder(origin: Origin, patches: GradientPatch[]): Patch[] {
  return flatten(patches.map(patch => toFormBuilderPatch(origin, patch)))
}

function toFormBuilderPatch(origin: Origin, patch: GradientPatch): Patch {
  return flatten(
    Object.keys(patch)
      .filter(key => key !== 'id')
      .map(type => {
        if (type === 'unset') {
          return patch.unset.map(path => {
            return {
              type: 'unset',
              path: convertPath.toFormBuilder(path),
              origin
            }
          })
        }
        return Object.keys(patch[type])
          .map(gradientPath => {
            if (type === 'insert') {
              const position = 'before' in patch.insert ? 'before' : 'after'
              return {
                type: 'insert',
                position: position,
                path: convertPath.toFormBuilder(patch.insert[position]),
                items: patch.insert.items,
                origin
              }
            }
            if (type === 'set') {
              return {
                type: 'set',
                path: convertPath.toFormBuilder(gradientPath),
                value: patch[type][gradientPath],
                origin
              }
            }
            if (type === 'inc' || type === 'dec') {
              return {
                type: type,
                path: convertPath.toFormBuilder(gradientPath),
                value: patch[type][gradientPath],
                origin
              }
            }
            if (type === 'setIfMissing') {
              return {
                type: 'setIfMissing',
                path: convertPath.toFormBuilder(gradientPath),
                value: patch[type][gradientPath],
                origin
              }
            }
            if (type === 'diffMatchPatch') {
              return {
                type: 'diffMatchPatch',
                path: convertPath.toFormBuilder(gradientPath),
                value: patch[type][gradientPath],
                origin
              }
            }
            if (type === 'ifRevisionID') {
              return {
                type: 'ifRevisionID',
                value: patch[type],
                origin
              }
            }
            console.warn(new Error(`Unsupported patch type: ${type}`))
            return null
          })
          .filter(Boolean)
      })
  )
}

function toGradientPatch(patch: Patch): GradientPatch {
  const matchPath = arrayToJSONMatchPath(patch.path || [])
  if (patch.type === 'insert') {
    const {position, items} = patch
    return {
      insert: {
        [position]: matchPath,
        items: items
      }
    }
  }

  if (patch.type === 'unset') {
    return {
      unset: [matchPath]
    }
  }

  assert(patch.type, `Missing patch type in patch ${JSON.stringify(patch)}`)
  if (matchPath) {
    return {
      [patch.type]: {
        [matchPath]: patch.value
      }
    }
  }
  return {
    [patch.type]: patch.value
  }
}
