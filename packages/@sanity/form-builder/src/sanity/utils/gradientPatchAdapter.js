// @flow

import {arrayToJSONMatchPath} from '@sanity/mutator'
import assert from 'assert'
import {flatten} from 'lodash'
import type {Patch} from '../../utils/patches'
type GradientPatch = Object

type Adapter = {
  fromFormBuilder: (patches: Array<Patch>) => Array<GradientPatch>,
  toFormBuilder: (origin: string, patches: Array<GradientPatch>) => Array<Patch>
}

const adapter: Adapter = {
  fromFormBuilder(patches) {
    return patches.map(fromFormBuilder)
  },
  toFormBuilder
}

export default adapter


/**
 *
 * *** WARNING ***
 *
 * This function is *EXPERIMENTAL* and very likely to have bugs. It is not in real use yet, and needs
 * to be revised.
 */

function toFormBuilder(origin, patches: Array<GradientPatch>): Array<Patch> {
  return flatten(patches.map(patch => {
    return flatten(Object.keys(patch)
      .filter(key => key !== 'id')
      .map((type): Array<Patch> => {
        if (type === 'unset') {
          return patch.unset.map(path => {
            return {
              type: 'unset',
              path: path.split('.'),
              origin
            }
          })
        }
        return Object.keys(patch[type]).map(path => {
          if (type === 'insert') {
            const position = 'before' in patch.insert ? 'before' : 'after'
            return {
              type: 'insert',
              position: position,
              path: path.split('.'),
              items: patch[type][path],
              origin
            }
          }
          if (type === 'set') {
            return {
              type: 'set',
              path: path.split('.'),
              value: patch[type][path],
              origin
            }
          }
          return {
            type,
            path: path.split('.'),
            value: patch[type][path],
            origin
          }
        })
      }))
  }))
}

function fromFormBuilder(patch: Patch): GradientPatch {
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
