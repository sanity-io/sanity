import {arrayToJSONMatchPath} from '@sanity/mutator'
import {flatten} from 'lodash'
import {SANITY_PATCH_TYPE} from '../patch'
import type {FormPatchOrigin, FormPatch} from '../patch/types'
import {decodePath} from './path'

/**
 * @internal
 */
export type MutationPatch = Record<string, any> // @todo: complete this typing

/**
 * @internal
 */
export function toMutationPatches(patches: FormPatch[]): MutationPatch[] {
  return patches.map(toMutationPatch)
}

/**
 * @internal
 */
export function fromMutationPatches(
  origin: FormPatchOrigin,
  patches: MutationPatch[],
): FormPatch[] {
  return flatten(patches.map((patch) => toFormBuilderPatches(origin, patch)))
}

const notIn = (values: unknown[]) => (value: unknown) => !values.includes(value)

function toFormBuilderPatches(origin: FormPatchOrigin, patch: MutationPatch): FormPatch[] {
  return flatten(
    Object.keys(patch)
      .filter(notIn(['id', 'ifRevisionID', 'query']))
      .map((type) => {
        if (type === 'unset') {
          return patch.unset.map((path: any) => {
            return {
              type: 'unset',
              path: decodePath(path),
              origin,
            }
          })
        }
        if (type === 'insert') {
          const position = 'before' in patch.insert ? 'before' : 'after'
          return {
            type: 'insert',
            position: position,
            path: decodePath(patch.insert[position]),
            items: patch.insert.items,
            origin,
          }
        }
        return Object.keys(patch[type])
          .map((gradientPath) => {
            if (type === 'set') {
              return {
                type: 'set',
                path: decodePath(gradientPath),
                value: patch[type][gradientPath],
                origin,
              }
            }
            if (type === 'inc' || type === 'dec') {
              return {
                type: type,
                path: decodePath(gradientPath),
                value: patch[type][gradientPath],
                origin,
              }
            }
            if (type === 'setIfMissing') {
              return {
                type: 'setIfMissing',
                path: decodePath(gradientPath),
                value: patch[type][gradientPath],
                origin,
              }
            }
            if (type === 'diffMatchPatch') {
              return {
                type,
                path: decodePath(gradientPath),
                value: patch[type][gradientPath],
                origin,
              }
            }
            // eslint-disable-next-line no-console
            console.warn(new Error(`Unsupported patch type: ${type}`))
            return null
          })
          .filter(Boolean)
      }),
  )
}

function toMutationPatch(patch: FormPatch): MutationPatch {
  if (patch.patchType !== SANITY_PATCH_TYPE && patch.type) {
    throw new Error(
      `Patch is missing "patchType" - import and use "${patch.type}()" from "sanity/form"`,
    )
  } else if (patch.patchType !== SANITY_PATCH_TYPE) {
    throw new Error(
      `Patch is missing "patchType" - import and use the patch method helpers from "sanity/form"`,
    )
  }

  const matchPath = arrayToJSONMatchPath(patch.path || [])
  if (patch.type === 'insert') {
    const {position, items} = patch
    return {
      insert: {
        [position]: matchPath,
        items: items,
      },
    }
  }

  if (patch.type === 'unset') {
    return {
      unset: [matchPath],
    }
  }

  if (!patch.type) {
    throw new Error(`Missing patch type in patch ${JSON.stringify(patch)}`)
  }
  if (matchPath) {
    return {
      [patch.type]: {
        [matchPath]: patch.value,
      },
    }
  }
  return {
    [patch.type]: patch.value,
  }
}
