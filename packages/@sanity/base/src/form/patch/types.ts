import {Path} from '@sanity/types'

/**
 * @internal
 */
export type PatchJSONValue =
  | number
  | string
  | boolean
  | {[key: string]: PatchJSONValue}
  | PatchJSONValue[]

/**
 * @internal
 */
export type PatchOrigin = 'remote' | 'local' | 'internal'

/**
 * @internal
 */
export type SetPatch = {
  path: Path
  type: 'set'
  origin?: PatchOrigin
  value: PatchJSONValue
}

/**
 * @internal
 */
export type IncPatch = {
  path: Path
  type: 'inc'
  origin?: PatchOrigin
  value: PatchJSONValue
}

/**
 * @internal
 */
export type DecPatch = {
  path: Path
  type: 'dec'
  origin?: PatchOrigin
  value: PatchJSONValue
}

/**
 * @internal
 */
export type SetIfMissingPatch = {
  path: Path
  origin?: PatchOrigin
  type: 'setIfMissing'
  value: PatchJSONValue
}

/**
 * @internal
 */
export type UnsetPatch = {
  path: Path
  origin?: PatchOrigin
  type: 'unset'
}

/**
 * @internal
 */
export type InsertPatchPosition = 'before' | 'after'

/**
 * @internal
 */
export type InsertPatch = {
  path: Path
  origin?: PatchOrigin
  type: 'insert'
  position: InsertPatchPosition
  items: PatchJSONValue[]
}

/**
 * @internal
 */
export type DiffMatchPatch = {
  path: Path
  type: 'diffMatchPatch'
  origin?: PatchOrigin
  value: string
}

/**
 * @internal
 */
export type Patch = SetPatch | SetIfMissingPatch | UnsetPatch | InsertPatch | DiffMatchPatch
